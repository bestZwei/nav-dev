import { cookies } from "next/headers"
import { prisma } from "./prisma"

// 深度鉴权：查库验证会话指向的用户真实存在且为管理员。
//
// middleware（Edge，无法查库）只能校验 cookie 的存在性与角色值，
// 而 cookie 是客户端可伪造的（user_role=ADMIN 只是明文值），
// 因此所有敏感操作必须在 action / route 层调用本函数做数据库级校验：
//   if (!(await requireAdmin()).ok) return { success: false, error: "Unauthorized" }
export async function requireAdmin(): Promise<{ ok: boolean; userId?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId || userRole !== "ADMIN") return { ok: false }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user || user.role !== "ADMIN") return { ok: false }

  return { ok: true, userId: user.id }
}
