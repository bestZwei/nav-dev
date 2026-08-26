// Next.js 服务启动钩子：生产环境启动时检测会话密钥配置。
//
// SESSION_SECRET 缺失时签名会话无法签发（登录将返回明确错误），
// 在启动日志里第一时间给出醒目提示，而不是等第一次登录失败才暴露。
// 该检测不阻断启动（无数据库的内存模式等场景仍可起服务浏览前台）。

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const configured =
    process.env.SESSION_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim()

  if (!configured && process.env.NODE_ENV === "production") {
    console.error(
      "=".repeat(64) +
        "\n[启动检查] 生产环境未配置 SESSION_SECRET（或 NEXTAUTH_SECRET）。\n" +
        "管理后台登录将不可用。配置方法：\n" +
        "  1. 生成密钥: openssl rand -base64 32\n" +
        "  2. 写入部署环境: .env 文件或容器环境变量 SESSION_SECRET=...\n" +
        "  3. 重启服务。Docker compose 部署也可不配置（entrypoint 会自动生成）\n" +
        "=".repeat(64)
    )
  }
}
