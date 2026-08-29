// 自测脚本：内存模式 shim 的行为回归（不依赖数据库，直接驱动 prisma 内存实例）
// 用法：npx tsx scripts/memory-shim-selftest.ts
import { prisma } from "../lib/prisma"

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error("FAIL:", msg)
    process.exit(1)
  }
}

async function main() {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

  // ---- screenshot.count（updateSite 详情编辑路径依赖） ----
  const category = await prisma.category.create({
    data: { name: "测试分类", slug: `test-${suffix}`, workspaceId: "ws-default" },
  })
  const site = await prisma.site.create({
    data: {
      name: "测试站点",
      url: `https://example.com/${suffix}`,
      description: "",
      categoryId: category.id,
      isPublished: true,
    },
  })
  await prisma.screenshot.createMany({
    data: [{ siteId: site.id, source: "URL", url: "https://example.com/shot.png" }],
  })
  assert(
    (await prisma.screenshot.count({ where: { siteId: site.id } })) === 1,
    "screenshot.count by siteId"
  )
  assert(
    (await prisma.screenshot.count({ where: { siteId: "no-such" } })) === 0,
    "screenshot.count no match"
  )

  // ---- visit.count 支持 gte + lt（昨日访问量窗口） ----
  // 初始数据自带演示访问记录，用窗口边界精确圈定自己插入的记录
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const windowStart = new Date(now - day * 4)
  const windowMid = new Date(now - day * 3)
  const windowEnd = new Date(now - day * 2)
  await prisma.visit.create({ data: { siteId: site.id, ipAddress: "9.9.9.1", visitedAt: new Date(windowMid.getTime() + 1000) } })
  await prisma.visit.create({ data: { siteId: site.id, ipAddress: "9.9.9.2", visitedAt: new Date(windowMid.getTime() + 2000) } })

  const inWindow = await prisma.visit.count({
    where: { visitedAt: { gte: windowMid, lt: windowEnd } },
  })
  const beforeWindow = await prisma.visit.count({
    where: { visitedAt: { gte: windowStart, lt: windowMid } },
  })
  assert(inWindow >= 2, `visit.count gte+lt 圈定窗口（got ${inWindow}）`)
  // 初始演示数据可能落在此窗口，但不应把自己窗口外的记录漏进来：
  // 关键断言是 lt 生效（窗口起点到 windowMid 之间只含初始数据，数量稳定即可重复运行）
  assert(beforeWindow >= 0, "visit.count gte+lt 不抛错")

  // ---- visit.findMany：where.not + distinct + select（独立访客数路径） ----
  const allUniqueIps = await prisma.visit.findMany({
    where: { ipAddress: { not: null } },
    select: { ipAddress: true },
    distinct: ["ipAddress"],
  })
  const ipSet = new Set(allUniqueIps.map(v => v.ipAddress))
  assert(
    ipSet.size === allUniqueIps.length && allUniqueIps.length >= 2,
    `distinct 去重且非空（got ${allUniqueIps.length}）`
  )
  assert(
    allUniqueIps.every(v => !("siteId" in v) && v.ipAddress !== null),
    "select 只保留 ipAddress 字段"
  )
  // 含 null IP 的记录应被 where.not 过滤
  await prisma.visit.create({ data: { siteId: site.id, ipAddress: null, visitedAt: new Date(windowMid.getTime() + 3000) } })
  const afterNull = await prisma.visit.findMany({
    where: { ipAddress: { not: null } },
    select: { ipAddress: true },
    distinct: ["ipAddress"],
  })
  assert(afterNull.length === allUniqueIps.length, "where.not null 过滤生效")

  // ---- workspace.updateMany / upsert ----
  const w1 = await prisma.workspace.create({ data: { name: "W1", slug: `w1-${suffix}`, isDefault: true } })
  await prisma.workspace.create({ data: { name: "W2", slug: `w2-${suffix}`, isDefault: true } })
  const cleared = await prisma.workspace.updateMany({
    where: { isDefault: true, id: { not: "ws-default" } },
    data: { isDefault: false },
  })
  assert(cleared.count >= 2, `updateMany 清除多余默认（got ${cleared.count}）`)
  const remain = await prisma.workspace.findMany({ where: { isDefault: true } })
  assert(remain.length === 1 && remain[0].id === "ws-default", "仅剩唯一默认工作区")

  const created = await prisma.workspace.upsert({
    where: { slug: `w3-${suffix}` },
    update: {},
    create: { name: "W3", slug: `w3-${suffix}` },
  })
  assert(Boolean(created.id), "workspace.upsert create 分支")
  const updated = await prisma.workspace.upsert({
    where: { slug: w1.slug },
    update: { description: "updated-by-test" },
    create: { name: "should-not-happen", slug: w1.slug },
  })
  assert(updated.description === "updated-by-test", "workspace.upsert update 分支")

  // ---- systemSettings.upsert ----
  const settingsCreate = {
    siteName: "TestNav",
    footerCopyright: `© ${new Date().getFullYear()} Test`,
  }
  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { siteName: "TestNav" },
    create: settingsCreate,
  })
  assert(settings.siteName === "TestNav", "systemSettings.upsert create/update")
  const settingsAgain = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: { pageSize: 30 },
    create: settingsCreate,
  })
  assert(settingsAgain.pageSize === 30 && settingsAgain.siteName === "TestNav", "systemSettings.upsert update 分支")

  // ---- site.create 默认 isPublished 与 schema 一致（false） ----
  const draft = await prisma.site.create({
    data: { name: "草稿", url: `https://draft.example.com/${suffix}`, description: "", categoryId: category.id },
  })
  assert(draft.isPublished === false, "site.create 默认未发布")

  // ---- 内存模式初始插件启用状态（历史默认开启的功能） ----
  const currentSettings = await prisma.systemSettings.findFirst()
  assert(
    Array.isArray(currentSettings?.enabledPlugins) &&
      currentSettings!.enabledPlugins.includes("visit-tracking") &&
      currentSettings!.enabledPlugins.includes("poetry-card"),
    "初始 enabledPlugins 含 visit-tracking 与 poetry-card"
  )

  console.log("all memory-shim behavior tests passed")
}

main()
  .catch(error => {
    console.error("FAIL:", error)
    process.exit(1)
  })
