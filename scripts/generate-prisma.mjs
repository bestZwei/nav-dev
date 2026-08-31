#!/usr/bin/env node
// 双 client 生成入口（postinstall / CI / Docker 构建调用）：
// 1. 从主 schema 重新生成 SQLite schema 变体，防止两份文件漂移
// 2. 分别 generate postgres / sqlite 两个 client 到 generated/ 目录
// 运行时由 lib/db-config.ts 按数据库配置选择实例化哪一个。
import { execSync } from 'node:child_process'

function run(cmd, env = {}) {
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } })
}

run('node scripts/sync-schemas.mjs')

// generate 阶段不要求真实连接串，占位避免 env 缺失告警中断
run('npx prisma generate --schema prisma/schema.prisma', {
  POSTGRES_URL: process.env.POSTGRES_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
})
run('npx prisma generate --schema prisma/schema.sqlite.prisma', {
  SQLITE_URL: process.env.SQLITE_URL || 'file:./data/nav.db',
})

console.log('[generate-prisma] 双 client 生成完成：generated/prisma-postgres + generated/prisma-sqlite')
