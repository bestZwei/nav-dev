import { lookup as dnsLookup } from "node:dns/promises"
import { normalizeHost } from "./workspace"

// 工作区域名反向探测：以访客身份访问绑定的域名，读取页面上的
// <meta name="workspace"> 标记（见 app/layout.tsx 的 WorkspaceMarker），
// 与域名绑定的工作区 slug 比对，一次请求覆盖 DNS / 反代透传 / 发布状态全链路。
//
// 安全约束（防 SSRF）：仅允许 http(s)、拒绝内网/保留地址字面量、
// 解析结果包含私网地址时拒绝（Node 环境）、重定向逐跳校验、
// 严格超时与响应体上限。dns 解析失败（如 Cloudflare Workers 无 dns 能力）
// 时降级跳过解析校验，由运行时网络沙箱兜底。

export type DomainVerifyStatus = "ok" | "fallback" | "unreachable"

export interface DomainVerifyResult {
  status: DomainVerifyStatus
  // 机器可读的失败原因，用于调试定位：invalid | private | dns | network | timeout | httpError | noMarker
  detail: string
}

const REQUEST_TIMEOUT_MS = 8_000
const MAX_REDIRECTS = 3
// 页面标记在 <head> 前部，512KB 上限远超实际需要
const MAX_HTML_BYTES = 512 * 1024
const PROBE_UA = "ConanNav-DomainVerify/1.0"

// ---- 私网 / 保留地址判断 ----

function parseIPv4(host: string): number[] | null {
  const parts = host.split(".")
  if (parts.length !== 4) return null
  const octets: number[] = []
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const n = Number(part)
    if (n > 255) return null
    octets.push(n)
  }
  return octets
}

function isPrivateIPv4(octets: number[]): boolean {
  const [a, b] = octets
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10/8
    a === 127 || // 环回
    (a === 100 && b >= 64 && b <= 127) || // 100.64/10 CGNAT
    (a === 169 && b === 254) || // 169.254/16 链路本地
    (a === 172 && b >= 16 && b <= 31) || // 172.16/12
    (a === 192 && b === 0) || // 192.0.0.0/24 与 192.0.2.0/24
    (a === 192 && b === 168) || // 192.168/16
    (a === 198 && (b === 18 || b === 19)) || // 198.18/15
    (a === 198 && b === 51) || // 198.51.100/24
    (a === 203 && b === 0) || // 203.0.113/24
    a >= 224 // 组播与保留段
  )
}

function isPrivateIPv6Literal(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "")
  if (h === "::" || h === "::1") return true
  if (h.startsWith("fc") || h.startsWith("fd")) return true // fc00::/7 ULA
  if (/^fe[89ab]/.test(h)) return true // fe80::/10 链路本地
  const mapped = h.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mapped) {
    const octets = parseIPv4(mapped[1])
    return octets ? isPrivateIPv4(octets) : true
  }
  return false
}

// 对主机名字面量做校验（不含 DNS 解析）：内网惯用后缀与私网 IP 字面量一律拒绝
export function isPublicHostLiteral(host: string): boolean {
  if (!host) return false
  if (host === "localhost" || /\.(localhost|local|internal|home\.arpa)$/.test(host)) {
    return false
  }
  const ipv4 = parseIPv4(host)
  if (ipv4) return !isPrivateIPv4(ipv4)
  if (host.includes(":")) return !isPrivateIPv6Literal(host)
  return true
}

// DNS 解析并校验解析结果不指向私网；解析不可用（如 Workers 环境）时返回 null 表示跳过该校验
async function resolveHostAddresses(host: string): Promise<string[] | null> {
  try {
    const records = await dnsLookup(host, { all: true })
    return records.map(record => record.address)
  } catch {
    return null
  }
}

// 字面量 + 解析结果双重校验；抛出 "private" 表示命中内网地址。
// 解析结果含任一私网地址即拒绝：公网域名不会解析出内网地址，
// 混合记录（公网+私网）可借轮询把请求导向内网，不能只拒绝"全部为私网"的情况
// 供 domain-verify 之外的出站通道复用（如插件 webhook），保证 SSRF 防护口径一致
export async function assertPublicHost(host: string): Promise<void> {
  if (!isPublicHostLiteral(host)) {
    throw new Error("private")
  }
  const addresses = await resolveHostAddresses(host)
  if (addresses && addresses.length > 0) {
    const hasPrivate = addresses.some(addr => {
      const ipv4 = parseIPv4(addr)
      if (ipv4) return isPrivateIPv4(ipv4)
      return isPrivateIPv6Literal(addr)
    })
    if (hasPrivate) throw new Error("private")
  }
}

