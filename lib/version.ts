export const UPSTREAM_REPO = "kenanlabs/nav"

export const RELEASE_API_URL = `https://api.github.com/repos/${UPSTREAM_REPO}/releases/latest`

export const RELEASE_PAGE_URL = `https://github.com/${UPSTREAM_REPO}/releases/latest`

export const RELEASES_PAGE_URL = `https://github.com/${UPSTREAM_REPO}/releases`

export const TAGS_API_URL = `https://api.github.com/repos/${UPSTREAM_REPO}/tags?per_page=100`

export const REPO_PAGE_URL = `https://github.com/${UPSTREAM_REPO}`

/**
 * 获取当前应用版本。
 *
 * 版本在镜像构建时通过 build-arg 注入：
 * - 客户端 bundle 中此表达式被构建期内联替换
 * - 服务端运行时读取容器 ENV
 * 本地开发或变量缺失时回退为 "dev"
 */
export function getAppVersion(): string {
  const version = process.env.NEXT_PUBLIC_APP_VERSION?.trim()
  return version || "dev"
}

export function getGitSha(): string {
  return process.env.NEXT_PUBLIC_GIT_SHA?.trim() || ""
}

export function isDevVersion(version: string = getAppVersion()): boolean {
  return version === "dev" || parseSemver(version) === null
}

/**
 * 宽松解析语义化版本号。
 * 支持 vX.Y.Z / X.Y.Z / vX.Y.Z-rc1，忽略预发布后缀。
 * 无法解析时返回 null。
 */
export function parseSemver(version: string): [number, number, number] | null {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return null
  const major = Number.parseInt(match[1], 10)
  const minor = Number.parseInt(match[2], 10)
  const patch = Number.parseInt(match[3], 10)
  if (
    !Number.isFinite(major) ||
    !Number.isFinite(minor) ||
    !Number.isFinite(patch)
  ) {
    return null
  }
  return [major, minor, patch]
}

/**
 * 比较两个版本号：a < b 返回 -1，a === b 返回 0，a > b 返回 1。
 * 任一版本无法解析时返回 NaN，调用方需据此跳过比较。
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  if (!pa || !pb) return Number.NaN
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1
  }
  return 0
}
