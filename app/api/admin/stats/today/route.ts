import { NextResponse } from "next/server"
// 装配层薄壳：今日统计逻辑归属 visit-tracking 插件
import { getTodayVisitStats } from "@/plugins/visit-tracking/actions"
import { getAdminSession } from "@/lib/api-auth"

export async function GET() {
  // 与其他 stats 路由口径统一：显式鉴权，不依赖插件 action 内部的 requireAdmin
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const result = await getTodayVisitStats()
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.error === "Unauthorized" ? 401 : 500 })
    }
    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Error fetching today visit stats:", error)
    return NextResponse.json({ error: "Failed to fetch today visit stats" }, { status: 500 })
  }
}
