// 数据库配置判定（单一事实源）。
// entrypoint.sh 内置同语义的 shell 版本判定；两处规则必须保持一致：
//   1. DB_PROVIDER 显式指定 sqlite / postgres 时优先生效
//   2. 未指定时：POSTGRES_URL 或 postgres 协议的 DATABASE_URL 非空 → postgres
//   3. 否则 → sqlite（默认，文件路径由 SQLITE_PATH 指定，缺失时自动创建）
import path from "node:path"

export type DbProvider = "sqlite" | "postgres"

export const DEFAULT_SQLITE_PATH = "./data/nav.db"

export interface DbConfig {
  provider: DbProvider
  /** Prisma datasource url：postgres 连接串或 file:<绝对路径> */
  url: string
  /** sqlite 模式下的数据库文件绝对路径 */
  sqlitePath?: string
}

function isPostgresUrl(value: string | undefined): boolean {
  return typeof value === "string" && /^postgres(ql)?:\/\//i.test(value.trim())
}

export function resolveDbConfig(env: NodeJS.ProcessEnv = process.env): DbConfig {
  const explicit = env.DB_PROVIDER?.trim().toLowerCase()
  const postgresUrl = env.POSTGRES_URL?.trim() || env.DATABASE_URL?.trim() || ""

  const provider: DbProvider =
    explicit === "postgres" || explicit === "sqlite"
      ? (explicit as DbProvider)
      : isPostgresUrl(postgresUrl)
        ? "postgres"
        : "sqlite"

  if (provider === "postgres") {
    if (!isPostgresUrl(postgresUrl)) {
      throw new Error(
        "[db-config] DB_PROVIDER=postgres 但未提供有效连接串：" +
          "请设置 POSTGRES_URL（或 DATABASE_URL，需 postgres:// 前缀），或改用默认 SQLite 模式",
      )
    }
    return { provider, url: postgresUrl }
  }

  // 统一解析为绝对路径：Prisma CLI 对 file: 相对路径按 schema 所在目录解析，
  // client 运行时按 cwd 解析，两端基准不同会造成 CLI 与应用指向不同文件
  const sqlitePath = path.resolve(env.SQLITE_PATH?.trim() || DEFAULT_SQLITE_PATH)
  return { provider, url: `file:${sqlitePath}`, sqlitePath }
}
