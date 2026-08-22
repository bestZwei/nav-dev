import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [pendingSubmissions, weekNewSites, missingIcons] = await Promise.all([
      // 待审核的用户提交（未发布的用户提交站点）
      prisma.site.count({
        where: {
          submitterIp: { not: null },
          isPublished: false,
        },
      }),
      // 近 7 天新增网站
      prisma.site.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // 缺少图标的网站数
      prisma.site.count({
        where: {
          OR: [{ iconUrl: null }, { iconUrl: "" }],
        },
      }),
    ])

    return NextResponse.json({ pendingSubmissions, weekNewSites, missingIcons })
  } catch (error) {
    console.error("Error fetching content stats:", error)
    return NextResponse.json(
      { pendingSubmissions: 0, weekNewSites: 0, missingIcons: 0 },
      { status: 500 }
    )
  }
}
