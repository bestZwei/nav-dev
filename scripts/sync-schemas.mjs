#!/usr/bin/env node
// 从 prisma/schema.prisma（PostgreSQL 主文件，唯一维护点）生成 SQLite 变体：
// 仅替换 datasource.provider、datasource.url 的 env 名与 generator output 路径，
// models 部分逐字节保持一致。禁止手改 schema.sqlite.prisma。
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'prisma/schema.prisma'
const TARGET = 'prisma/schema.sqlite.prisma'

let content = readFileSync(SOURCE, 'utf8')

const replacements = [
  // datasource：provider 与 url 变量名
  [/provider\s*=\s*"postgresql"/, 'provider = "sqlite"'],
  [/url\s*=\s*env\("POSTGRES_URL"\)/, 'url      = env("SQLITE_URL")'],
  // generator：client 输出目录
  [/output\s*=\s*"\.\.\/generated\/prisma-postgres"/, 'output   = "../generated/prisma-sqlite"'],
]

for (const [pattern, replacement] of replacements) {
  if (!pattern.test(content)) {
    console.error(`[sync-schemas] 未在 ${SOURCE} 中匹配到预期片段：${pattern}`)
    process.exit(1)
  }
  content = content.replace(pattern, replacement)
}

writeFileSync(TARGET, content)
console.log(`[sync-schemas] 已生成 ${TARGET}（models 与主 schema 一致）`)
