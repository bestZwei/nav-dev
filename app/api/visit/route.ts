import { NextRequest, NextResponse } from "next/server"
// 装配层薄壳：埋点逻辑归属 visit-tracking 插件
import { recordVisit } from "@/plugins/visit-tracking/actions"

// 未认证端点的内存去重节流：同一 IP+站点 30 秒内的重复埋点只计一次。
// 防御脚本化刷量污染统计与灌爆 Visit 表（多实例部署下各自独立，属尽力而为的基线防护）
const VISIT_DEDUP_WINDOW_MS = 30_000
const DEDUP_MAP_MAX = 10_000
const recentVisits = new Map<string, number>()

function isDuplicateVisit(key: string): boolean {
  const now = Date.now()
  // 防内存膨胀：超上限时先清掉过期项，仍超则跳过本条判定（放行）
  if (recentVisits.size > DEDUP_MAP_MAX) {
    for (const [k, ts] of recentVisits) {
      if (now - ts > VISIT_DEDUP_WINDOW_MS) recentVisits.delete(k)
    }
    if (recentVisits.size > DEDUP_MAP_MAX) recentVisits.clear()
  }
  const last = recentVisits.get(key)
  if (last && now - last < VISIT_DEDUP_WINDOW_MS) return true
  recentVisits.set(key, now)
  return false
}

// 与 login 路由一致的 IP 提取口径（可伪造性问题见审查文档 3.2，统一决策处理）
function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
}

export async function POST(request: NextRequest) {
  try {
    let body: { siteId?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const siteId = typeof body.siteId === "string" ? body.siteId : ""
    if (!siteId) {
      return NextResponse.json({ error: "siteId is required" }, { status: 400 })
    }

    if (isDuplicateVisit(`${getClientIp(request)}:${siteId}`)) {
      // 去重命中按成功静默返回，调用方（前台埋点）无需感知
      return NextResponse.json({ success: true, deduplicated: true })
    }

    const result = await recordVisit(siteId, request)
    if (!result.success) {
      // 站点不存在是请求方的数据问题而非服务器故障
      return NextResponse.json({ error: result.error }, { status: result.error === "Site not found" ? 404 : 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording visit:", error)
    return NextResponse.json({ error: "Failed to record visit" }, { status: 500 })
  }
}
