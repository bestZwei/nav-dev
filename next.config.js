const createNextIntlPlugin = require('next-intl/plugin')
const crypto = require('crypto')

// 会话签名回退密钥：未配置 SESSION_SECRET 时使用。
// 必须在「构建期」随机生成并经 next.config env 内联——Edge middleware 与 Node
// runtime 是两套独立的模块实例，进程内随机会让两边密钥不一致、验签必然失败；
// 而源码内置固定常量则会被任何知晓开源代码的攻击者用来伪造会话（历史严重漏洞）。
// 构建期随机随产物分发（不进源码仓库），镜像重建后需重新登录。
const FALLBACK_SESSION_SECRET = crypto.randomBytes(32).toString('hex')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 允许预览环境域名跨域访问开发服务器（Next.js 15 使用 allowedDevOrigins）
  allowedDevOrigins: ['*.monkeycode-ai.online'],
  // 双数据库客户端（sqlite / postgres）与其 query engine 二进制需完整进入 standalone 产物
  outputFileTracingIncludes: {
    '/**': ['./generated/**/*'],
  },
  env: {
    FALLBACK_SESSION_SECRET,
  },
  experimental: {
    // 站点详情截图以 base64 随 server action 提交，需放宽默认 1MB 限制
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    // 站点图标为带查询参数的本地接口，放行以免 Next.js 16 起默认拒绝
    localPatterns: [
      {
        pathname: '/api/icon',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

const withNextIntl = createNextIntlPlugin()

module.exports = withNextIntl(nextConfig)
