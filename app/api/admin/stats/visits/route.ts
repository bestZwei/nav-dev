import { NextRequest, NextResponse } from "next/server"
import { getVisitStats } from "@/plugins/visit-tracking/actions"
import { getAdminSession } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    // clamp：NaN/负数回退默认值，0 表示「不限」（前端"全部"选项），
    // 上限防退化扫描（days ≤365 / limit ≤100），action 内有二次兜底
    const parseClamped = (raw: string | null, fallback: number, max: number) => {
      const parsed = parseInt(raw || String(fallback), 10)
      if (!Number.isFinite(parsed) || parsed < 0) return fallback
      return Math.min(parsed, max)
    }
    const days = parseClamped(searchParams.get('days'), 30, 365)
    const limit = parseClamped(searchParams.get('limit'), 10, 100)

    const result = await getVisitStats(days, limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error("Error fetching visit stats:", error)
    return NextResponse.json({ error: "Failed to fetch visit stats" }, { status: 500 })
  }
}
