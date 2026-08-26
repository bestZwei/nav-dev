import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/api-auth"

// 数据库上传截图的读取服务：
// - 已发布站点的截图对所有访客开放（immutable 缓存）
// - 未发布站点的截图仅对登录管理员开放（不缓存）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const screenshot = await prisma.screenshot.findUnique({
      where: { id },
      select: {
        data: true,
        mimeType: true,
        source: true,
        site: {
          select: { isPublished: true },
        },
      },
    })

    if (!screenshot || screenshot.source !== "UPLOAD" || !screenshot.data || !screenshot.mimeType) {
      return NextResponse.json({ error: "Screenshot not found" }, { status: 404 })
    }

    let cacheControl = "public, max-age=31536000, immutable"

    if (!screenshot.site.isPublished) {
      // 未发布：校验管理员身份（签名会话）
      if (!(await getAdminSession())) {
        return NextResponse.json({ error: "Screenshot not found" }, { status: 404 })
      }
      cacheControl = "private, no-store"
    }

    const buffer = Buffer.from(screenshot.data, "base64")
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": screenshot.mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": cacheControl,
      },
    })
  } catch (error) {
    console.error("Error fetching screenshot:", error)
    return NextResponse.json({ error: "Failed to fetch screenshot" }, { status: 500 })
  }
}
