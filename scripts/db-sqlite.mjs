// SQLite 建表入口（npm run db:push / db:setup 调用）：
// 统一以绝对路径解析 SQLITE_URL，规避 Prisma CLI 对 file: 相对路径
// 按 schema 所在目录解析、与运行时按 cwd 解析不一致的歧义
import { execSync } from 'node:child_process'
import path from 'node:path'

const sqlitePath = path.resolve(process.env.SQLITE_PATH || './data/nav.db')

execSync(
  'npx prisma db push --schema prisma/schema.sqlite.prisma --accept-data-loss --skip-generate',
  { stdio: 'inherit', env: { ...process.env, SQLITE_URL: `file:${sqlitePath}` } },
)

console.log(`[db-sqlite] SQLite schema 已同步：${sqlitePath}`)
