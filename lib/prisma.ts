import { mkdirSync } from "node:fs"
import path from "node:path"
import { PrismaClient as SqlitePrismaClient, Prisma as SqlitePrisma } from "../generated/prisma-sqlite"
import { PrismaClient as PostgresPrismaClient } from "../generated/prisma-postgres"
import { resolveDbConfig, type DbConfig, type DbProvider } from "./db-config"

// 数据库客户端统一入口：默认 SQLite，配置 PostgreSQL 连接参数时切换为 PostgreSQL。
// 双 client 由 scripts/generate-prisma.mjs 按 prisma/schema{,.sqlite}.prisma 生成，
// 两份 schema 的 models 完全一致，类型结构相同，取 sqlite 版作为导出类型基准。

export type { DbConfig, DbProvider }
export { resolveDbConfig }
export type PrismaClient = SqlitePrismaClient
// Prisma 输入类型命名空间统一出口（WhereInput / UpdateInput 等），
// 业务代码不得直接 import "@prisma/client"（默认 output 与本项目双 client 结构无关）
export { SqlitePrisma as Prisma }

/**
 * 大小写不敏感的 contains 过滤：
 * PostgreSQL 需显式 mode: 'insensitive'；SQLite 的 LIKE 天生 ASCII 大小写不敏感，无需 mode。
 * 类型基准取自 sqlite client（无 mode 字段），postgres 分支经 cast 交付给对应 client。
 */
export function ciContains(value: string): SqlitePrisma.StringFilter {
  return dbProvider === "postgres"
    ? ({ contains: value, mode: "insensitive" } as SqlitePrisma.StringFilter)
    : { contains: value }
}

// 工作区记录类型（供 workspace 兜底与后台列表使用）：
// 标量字段来自真实 client 生成类型，domains 关系保持可选（仅 include 查询时存在）
export type WorkspaceItem = SqlitePrisma.WorkspaceGetPayload<{}> & {
  domains?: SqlitePrisma.DomainGetPayload<{}>[]
}

export const dbConfig = resolveDbConfig()
export const dbProvider: DbProvider = dbConfig.provider

function createPrisma(): PrismaClient {
  if (dbConfig.provider === "postgres") {
    const client = new PostgresPrismaClient({
      datasources: { db: { url: dbConfig.url } },
    })
    return client as unknown as PrismaClient
  }

  // SQLite：目录不存在时自动创建，数据库文件由引擎首次连接时创建
  if (dbConfig.sqlitePath) {
    mkdirSync(path.dirname(dbConfig.sqlitePath), { recursive: true })
  }
  return new SqlitePrismaClient({
    datasources: { db: { url: dbConfig.url } },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 无条件复用全局单例：开发模式 HMR 与生产（standalone 长驻进程）都需要
// 保证同一进程内只有一个连接池，SQLite 场景下还避免了多实例写竞争
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma()
globalForPrisma.prisma = prisma
