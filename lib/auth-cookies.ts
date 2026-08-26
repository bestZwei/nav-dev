import { NextResponse } from "next/server"
import {
  LEGACY_COOKIE_NAMES,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./session"

// 会话 cookie 统一封装。
//
// 会话凭证为单个签名 token（见 lib/session.ts），不再以明文存放 user_id/user_role。
//
// 采用"双 Set-Cookie"策略：同名 cookie 连发两份，浏览器自动保留它能接受的那份：
// 1. SameSite=Lax（非 Secure）：HTTP 部署（直连 IP:port 或代理注入了
//    x-forwarded-proto: https 头）下浏览器会拒绝 Secure cookie，此份保底生效
// 2. SameSite=None + Secure：HTTPS 部署下两份均合法，此份覆盖前一份，
//    iframe / 反向代理预览环境可正常携带
//
// 注意：NextResponse.cookies / 框架的 cookie 管理对同名 Set-Cookie 是覆盖语义，
// 双发必须通过 Headers.append 在响应构造时注入。

function serializeSessionCookie(
  value: string,
  attrs: { sameSite: "Lax" | "None"; secure: boolean }
): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    `SameSite=${attrs.sameSite}`,
  ]
  if (attrs.secure) parts.push("Secure")
  return parts.join("; ")
}

/**
 * 构造带会话 cookie 的 JSON 响应。
 *
 * 顺序保证 Lax 先于 None/Secure：HTTP 环境浏览器拒绝后者、保留前者；
 * HTTPS 环境两者均合法，后者按 RFC 6265 覆盖前者，最终生效 None+Secure。
 */
export function jsonResponseWithSession(
  body: unknown,
  sessionToken: string,
  status = 200
): NextResponse {
  const headers = new Headers({ "content-type": "application/json" })
  headers.append(
    "Set-Cookie",
    serializeSessionCookie(sessionToken, { sameSite: "Lax", secure: false })
  )
  headers.append(
    "Set-Cookie",
    serializeSessionCookie(sessionToken, { sameSite: "None", secure: true })
  )
  // 清理旧版明文会话 cookie，避免脏会话残留干扰排障
  for (const name of LEGACY_COOKIE_NAMES) {
    headers.append(
      "Set-Cookie",
      `${name}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
    )
  }
  return new NextResponse(JSON.stringify(body), { status, headers })
}

/**
 * 清除会话 cookie（登出、会话失效场景），同时清理旧版明文 cookie。
 */
export function clearSessionCookies<T extends NextResponse>(response: T): T {
  response.cookies.delete(SESSION_COOKIE_NAME)
  for (const name of LEGACY_COOKIE_NAMES) {
    response.cookies.delete(name)
  }
  return response
}
