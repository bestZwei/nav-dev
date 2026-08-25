import { NextRequest, NextResponse } from "next/server"
import { getSiteDetail } from "@/lib/actions"

// 获取已发布站点的详情内容（前台弹窗按需加载）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getSiteDetail(id)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    // 未发布站点对公开访问返回 404，与公开列表口径一致
    if (!result.data.isPublished) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 })
    }

    return NextResponse.json(result.data, {
      headers: {
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error fetching site detail:", error)
    return NextResponse.json({ error: "Failed to fetch site detail" }, { status: 500 })
  }
}
