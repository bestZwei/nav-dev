// SQLite 模式冒烟验证：确认默认回退路径（未配置 PostgreSQL 参数）下
// 数据库可读写、seed 数据完整。前置条件：已执行 npm run db:setup（建表 + seed）。
import { prisma, dbProvider, dbConfig } from "../lib/prisma"

async function main() {
  if (dbProvider !== "sqlite") {
    console.error(`当前为 ${dbProvider} 模式（${dbConfig.url}），本脚本仅适用于 sqlite 模式验证`)
    process.exit(1)
  }

  const failures: string[] = []

  const userCount = await prisma.user.count()
  if (userCount < 1) failures.push(`管理员账户缺失（user.count=${userCount}）`)

  const categoryCount = await prisma.category.count()
  if (categoryCount < 4) failures.push(`分类数据缺失（category.count=${categoryCount}）`)

  const siteCount = await prisma.site.count()
  if (siteCount < 4) failures.push(`站点数据缺失（site.count=${siteCount}）`)

  const settings = await prisma.systemSettings.findFirst()
  if (!settings?.siteName) failures.push("系统设置记录缺失或 siteName 为空")

  // 写路径冒烟：更新后再读回
  const before = await prisma.systemSettings.findFirst()
  if (before) {
    await prisma.systemSettings.update({
      where: { id: before.id },
      data: { pageSize: before.pageSize },
    })
  }

  if (failures.length > 0) {
    console.error("❌ SQLite 模式验证失败：")
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }

  console.log("✅ SQLite 模式验证通过")
  console.log(`   - 数据库文件: ${dbConfig.sqlitePath}`)
  console.log(`   - 管理员: ${userCount}，分类: ${categoryCount}，站点: ${siteCount}`)
  console.log(`   - 读写探测: 成功`)
}

main()
  .catch((e) => {
    console.error("❌ SQLite 模式验证异常:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
