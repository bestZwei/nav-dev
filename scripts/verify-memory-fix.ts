// 内存模式修复验证：
// 1. screenshot.findUnique 支持嵌套关系 select: { site: { select } }（截图服务路由依赖）
// 2. visit.findMany / visit.count 支持 visitedAt.lt（今日/昨日环比统计依赖）
// 运行：npx tsx scripts/verify-memory-fix.ts（需未配置 DATABASE_URL）

import { prisma, useRealDatabase } from "../lib/prisma"

let failed = 0
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

async function main() {
  if (useRealDatabase) {
    console.error("DATABASE_URL 已设置，本脚本仅适用于内存模式验证")
    process.exit(1)
  }
  const db = prisma as unknown as {
    visits: Array<{ id: string; siteId: string; visitedAt: Date; ipAddress: string | null; userAgent: string | null; referer: string | null }>
  }

  console.log("[1] screenshot.findUnique 嵌套关系 select")
  // 已发布站点（种子数据 site-1 为已发布）
  await prisma.screenshot.createMany({
    data: [{ siteId: "site-1", source: "UPLOAD", data: "AAAA", mimeType: "image/png", order: 0 }],
  })
  const shots1 = await prisma.screenshot.findMany({ where: { siteId: "site-1" } })
  const found1 = (await prisma.screenshot.findUnique({
    where: { id: shots1[0].id },
    select: { data: true, mimeType: true, source: true, site: { select: { isPublished: true } } },
  })) as any
  assert(found1?.data === "AAAA", "标量字段正常返回")
  assert(found1?.site?.isPublished === true, "嵌套 site.isPublished 返回 true（已发布站点）")

  // 未发布站点
  const unpubSite = await prisma.site.create({
    data: { name: "未发布", url: "https://example.com", description: "", categoryId: "cat-1", isPublished: false },
  })
  await prisma.screenshot.createMany({
    data: [{ siteId: unpubSite.id, source: "UPLOAD", data: "BBBB", mimeType: "image/png", order: 0 }],
  })
  const shots2 = await prisma.screenshot.findMany({ where: { siteId: unpubSite.id } })
  const found2 = (await prisma.screenshot.findUnique({
    where: { id: shots2[0].id },
    select: { site: { select: { isPublished: true } } },
  })) as any
  assert(found2?.site?.isPublished === false, "嵌套 site.isPublished 返回 false（未发布站点）")

  // 站点不存在时关系为 null（与真实 Prisma 关系缺失语义一致）
  await prisma.screenshot.createMany({
    data: [{ siteId: "no-such-site", source: "UPLOAD", data: "CCCC", mimeType: "image/png", order: 0 }],
  })
  const shots3 = await prisma.screenshot.findMany({ where: { siteId: "no-such-site" } })
  const found3 = (await prisma.screenshot.findUnique({
    where: { id: shots3[0].id },
    select: { site: { select: { isPublished: true } } },
  })) as any
  assert(found3?.site === null, "站点不存在时 site 为 null 而非 undefined")

  // 不传 select 的旧行为保持兼容
  const full = await prisma.screenshot.findUnique({ where: { id: shots1[0].id } })
  assert(full?.id === shots1[0].id && full?.data === "AAAA", "无 select 时返回完整记录")

  console.log("[2] visit 区间过滤 gte + lt")
  // 种子访问数据随机分布在近 14 天，选用远早于该窗口的固定日期，
  // 保证测试窗口内只有下面注入的两条记录
  db.visits.push({ id: "vt-in", siteId: "site-1", ipAddress: null, userAgent: null, referer: null, visitedAt: new Date("2026-01-05T00:00:00Z") })
  db.visits.push({ id: "vt-out", siteId: "site-1", ipAddress: null, userAgent: null, referer: null, visitedAt: new Date("2026-01-10T00:00:00Z") })

  const gte = new Date("2026-01-01T00:00:00Z")
  const lt = new Date("2026-01-08T00:00:00Z")
  const ranged = await prisma.visit.count({ where: { visitedAt: { gte, lt } } })
  // 关键回归断言：若 lt 被忽略（修复前的缺陷），此处将计得 2 而非 1，
  // 因为测试窗口内只有 vt-in（1-05）与 vt-out（1-10）两条，后者应被 lt 排除。
  // 不用种子数据做绝对值断言（其时间戳为随机生成）。
  assert(ranged === 1, `count 同时应用 gte/lt（期望 1，实际 ${ranged}）`)

  // 仅 gte 的旧语义不受影响：与独立参考过滤结果一致，且包含种子数据与注入记录
  const gteOnlyDate = new Date("2026-01-09T00:00:00Z")
  const gteOnly = await prisma.visit.count({ where: { visitedAt: { gte: gteOnlyDate } } })
  const refGteOnly = db.visits.filter(v => v.visitedAt >= gteOnlyDate).length
  assert(gteOnly === refGteOnly && gteOnly >= 1, `count 仅 gte 语义不变（实际 ${gteOnly}，参考 ${refGteOnly}）`)

  const rows = await prisma.visit.findMany({ where: { visitedAt: { gte, lt } } })
  assert(rows.length === 1 && rows[0].id === "vt-in", "findMany 同时应用 gte/lt 且命中正确记录")

  console.log(failed === 0 ? "\n全部断言通过" : `\n${failed} 项断言失败`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error("验证脚本异常:", error)
  process.exit(1)
})
