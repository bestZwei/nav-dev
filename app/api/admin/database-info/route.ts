import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdminSession } from "@/lib/api-auth"

interface DatabaseInfo {
  type: string
  status: "connected" | "error"
  host?: string
  port?: number
  database?: string
  username?: string
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`

    // 从 DATABASE_URL 解析数据库信息
    const databaseUrl = process.env.DATABASE_URL || ""
    let dbInfo: DatabaseInfo = {
      type: "In-Memory / PostgreSQL",
      status: "connected",
    }

    if (databaseUrl) {
      try {
        // 解析 PostgreSQL 连接字符串: postgresql://user:password@host:port/database
        // 库名剥掉 ?sslmode=... 等查询参数
        const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/)
        if (match) {
          const [, username, , host, port, database] = match
          dbInfo = {
            ...dbInfo,
            type: "PostgreSQL",
            host,
            port: parseInt(port),
            database,
            username,
          }
        }
      } catch (error) {
        console.error("Failed to parse DATABASE_URL:", error)
      }
    }

    return NextResponse.json(dbInfo)
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        type: "PostgreSQL",
        status: "error" as const,
      },
      { status: 503 }
    )
  }
}
