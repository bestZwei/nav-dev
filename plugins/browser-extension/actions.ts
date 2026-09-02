"use server"

import { randomBytes } from "crypto"
import { getAdminSession } from "@/lib/api-auth"
import { updatePluginConfig } from "@/lib/plugins/plugin-actions"
import { PLUGIN_ID } from "./constants"

// 与 plugin-actions 相同的管理员判定（双层校验：签名 + 角色确认）
async function requireAdminRole(): Promise<{ success: false; error: string } | null> {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" }
  }
  return null
}

// 管理员生成/轮换扩展访问令牌：随机 32 字节，写入插件配置。
// 生成后由管理页展示并复制到浏览器扩展的选项页
export async function generateExtensionToken(): Promise<{
  success: boolean
  error?: string
  token?: string
}> {
  const unauthorized = await requireAdminRole()
  if (unauthorized) return { success: false, error: "UNAUTHORIZED" }
  try {
    const token = randomBytes(32).toString("base64url")
    const result = await updatePluginConfig(PLUGIN_ID, {
      extensionToken: token,
    })
    if (!result.success) {
      return { success: false, error: "Failed to save extension token" }
    }
    return { success: true, token }
  } catch (error) {
    console.error("[browser-extension] generate token error:", error)
    return { success: false, error: "SERVER_ERROR" }
  }
}
