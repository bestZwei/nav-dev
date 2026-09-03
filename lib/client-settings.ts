import type { ClientPluginView } from "./plugins/types"

export interface PublicSettings {
  siteName: string
  siteDescription: string
  siteLogo: string | null
  favicon: string | null
  pageSize: number
  showFooter: boolean
  footerCopyright: string
  footerLinks: Array<{ name: string; url: string }>
  showAdminLink: boolean
  showIcp: boolean
  icpNumber: string | null
  icpLink: string | null
  githubUrl: string | null
  defaultLanguage: string
  // 页面动效总开关
  enableAnimations?: boolean
  // 插件系统：前台注入点消费的精简视图
  plugins: ClientPluginView
}

export const defaultSettings: PublicSettings = {
  siteName: "Conan Nav",
  siteDescription: "简洁现代化的网址导航系统",
  siteLogo: null,
  favicon: null,
  pageSize: 20,
  showFooter: true,
  footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
  footerLinks: [{ name: "GitHub", url: "https://github.com/kenanlabs/nav" }],
  showAdminLink: true,
  showIcp: false,
  icpNumber: null,
  icpLink: null,
  githubUrl: "https://github.com/kenanlabs/nav",
  defaultLanguage: "zh",
  enableAnimations: true,
  plugins: { builtinEnabledIds: [], uploaded: [] },
}

let cachedSettings: PublicSettings | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// 使客户端设置缓存失效：插件启停/上传/删除等会改变 plugins 视图的操作
// 必须调用，否则各消费方（注入点、来源列、详情编辑区等）最长 5 分钟内读到旧状态
export function invalidateSettingsCache() {
  cachedSettings = null
  cacheTimestamp = 0
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const now = Date.now()
  if (cachedSettings && now - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings
  }

  try {
    const res = await fetch("/api/settings", {
      cache: "no-cache",
      headers: { Accept: "application/json" },
    })

    if (res.ok) {
      const data = await res.json()
      if (data && typeof data === "object" && !data.error) {
        const merged: PublicSettings = { ...defaultSettings, ...data }
        cachedSettings = merged
        cacheTimestamp = now
        return merged
      }
    }
  } catch {
    // Gracefully fallback on network or parse error without throwing
  }

  return cachedSettings || defaultSettings
}
