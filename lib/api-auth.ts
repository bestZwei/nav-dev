import { cookies } from "next/headers"
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session"

export interface AdminSession {
  userId: string
  role: string
}

/**
 * 读取并校验当前请求的管理员会话。
 *
 * 供 API 路由与 Server Actions 统一使用：仅当会话 token 签名有效、
 * 未过期且角色为 ADMIN 时返回会话信息，否则返回 null。
 * 注意：此函数不查库，用户是否仍存在由 /api/admin/me 负责兜底校验。
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  const session = await verifySessionToken(token)
  if (!session || session.role !== "ADMIN") return null
  return session
}
