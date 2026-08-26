import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  RELEASES_PAGE_URL,
  RELEASE_API_URL,
  TAGS_API_URL,
  compareSemver,
  getAppVersion,
  isDevVersion,
  parseSemver,
} from "@/lib/version"

export const dynamic = "force-dynamic"

const CACHE_TTL_MS = 10 * 60 * 1000
const REQUEST_TIMEOUT_MS = 5000

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "conan-nav-update-checker",
}

type LatestVersionInfo = {
  tag: string
  url: string
}

type CheckCache = {
  info: LatestVersionInfo | null
  expiresAt: number
}

let cache: CheckCache | null = null

async function githubFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: GITHUB_HEADERS,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  })
}

async function fetchFromReleases(): Promise<LatestVersionInfo | null> {
  const response = await githubFetch(RELEASE_API_URL)
  if (!response.ok) return null

  const release = (await response.json()) as {
    tag_name?: string
    html_url?: string
  }

  if (!release.tag_name) return null

  return {
    tag: release.tag_name,
    url: release.html_url || RELEASES_PAGE_URL,
  }
}

async function fetchFromTags(): Promise<LatestVersionInfo | null> {
  const response = await githubFetch(TAGS_API_URL)
  if (!response.ok) return null

  const tags = (await response.json()) as Array<{ name?: string }>

  let latestTag: string | null = null
  for (const tag of tags) {
    const name = tag.name
    if (!name || !parseSemver(name)) continue
    if (latestTag === null || compareSemver(name, latestTag) > 0) {
      latestTag = name
    }
  }

  if (latestTag === null) return null

  return { tag: latestTag, url: RELEASES_PAGE_URL }
}

/**
 * 获取上游最新版本：优先 Release，仓库未发布 Release 时回退到 tags 中 semver 最大者
 */
async function fetchLatestVersion(): Promise<LatestVersionInfo | null> {
  try {
    const fromRelease = await fetchFromReleases()
    if (fromRelease) return fromRelease
    return await fetchFromTags()
  } catch (error) {
    console.warn("Update check failed:", error)
    return null
  }
}

async function getCachedLatestVersion(): Promise<LatestVersionInfo | null> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) {
    return cache.info
  }

  const info = await fetchLatestVersion()

  // 成功与失败结果均缓存，对限流/网络故障形成退避
  cache = { info, expiresAt: now + CACHE_TTL_MS }

  return info
}

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  const userRole = cookieStore.get("user_role")?.value

  if (!userId || userRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const current = getAppVersion()
  const isDev = isDevVersion(current)

  const base = {
    current,
    isDev,
    latest: null as string | null,
    hasUpdate: false,
    releaseUrl: RELEASES_PAGE_URL,
    checkAvailable: false,
    checkedAt: new Date().toISOString(),
  }

  if (isDev) {
    // 开发版本无法比较，跳过远程检查
    return NextResponse.json({ ...base, checkAvailable: true })
  }

  const latest = await getCachedLatestVersion()

  if (!latest) {
    return NextResponse.json(base)
  }

  const comparison = compareSemver(latest.tag, current)
  if (Number.isNaN(comparison)) {
    return NextResponse.json({ ...base, latest: latest.tag, checkAvailable: true })
  }

  return NextResponse.json({
    ...base,
    latest: latest.tag,
    hasUpdate: comparison > 0,
    releaseUrl: latest.url,
    checkAvailable: true,
  })
}
