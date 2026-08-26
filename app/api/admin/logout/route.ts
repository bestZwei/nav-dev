import { NextResponse } from "next/server"
import { clearSessionCookies } from "@/lib/auth-cookies"

export async function POST() {
  const response = NextResponse.json({ success: true, message: "登出成功" })

  // 清除签名会话 cookie（含旧版明文 cookie）
  return clearSessionCookies(response)
}
