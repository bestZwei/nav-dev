import { NextRequest, NextResponse } from "next/server"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"

/**
 * Favicon 代理接口
 *
 * 两种模式:
 *  1. /api/icon?domain=github.com&s=favicon-im  按域名从 favicon 服务获取
 *  2. /api/icon?url=https://www.google.com/s2/favicons?...  代理白名单内的完整 URL
 *
 * 命中内存/磁盘缓存时直接返回, 未命中时从上游拉取(带超时与 fallback 链),
 * 成功结果返回 30 天强缓存头, 失败结果短缓存 10 分钟避免反复打上游。
 */

export const runtime = "nodejs"

const CACHE_DIR = path.join(process.cwd(), ".cache", "icons")
const SUCCESS_TTL = 30 * 24 * 60 * 60 * 1000
const FAIL_TTL = 10 * 60 * 1000
const UPSTREAM_TIMEOUT = 5000
const MEMORY_CACHE_LIMIT = 800

type FaviconServiceKey = "favicon-im" | "bqb-cool" | "duckduckgo"

const UPSTREAMS: Record<FaviconServiceKey, (domain: string) => string> = {
  "favicon-im": (domain) => `https://favicon.im/${domain}?larger=true`,
  "bqb-cool": (domain) => `https://icon.bqb.cool?url=https://${domain}`,
  duckduckgo: (domain) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
}

const DEFAULT_ORDER: FaviconServiceKey[] = ["favicon-im", "duckduckgo", "bqb-cool"]

const URL_PROXY_WHITELIST = new Set([
  "favicon.im",
  "icon.bqb.cool",
  "icons.duckduckgo.com",
  "www.google.com",
  "google.com",
  "gstatic.com",
  "www.gstatic.com",
])

const DOMAIN_RE =
  /^(?=.{1,253}$)[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

interface CacheEntry {
  body: Uint8Array<ArrayBuffer>
  contentType: string
  etag: string
  expires: number
  ok: boolean
}

const memoryCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<CacheEntry>>()

function cacheKeyFor(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex")
}

function setMemoryCache(key: string, entry: CacheEntry) {
  if (memoryCache.size >= MEMORY_CACHE_LIMIT) {
    const oldest = memoryCache.keys().next().value
    if (oldest !== undefined) memoryCache.delete(oldest)
  }
  memoryCache.set(key, entry)
}

async function readDiskCache(hash: string): Promise<CacheEntry | null> {
  try {
    const [body, meta] = await Promise.all([
      readFile(path.join(CACHE_DIR, `${hash}.bin`)),
      readFile(path.join(CACHE_DIR, `${hash}.json`), "utf-8"),
    ])
    const parsed = JSON.parse(meta) as { contentType: string; etag: string; expires: number; ok: boolean }
    const entry: CacheEntry = {
      body: new Uint8Array(body),
      contentType: parsed.contentType,
      etag: parsed.etag,
      expires: parsed.expires,
      ok: parsed.ok,
    }
    setMemoryCache(hash, entry)
    return entry
  } catch {
    return null
  }
}

async function writeDiskCache(hash: string, entry: CacheEntry) {
  try {
    await mkdir(CACHE_DIR, { recursive: true })
    await Promise.all([
      writeFile(path.join(CACHE_DIR, `${hash}.bin`), entry.body),
      writeFile(
        path.join(CACHE_DIR, `${hash}.json`),
        JSON.stringify({
          contentType: entry.contentType,
          etag: entry.etag,
          expires: entry.expires,
          ok: entry.ok,
        })
      ),
    ])
  } catch {
    // 磁盘缓存写入失败不影响本次响应
  }
}

function failureEntry(): CacheEntry {
  return {
    body: new Uint8Array(0),
    contentType: "image/png",
    etag: "",
    expires: Date.now() + FAIL_TTL,
    ok: false,
  }
}

async function fetchUpstream(url: string): Promise<{ body: Uint8Array<ArrayBuffer>; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      cache: "no-store",
    })
    if (!res.ok) return null

    const contentType = res.headers.get("content-type") || "image/png"
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) return null

    const buffer = new Uint8Array(await res.arrayBuffer())
    if (buffer.byteLength === 0) return null
    return { body: buffer, contentType }
  } catch {
    return null
  }
}

async function resolveDomainIcon(domain: string, preferred: FaviconServiceKey): Promise<CacheEntry> {
  const order = [preferred, ...DEFAULT_ORDER.filter((s) => s !== preferred)]
  for (const service of order) {
    const result = await fetchUpstream(UPSTREAMS[service](domain))
    if (result) {
      return {
        body: result.body,
        contentType: result.contentType,
        etag: crypto.createHash("sha256").update(result.body).digest("hex").slice(0, 16),
        expires: Date.now() + SUCCESS_TTL,
        ok: true,
      }
    }
  }
  return failureEntry()
}

async function resolveUrlIcon(url: string): Promise<CacheEntry> {
  const result = await fetchUpstream(url)
  if (result) {
    return {
      body: result.body,
      contentType: result.contentType,
      etag: crypto.createHash("sha256").update(result.body).digest("hex").slice(0, 16),
      expires: Date.now() + SUCCESS_TTL,
      ok: true,
    }
  }
  return failureEntry()
}

async function getEntry(rawKey: string, resolver: () => Promise<CacheEntry>): Promise<CacheEntry> {
  const now = Date.now()

  const cached = memoryCache.get(rawKey)
  if (cached && cached.expires > now) return cached

  const disk = await readDiskCache(rawKey)
  if (disk && disk.expires > now) return disk

  let pending = inflight.get(rawKey)
  if (!pending) {
    pending = resolver().then(async (entry) => {
      setMemoryCache(rawKey, entry)
      if (entry.ok || Math.random() < 0.5) {
        // 成功必写盘, 失败按概率写盘做负缓存
        await writeDiskCache(rawKey, entry)
      }
      return entry
    })
    inflight.set(rawKey, pending)
    pending.finally(() => inflight.delete(rawKey)).catch(() => {})
  }

  return pending
}

function toResponse(entry: CacheEntry): NextResponse {
  if (!entry.ok) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": `public, max-age=${Math.floor(FAIL_TTL / 1000)}`,
      },
    })
  }
  return new NextResponse(new Blob([entry.body]), {
    status: 200,
    headers: {
      "Content-Type": entry.contentType,
      "Cache-Control": "public, max-age=2592000, immutable",
      ETag: `"${entry.etag}"`,
    },
  })
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const domain = params.get("domain")
  const url = params.get("url")
  const serviceParam = params.get("s") as FaviconServiceKey | null

  if (url) {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return new NextResponse("Invalid url", { status: 400 })
    }
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || !URL_PROXY_WHITELIST.has(parsed.hostname)) {
      return new NextResponse("Host not allowed", { status: 403 })
    }
    const key = cacheKeyFor(`url:${url}`)
    const entry = await getEntry(key, () => resolveUrlIcon(url))
    return toResponse(entry)
  }

  if (domain) {
    if (!DOMAIN_RE.test(domain)) {
      return new NextResponse("Invalid domain", { status: 400 })
    }
    const service: FaviconServiceKey =
      serviceParam && serviceParam in UPSTREAMS ? serviceParam : DEFAULT_ORDER[0]
    const key = cacheKeyFor(`domain:${domain}:${service}`)
    const entry = await getEntry(key, () => resolveDomainIcon(domain, service))
    return toResponse(entry)
  }

  return new NextResponse("Missing domain or url", { status: 400 })
}
