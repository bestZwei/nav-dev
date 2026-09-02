import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import {
  getExtensionMeta,
  submitSiteViaExtension,
} from "@/plugins/browser-extension/server"

// CORS：扩展/第三方客户端以 Bearer 令牌调用（非 Cookie 凭证），
// 允许任意来源携带 Authorization 头，是令牌型公开 API 的标准做法
function withCors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  )
  return response
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

// 浏览器扩展直连收录 API。
// 鉴权与业务在插件层（plugins/browser-extension）：
// 插件启用 + Bearer <extensionToken>（插件管理页生成）双条件放行
export async function GET(request: NextRequest) {
  const result = await getExtensionMeta(request)
  if (!result.success) {
    const status = result.error === "UNAUTHORIZED" ? 401 : 500
    return withCors(
      NextResponse.json({ success: false, error: result.error }, { status })
    )
  }
  return withCors(
    NextResponse.json({
      success: true,
      data: { workspaces: result.workspaces, categories: result.categories },
    })
  )
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return withCors(
      NextResponse.json({ success: false, error: "INVALID_BODY" }, { status: 400 })
    )
  }
  const result = await submitSiteViaExtension(request, {
    name: String(body.name ?? ""),
    url: String(body.url ?? ""),
    description: String(body.description ?? ""),
    categoryId: String(body.categoryId ?? ""),
    workspaceId: String(body.workspaceId ?? ""),
  })
  if (!result.success) {
    const status =
      result.error === "UNAUTHORIZED"
        ? 401
        : result.error?.startsWith("INVALID") || result.error === "CATEGORY_MISMATCH"
          ? 400
          : 500
    return withCors(
      NextResponse.json({ success: false, error: result.error }, { status })
    )
  }
  revalidatePath("/")
  revalidatePath("/admin/sites")
  return withCors(
    NextResponse.json({ success: true, data: { siteId: result.siteId } })
  )
}
