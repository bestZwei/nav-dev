import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/api-auth"

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const total = await prisma.category.count()

    return NextResponse.json({ total })
  } catch (error) {
    console.error("Error fetching category stats:", error)
    return NextResponse.json({ total: 0 }, { status: 500 })
  }
}
