
import { getExtConfig } from "./storage"

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/** 只保留域名（origin），去掉路径与查询参数 */
export function stripToDomain(url: string): string {
  try {
    return new URL(url).origin
  } catch {
    return url
  }
}

export interface ExtensionMeta {
  workspaces: Array<{
    id: string
    name: string
    slug: string
    isDefault: boolean
  }>
  categories: Array<{ id: string; name: string; workspaceId: string }>
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function api<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  const { baseUrl, token } = await getExtConfig()
  if (!baseUrl || !token) return { ok: false, error: "NOT_CONFIGURED" }
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok || !json.success) {
      return {
        ok: false,
        error: String(json.error || `HTTP_${response.status}`),
      }
    }
    return { ok: true, data: json.data as T }
  } catch {
    return { ok: false, error: "NETWORK_ERROR" }
  }
}

export function fetchExtensionMeta(): Promise<ApiResult<ExtensionMeta>> {
  return api<ExtensionMeta>("/api/extension", { method: "GET" })
}

export function submitDirect(
  payload: {
    name: string
    url: string
    description: string
    workspaceId: string
    categoryId: string
  }
): Promise<ApiResult<{ siteId: string }>> {
  return api<{ siteId: string }>("/api/extension", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
