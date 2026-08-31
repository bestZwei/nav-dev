// Next.js 服务启动钩子：提醒会话密钥与数据库模式配置状态。
//
// SESSION_SECRET 缺失时会话签名退化为内置回退密钥（功能可用但强度受限），
// 在启动日志给出提示。平台部署（Vercel / Cloudflare Workers 等）没有
// entrypoint 兜底注入，这里是最早能提醒部署者的位置。

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const configured =
    process.env.SESSION_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

  if (!configured) {
    console.warn(
      "[启动检查] 未配置 SESSION_SECRET（或 NEXTAUTH_SECRET），" +
        "管理后台会话将使用公开回退密钥签名（可被伪造，仅建议演示/内网使用）。\n" +
        "配置方法：openssl rand -base64 32 生成，设置为环境变量 SESSION_SECRET 后重新部署。\n" +
        "Vercel: Settings → Environment Variables；Cloudflare: wrangler.jsonc 配 vars 或 dashboard 设置。"
    )
  }

  // 数据库模式提示：Serverless 平台无 entrypoint，这里是提醒部署者
  // 「默认 SQLite 在该环境无法持久化」的最早位置。
  // 判定逻辑内联（与 lib/db-config.ts 同语义）：instrumentation 会被编译进
  // edge bundle，import lib/prisma.ts 会因 node:path 打包失败
  const explicitProvider = process.env.DB_PROVIDER?.trim().toLowerCase()
  const pgUrl =
    process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim() || ""
  const isPostgres =
    explicitProvider === "postgres" ||
    (!explicitProvider && /^postgres(ql)?:\/\//.test(pgUrl))
  if (isPostgres) {
    console.log("[启动检查] 数据库模式：PostgreSQL")
  } else {
    console.log(
      "[启动检查] 数据库模式：SQLite（默认）" +
        "——Serverless 平台（Vercel / Cloudflare Workers）无持久文件系统，请配置 POSTGRES_URL 使用外部数据库。"
    )
  }
}
