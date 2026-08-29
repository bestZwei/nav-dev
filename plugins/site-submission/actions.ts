"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getCurrentWorkspace } from "@/lib/workspace"
import {
  assertPluginEnabled,
  firePluginWebhook,
  getPluginConfig,
} from "@/lib/plugins/runtime"
import { PluginDisabledError } from "@/lib/plugins/types"
import {
  PLUGIN_ID,
  SUBMISSION_CONFIG_FIELDS,
  WEBHOOK_SITE_SUBMITTED,
  type SubmitSiteErrorCode,
} from "./constants"

type ActionResult =
  | { success: true; message?: string }
  | { success: false; code: SubmitSiteErrorCode; maxPerDay?: number }

// 站点 URL 协议白名单：仅允许 http/https，
// 防止提交 javascript: 等协议 URL 造成存储型 XSS
function isSafeSiteUrl(url: unknown): boolean {
  if (typeof url !== "string" || url.trim().length === 0) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// 访客投稿（site-submission 插件）：校验 → 插件守卫 → 每日限额 →
// 保存为未发布站点 → 触发 webhook。错误以 code 返回，文案由客户端按语言映射
export async function submitSite(data: {
  name: string
  url: string
  description: string
  categoryId: string
  submitterContact?: string
}): Promise<ActionResult> {
  try {
    await assertPluginEnabled(PLUGIN_ID)
  } catch (error) {
    if (error instanceof PluginDisabledError) {
      return { success: false, code: "PLUGIN_DISABLED" }
    }
    throw error
  }

  // 服务端二次校验（客户端 zod 校验可被绕过）
  const name = typeof data.name === "string" ? data.name.trim() : ""
  const description = typeof data.description === "string" ? data.description.trim() : ""
  if (!name || name.length > 50 || !description || description.length > 200) {
    return { success: false, code: "SUBMIT_FAILED" }
  }
  if (!isSafeSiteUrl(data.url)) {
    return { success: false, code: "INVALID_URL" }
  }

  // 分类归属校验：分类必须存在于当前工作区，防止跨工作区伪造 categoryId
  const workspace = await getCurrentWorkspace()
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, workspaceId: workspace.id },
    select: { id: true },
  })
  if (!category) {
    return { success: false, code: "SUBMIT_FAILED" }
  }

  // 获取提交者 IP（Server Action 场景通过 headers 读取）
  const requestHeaders = await headers()
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "local"

  // 每日限额（按提交者 IP，仅对可识别 IP 限制）
  const config = await getPluginConfig(PLUGIN_ID, SUBMISSION_CONFIG_FIELDS)
  const maxPerDay = typeof config.submissionMaxPerDay === "number" ? config.submissionMaxPerDay : 3
  if (ipAddress !== "local") {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentSubmissions = await prisma.site.count({
      where: {
        submitterIp: ipAddress,
        createdAt: { gte: oneDayAgo },
      },
    })
    if (recentSubmissions >= maxPerDay) {
      return { success: false, code: "RATE_LIMITED", maxPerDay }
    }
  }

  try {
    await prisma.site.create({
      data: {
        name,
        url: data.url,
        description,
        submitterContact: data.submitterContact?.trim() || null,
        submitterIp: ipAddress,
        categoryId: category.id,
        isPublished: false,
        order: 0,
      },
    })

    // 通知订阅了 siteSubmitted 事件的上传插件（失败不阻塞投稿）
    await firePluginWebhook(WEBHOOK_SITE_SUBMITTED, {
      name,
      url: data.url,
      description,
    })

    revalidatePath("/admin/sites")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error submitting site:", error)
    return { success: false, code: "SUBMIT_FAILED" }
  }
}

// 投稿弹窗分类列表：当前工作区全部分类（公开数据，访客可见）
export async function getSubmissionCategories(): Promise<
  Array<{ id: string; name: string; slug: string }>
> {
  try {
    const workspace = await getCurrentWorkspace()
    const categories = await prisma.category.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, slug: true },
      orderBy: { order: "asc" },
    })
    return categories
  } catch {
    return []
  }
}
