const createNextIntlPlugin = require('next-intl/plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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

