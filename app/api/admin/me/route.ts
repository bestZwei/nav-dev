import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    })

    if (!user) {
      // user_id 指向的用户已不存在（数据库重建/切换部署模式的残留会话）：
      // 清除无效会话 cookie，使 middleware（仅检查 cookie）与本接口（查库校验）判断恢复一致
      const response = NextResponse.json({ user: null }, { status: 401 })
      response.cookies.delete("user_id")
      response.cookies.delete("user_role")
      return response
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
