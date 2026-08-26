import { NextResponse } from "next/server"

// 会话 cookie 统一封装。
//
// 采用"双 Set-Cookie"策略：同名 cookie 连发两份，浏览器自动保留它能接受的那份：
// 1. SameSite=Lax（非 Secure）：HTTP 部署（直连 IP:port 或代理注入了
//    x-forwarded-proto: https 头）下浏览器会拒绝 Secure cookie，此份保底生效
// 2. SameSite=None + Secure：HTTPS 部署下两份均合法，此份覆盖前一份，
//    iframe / 反向代理预览环境可正常携带
//
// 注意：NextResponse.cookies / 框架的 cookie 管理对同名 Set-Cookie 是覆盖语义，
// 双发必须通过 Headers.append 在响应构造时注入。

export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function serializeSessionCookie(
  name: string,
  value: string,
  attrs: { sameSite: "Lax" | "None"; secure: boolean }
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${SESSION_COOKIE_MAX_AGE}`,
    `SameSite=${attrs.sameSite}`,
  ]
  if (attrs.secure) parts.push("Secure")
  return parts.join("; ")
}

/**
 * 构造带双属性会话 cookie 的 JSON 响应。
 *
 * 顺序保证 Lax 先于 None/Secure：HTTP 环境浏览器拒绝后者、保留前者；
 * HTTPS 环境两者均合法，后者按 RFC 6265 覆盖前者，最终生效 None+Secure。
 */
export function jsonResponseWithSession(
  body: unknown,
  userId: string,
  userRole: string,
  status = 200
): NextResponse {
  const headers = new Headers({ "content-type": "application/json" })
  for (const [name, value] of [
    ["user_id", userId],
    ["user_role", userRole],
  ] as const) {
    headers.append(
      "Set-Cookie",
      serializeSessionCookie(name, value, { sameSite: "Lax", secure: false })
    )
    headers.append(
      "Set-Cookie",
      serializeSessionCookie(name, value, { sameSite: "None", secure: true })
    )
  }
  return new NextResponse(JSON.stringify(body), { status, headers })
}
