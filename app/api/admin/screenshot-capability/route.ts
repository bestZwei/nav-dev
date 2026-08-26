import { NextResponse } from "next/server"
import { checkScreenshotUploadCapability } from "@/lib/actions"
import { getAdminSession } from "@/lib/api-auth"

const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024

// 截图上传能力检测：判定当前环境数据库是否可写
// 结果：supported=false 时管理界面禁用本地上传，仅保留 URL 方式
export async function GET() {
  try {
    if (!(await getAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await checkScreenshotUploadCapability()
    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Capability check failed" }, { status: 500 })
    }

    return NextResponse.json({
      supported: result.data.supported,
      reason: result.data.reason ?? null,
      maxFileSize: MAX_SCREENSHOT_BYTES,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"],
    })
  } catch (error) {
    console.error("Error checking screenshot capability:", error)
    return NextResponse.json({ error: "Failed to check capability" }, { status: 500 })
  }
}
