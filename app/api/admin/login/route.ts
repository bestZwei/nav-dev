import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

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

    // 创建 session
    const response = NextResponse.json({ success: true, message: "登录成功" })

    // 按请求协议自适应 Cookie 属性：
    // - HTTPS：secure + sameSite=none，兼容 iframe / 反向代理预览环境
    // - HTTP（如内网 IP 直访的 Docker 部署）：浏览器会丢弃 secure cookie，降级为 sameSite=lax
    const forwardedProto = request.headers.get("x-forwarded-proto")
    const isHttps =
      request.nextUrl.protocol === "https:" || forwardedProto === "https"

    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? ("none" as const) : ("lax" as const),
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    response.cookies.set("user_id", user.id, cookieOptions)
    response.cookies.set("user_role", user.role, cookieOptions)

    response.cookies.set("user_role", user.role, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    )
  }
}
