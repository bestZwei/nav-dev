import { NextResponse } from "next/server"
import { prisma, dbConfig } from "@/lib/prisma"
import { getAdminSession } from "@/lib/api-auth"

interface DatabaseInfo {
  type: "sqlite" | "postgres"
  status: "connected" | "error"
  host?: string
  port?: number
  database?: string
  username?: string
  sqlitePath?: string
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await prisma.$queryRaw`SELECT 1`

    if (dbConfig.provider === "sqlite") {
      return NextResponse.json({
        type: "sqlite",
        status: "connected",
        sqlitePath: dbConfig.sqlitePath,
      } satisfies DatabaseInfo)
    }

    // 解析 PostgreSQL 连接串：postgresql://user:password@host:port/database
    // 库名剥掉 ?sslmode=... 等查询参数
    const match = dbConfig.url.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/,
    )
    if (match) {
      const [, username, , host, port, database] = match
      return NextResponse.json({
        type: "postgres",
        status: "connected",
        host,
        port: parseInt(port),
        database,
        username,
      } satisfies DatabaseInfo)
    }
    return NextResponse.json({ type: "postgres", status: "connected" } satisfies DatabaseInfo)
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        type: dbConfig.provider,
        status: "error" as const,
      },
      { status: 503 },
    )
  }
}
