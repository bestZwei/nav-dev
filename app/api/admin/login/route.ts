import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { jsonResponseWithSession } from "@/lib/auth-cookies"
import { createSessionToken } from "@/lib/session"

// 定义登录验证schema
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证输入
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 检查是否是管理员
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "无权限访问管理后台" },
        { status: 403 }
      )
    }

    // 创建 session：签发 HMAC 签名会话 token（双 Set-Cookie 策略：Lax 保底 + None/Secure 覆盖），
    // HTTP 与 HTTPS、直连与反向代理、iframe 预览环境均可用，详见 lib/auth-cookies.ts
    const sessionToken = await createSessionToken(user.id, user.role)
    return jsonResponseWithSession(
      { success: true, message: "登录成功" },
      sessionToken
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    )
  }
}
