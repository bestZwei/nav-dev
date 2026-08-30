import { NextRequest, NextResponse } from "next/server"
import { getVisitStats } from "@/plugins/visit-tracking/actions"
import { getAdminSession } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    // clamp：NaN/负数会退化为全表扫描（1-365 天 / 1-100 条），action 内有二次兜底
    const parseClamped = (raw: string | null, fallback: number, min: number, max: number) => {
      const parsed = parseInt(raw || String(fallback), 10)
      if (!Number.isFinite(parsed)) return fallback
      return Math.min(Math.max(parsed, min), max)
    }
    const days = parseClamped(searchParams.get('days'), 30, 1, 365)
    const limit = parseClamped(searchParams.get('limit'), 10, 1, 100)

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
