import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 按分类聚合已发布网站数
    const grouped = await prisma.site.groupBy({
      by: ["categoryId"],
      where: { isPublished: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    })

    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    })
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

    const total = grouped.reduce((sum, g) => sum + g._count.id, 0)

    const data = grouped.map((g) => ({
      category: categoryMap.get(g.categoryId) || "未分类",
      count: g._count.id,
      share: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error("Error fetching category distribution:", error)
    return NextResponse.json({ data: [], total: 0 }, { status: 500 })
  }
}
