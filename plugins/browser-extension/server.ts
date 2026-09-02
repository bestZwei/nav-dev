import { prisma } from "@/lib/prisma"
import { getPluginConfig, assertPluginEnabled } from "@/lib/plugins/runtime"
import { EXTENSION_CONFIG_FIELDS, PLUGIN_ID } from "./constants"

export interface ExtensionWorkspaceOption {
  id: string
  name: string
  slug: string
  isDefault: boolean
}

export interface ExtensionCategoryOption {
  id: string
  name: string
  workspaceId: string
}

export interface ExtensionSubmitResult {
  success: boolean
  error?: string
  siteId?: string
}

// 令牌鉴权：Bearer 与插件配置比对（常量时间比较防时序侧信道）
export async function verifyExtensionToken(request: Request): Promise<boolean> {
  const header = request.headers.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
  if (!token) return false
  const config = await getPluginConfig(PLUGIN_ID, EXTENSION_CONFIG_FIELDS)
  const expected =
    typeof config.extensionToken === "string" ? config.extensionToken : ""
  if (!expected || expected.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return diff === 0
}

async function assertExtensionAccess(request: Request): Promise<boolean> {
  try {
    await assertPluginEnabled(PLUGIN_ID)
  } catch {
    return false
  }
  return verifyExtensionToken(request)
}

// 工作区 + 分类元数据（扩展下拉数据源；需有效令牌且插件启用）
export async function getExtensionMeta(request: Request): Promise<{
  success: boolean
  error?: string
  workspaces?: ExtensionWorkspaceOption[]
  categories?: ExtensionCategoryOption[]
}> {
  if (!(await assertExtensionAccess(request))) {
    return { success: false, error: "UNAUTHORIZED" }
  }
  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { id: true, name: true, slug: true, isDefault: true },
    })
    const categories = await prisma.category.findMany({
      orderBy: [{ workspaceId: "asc" }, { order: "asc" }],
      select: { id: true, name: true, workspaceId: true },
    })
    return { success: true, workspaces, categories }
  } catch (error) {
    console.error("[browser-extension] meta error:", error)
    return { success: false, error: "SERVER_ERROR" }
  }
}

// 直连收录：令牌等价管理员权限，站点直接发布到指定工作区分类
export async function submitSiteViaExtension(
  request: Request,
  data: {
    name: string
    url: string
    description: string
    categoryId: string
    workspaceId: string
  }
): Promise<ExtensionSubmitResult> {
  if (!(await assertExtensionAccess(request))) {
    return { success: false, error: "UNAUTHORIZED" }
  }
  try {
    const name = typeof data.name === "string" ? data.name.trim() : ""
    const url = typeof data.url === "string" ? data.url.trim() : ""
    const description =
      typeof data.description === "string" ? data.description.trim() : ""
    if (!name || name.length > 50) return { success: false, error: "INVALID_NAME" }
    if (description.length > 200) return { success: false, error: "INVALID_DESC" }
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return { success: false, error: "INVALID_URL" }
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { success: false, error: "INVALID_URL" }
    }
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, workspaceId: data.workspaceId },
      select: { id: true },
    })
    if (!category) return { success: false, error: "CATEGORY_MISMATCH" }

    const site = await prisma.site.create({
      data: {
        name,
        url,
        description,
        categoryId: category.id,
        isPublished: true,
        order: 0,
      },
      select: { id: true },
    })
    return { success: true, siteId: site.id }
  } catch (error) {
    console.error("[browser-extension] submit error:", error)
    return { success: false, error: "SERVER_ERROR" }
  }
}
