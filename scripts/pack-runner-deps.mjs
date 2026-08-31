#!/usr/bin/env node
// 构建 runner 镜像层所需的 node_modules 闭包打包器。
//
// 背景：runner 阶段只携带 entrypoint.sh 数据库初始化与 seed 所需的依赖
// （prisma CLI / tsx / bcryptjs / @prisma/client），静态白名单在 Prisma
// 升级引入新依赖（如 effect → fast-check）时反复遗漏。本脚本在 builder
// 内按依赖树 BFS 动态计算闭包并拷贝到 .runner-node-modules，Dockerfile
// 只需整体 COPY 该目录，不再维护清单。
//
// 入口（entrypoint.sh 与 seed 链实际用到的包）：
//   prisma         - CLI（db push / migrate deploy / migrate diff / resolve）
//   @prisma/client - entrypoint 的 node -e 探测脚本经 generated client 加载
//   tsx            - prisma/seed.ts 直跑（依赖 esbuild 链）
//   bcryptjs       - seed 口令哈希
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'node_modules')
const DEST = path.join(ROOT, '.runner-node-modules')

const ENTRYPOINTS = ['prisma', '@prisma/client', 'tsx', 'bcryptjs']
// 整 scope 拷贝（平台二进制包：@esbuild/linux-*、@prisma/engines 等，
// 依赖声明与实际安装的平台包一一对应，闭包算法无法枚举，直接整目录带走）
const WHOLE_SCOPES = ['@prisma', '@esbuild']
// entrypoint 经 npx 调用的 CLI 链接
const BINS = ['prisma', 'tsx', 'esbuild']

const seen = new Set()
const queue = [...ENTRYPOINTS]
const packages = new Set(ENTRYPOINTS)

while (queue.length > 0) {
  const name = queue.pop()
  if (seen.has(name)) continue
  seen.add(name)
  const pkgPath = path.join(SRC, name)
  const manifest = path.join(pkgPath, 'package.json')
  if (!existsSync(manifest)) {
    // 平台 optional（fsevents）或已嵌套于其他包内的依赖：随宿主包整目录带走
    console.log(`[pack-runner-deps] 跳过（顶层不存在，随宿主或平台专属）: ${name}`)
    continue
  }
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
  for (const section of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const dep of Object.keys(pkg[section] || {})) {
      queue.push(dep)
      if (!dep.startsWith('@types/') && !dep.startsWith('@prisma/')) packages.add(dep)
    }
  }
}

if (existsSync(DEST)) rmSync(DEST, { recursive: true })
mkdirSync(path.join(DEST, '.bin'), { recursive: true })

for (const scope of WHOLE_SCOPES) {
  const scopeDir = path.join(SRC, scope)
  if (!existsSync(scopeDir)) continue
  for (const entry of readdirSync(scopeDir)) {
    const pkgName = `${scope}/${entry}`
    cpSync(path.join(scopeDir, entry), path.join(DEST, scope, entry), { recursive: true })
    console.log(`[pack-runner-deps] + ${pkgName}（整 scope）`)
  }
}

for (const name of packages) {
  if (name.startsWith('@prisma/') || name.startsWith('@esbuild/')) continue
  const from = path.join(SRC, name)
  if (!existsSync(from)) continue
  cpSync(from, path.join(DEST, name), { recursive: true })
}
console.log(`[pack-runner-deps] + 闭包共 ${packages.size} 个顶层包`)

for (const bin of BINS) {
  const linkPath = path.join(SRC, '.bin', bin)
  if (!existsSync(linkPath)) continue
  // 保持符号链接形态：物化文件会改变 __dirname，破坏 CLI 内部
  // 按自身路径加载 wasm 等资源（prisma_schema_build_bg.wasm）
  const real = realpathSync(linkPath)
  const pkgRel = path.relative(SRC, real)
  symlinkSync(path.join('..', pkgRel), path.join(DEST, '.bin', bin))
}

// 占位 package.json：避免上层目录被误当作可解析包；真实元数据以各包自带为准
writeFileSync(path.join(DEST, 'package.json'), JSON.stringify({ name: 'runner-node-modules', private: true }, null, 2))
console.log(`[pack-runner-deps] 完成 → ${path.relative(ROOT, DEST)}`)
