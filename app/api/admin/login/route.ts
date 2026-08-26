import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { jsonResponseWithSession } from "@/lib/auth-cookies"
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/login-rate-limit"

// 定义登录验证schema
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要6个字符"),
})

// 提取客户端 IP：反向代理场景取 x-forwarded-for 首个地址
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]!.trim()
  }
  return request.headers.get("x-real-ip") || "unknown"
}

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
    const clientIp = getClientIp(request)

    // 速率限制：IP / 账号任一锁定即拒绝（暴力破解防护）
    const rateLimit = checkLoginRateLimit(clientIp, email)
    if (!rateLimit.allowed) {
      const minutes = Math.ceil((rateLimit.retryAfterSeconds ?? 60) / 60)
      return NextResponse.json(
        { error: `尝试次数过多，请 ${minutes} 分钟后再试` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } }
      )
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      recordLoginFailure(clientIp, email)
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      recordLoginFailure(clientIp, email)
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      )
    }

    // 检查是否是管理员
    if (user.role !== "ADMIN") {
      recordLoginFailure(clientIp, email)
      return NextResponse.json(
        { error: "无权限访问管理后台" },
        { status: 403 }
      )
    }

    recordLoginSuccess(email)

    // 创建 session：双 Set-Cookie 策略（Lax 保底 + None/Secure 覆盖），
    // HTTP 与 HTTPS、直连与反向代理、iframe 预览环境均可用，详见 lib/auth-cookies.ts
    return jsonResponseWithSession(
      { success: true, message: "登录成功" },
      user.id,
      user.role
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    )
  }
}
