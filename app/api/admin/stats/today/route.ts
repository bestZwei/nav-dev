import { NextResponse } from "next/server"
// 装配层薄壳：今日统计逻辑归属 visit-tracking 插件
import { getTodayVisitStats } from "@/plugins/visit-tracking/actions"

export async function GET() {
  const result = await getTodayVisitStats()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error === "Unauthorized" ? 401 : 500 })
  }
  return NextResponse.json(result.data)
}
