import { NextRequest, NextResponse } from "next/server"
import { getVisitFrequency } from "@/plugins/visit-tracking/actions"
import { getAdminSession } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const searchParams = request.nextUrl.searchParams
    // clamp：NaN/负数会退化为全表扫描（1-365 天），action 内有二次兜底
    const parsed = parseInt(searchParams.get('days') || '30', 10)
    const days = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 365) : 30

    const result = await getVisitFrequency(days)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ frequency: result.data })
  } catch (error) {
    console.error("Error fetching visit frequency:", error)
    return NextResponse.json({ error: "Failed to fetch visit frequency" }, { status: 500 })
  }
}
