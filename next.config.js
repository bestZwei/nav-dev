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
  env: {
    FALLBACK_SESSION_SECRET,
  },
  experimental: {
    // 允许预览环境域名访问开发服务器
    allowedHosts: ['.monkeycode-ai.online'],
    // 站点详情截图以 base64 随 server action 提交，需放宽默认 1MB 限制
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
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