// ---- 页面标记解析 ----

// 提取 <meta name="workspace" content="..."> 的 content 值；未找到有效标记返回 null
export function extractWorkspaceSlug(html: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi)
  if (!tags) return null
  for (const tag of tags) {
    const name = tag.match(/\sname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i)
    if (!name) continue
    const nameValue = (name[1] ?? name[2] ?? name[3] ?? "").toLowerCase()
    if (nameValue !== "workspace") continue
    const content = tag.match(/\scontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i)
    // 无 content / 空 content 的标记视为无效，走 noMarker 分支而非误判为"渲染了其他工作区"
    if (!content) return null
    const value = content[1] ?? content[2] ?? content[3] ?? ""
    return value || null
  }
  return null
}

// ---- 探测主体 ----

interface ProbeOutcome {
  slug: string | null
  detail: string
}

// 单次请求：手动跟随重定向（逐跳校验目标主机），读取响应体（带上限）后解析标记
async function probeOnce(scheme: string, host: string): Promise<ProbeOutcome> {
  let url = `${scheme}${host}/`
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const next = new URL(url)
    const nextHost = normalizeHost(next.host)
    if (!nextHost || (next.protocol !== "https:" && next.protocol !== "http:")) {
      return { slug: null, detail: "invalid" }
    }
    try {
      await assertPublicHost(nextHost)
    } catch (error) {
      if (error instanceof Error && error.message === "private") {
        return { slug: null, detail: "private" }
      }
      return { slug: null, detail: "dns" }
    }

    let response: Response
    try {
      response = await fetch(next, {
        redirect: "manual",
        headers: { "user-agent": PROBE_UA },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return { slug: null, detail: "timeout" }
      }
      return { slug: null, detail: "network" }
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (!location || hop === MAX_REDIRECTS) return { slug: null, detail: "httpError" }
      // 畸形 Location 解析失败按响应异常处理，不让 TypeError 逸出循环丢失 detail
      try {
        url = new URL(location, next).toString()
      } catch {
        return { slug: null, detail: "httpError" }
      }
      continue
    }

    if (!response.ok) {
      return { slug: null, detail: "httpError" }
    }

    // 流式读取并限制响应体大小
    const reader = response.body?.getReader()
    if (!reader) return { slug: null, detail: "noMarker" }
    const decoder = new TextDecoder()
    let html = ""
    let bytes = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      html += decoder.decode(value, { stream: true })
      if (bytes >= MAX_HTML_BYTES) {
        await reader.cancel().catch(() => {})
        break
      }
    }
    html += decoder.decode()

    const slug = extractWorkspaceSlug(html)
    return slug === null ? { slug: null, detail: "noMarker" } : { slug, detail: "ok" }
  }
  return { slug: null, detail: "httpError" }
}

/**
 * 探测绑定的域名当前渲染的工作区。
 * - ok：页面标记与期望的工作区 slug 一致（整条链路生效）
 * - fallback：请求成功但渲染的是其他工作区（通常是回退默认工作区）
 * - unreachable：网络不通、超时、非本应用响应等
 */
export async function verifyDomainHost(
  host: string,
  expectedSlug: string
): Promise<DomainVerifyResult> {
  const normalized = normalizeHost(host)
  if (!normalized || !isPublicHostLiteral(normalized)) {
    return { status: "unreachable", detail: "invalid" }
  }
  try {
    await assertPublicHost(normalized)
  } catch (error) {
    if (error instanceof Error && error.message === "private") {
      return { status: "unreachable", detail: "private" }
    }
    return { status: "unreachable", detail: "dns" }
  }

  // 优先 https，网络层失败时回退 http（未配证书的自部署场景）
  let outcome = await probeOnce("https://", normalized)
  if (outcome.slug === null && (outcome.detail === "network" || outcome.detail === "timeout")) {
    outcome = await probeOnce("http://", normalized)
  }

  if (outcome.slug === null) {
    return { status: "unreachable", detail: outcome.detail }
  }
  if (outcome.slug === expectedSlug) {
    return { status: "ok", detail: "ok" }
  }
  return { status: "fallback", detail: "fallback" }
}
