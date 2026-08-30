const createNextIntlPlugin = require('next-intl/plugin')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 允许预览环境域名跨域访问开发服务器（Next.js 15 使用 allowedDevOrigins）
  allowedDevOrigins: ['*.monkeycode-ai.online'],
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

