import { NextResponse } from "next/server"
import { getAppVersion, isDevVersion } from "@/lib/version"

export const dynamic = "force-dynamic"

// 公开端点不暴露 gitSha：构建指纹可被用于比对特定 commit 的已知漏洞。
// 完整构建信息仅通过管理员端 /api/admin/version 提供
export async function GET() {
  const version = getAppVersion()

  return NextResponse.json({
    version,
    isDev: isDevVersion(version),
    timestamp: new Date().toISOString(),
  })
}
