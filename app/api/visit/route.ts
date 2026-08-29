import { NextRequest, NextResponse } from "next/server"
// 装配层薄壳：埋点逻辑归属 visit-tracking 插件
import { recordVisit } from "@/plugins/visit-tracking/actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteId } = body

    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 })
    }
    const result = await recordVisit(siteId, request)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording visit:", error)
    return NextResponse.json({ error: "Failed to record visit" }, { status: 500 })
  }
}
