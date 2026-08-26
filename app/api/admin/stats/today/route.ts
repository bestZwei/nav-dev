import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/api-auth"

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    const [today, yesterday] = await Promise.all([
      prisma.visit.count({
        where: { visitedAt: { gte: todayStart } },
      }),
      prisma.visit.count({
        where: {
          visitedAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),
    ])

    // 环比增长率：(今日 - 昨日) / 昨日 * 100，昨日为 0 时今日大于 0 记为 100
    let growthRate: number | null = null
    if (yesterday > 0) {
      growthRate = Math.round(((today - yesterday) / yesterday) * 100)
    } else if (today > 0) {
      growthRate = 100
    }

    return NextResponse.json({ today, yesterday, growthRate })
  } catch (error) {
    console.error("Error fetching today stats:", error)
    return NextResponse.json(
      { today: 0, yesterday: 0, growthRate: null },
      { status: 500 }
    )
  }
}
