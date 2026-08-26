import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 定义受保护的路由
const protectedRoutes = ["/admin"]
const authRoutes = ["/admin/login"]

// 管理 API：统一在 middleware 层鉴权。
// 此前 matcher 只覆盖 /admin 页面，/api/admin/* 完全裸奔，
// 未登录即可篡改系统设置、读取数据库连接信息（越权漏洞）
const protectedApiRoutes = ["/api/admin"]
// 登录接口自身放行
const apiAuthExempt = ["/api/admin/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 获取用户 session
  const userId = request.cookies.get("user_id")?.value
  const userRole = request.cookies.get("user_role")?.value

  // ---- 管理 API 鉴权：未认证返回 401 JSON（不重定向） ----
  const isProtectedApi = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  )
  if (isProtectedApi) {
    const isExempt = apiAuthExempt.some((route) => pathname.startsWith(route))
    if (isExempt) {
      return NextResponse.next()
    }
    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // ---- 页面路由：原有逻辑 ----
  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // 检查是否是认证路由（登录页）
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // 如果已登录且访问登录页，重定向到 dashboard
  if (userId && isAuthRoute) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url))
  }

  // 如果未登录且访问受保护的路由，重定向到登录页
  if (!userId && isProtectedRoute && !isAuthRoute) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 如果已登录但不是管理员，清除残留会话并回到登录页。
  // 按"未登录"处理而不是跳首页：cookie 指向的用户可能在数据库中已不存在
  // （数据库重建/切换部署模式留下的脏会话），跳登录页让用户重新登录自愈
  if (userId && isProtectedRoute && userRole !== "ADMIN") {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete("user_id")
    response.cookies.delete("user_role")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
