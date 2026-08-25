"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { fetchPublicSettings } from "@/lib/client-settings"

interface SiteDetailContextValue {
  enableSiteDetail: boolean
}

const SiteDetailContext = createContext<SiteDetailContextValue>({
  enableSiteDetail: false,
})

// 站点详情弹窗全局开关 Provider：
// 服务端渲染页面可通过 initialEnableSiteDetail 注入初值（避免弹层闪变），
// 纯客户端场景回退到 /api/settings 拉取
export function SiteDetailProvider({
  children,
  initialEnableSiteDetail,
}: {
  children: ReactNode
  initialEnableSiteDetail?: boolean
}) {
  const [enableSiteDetail, setEnableSiteDetail] = useState(
    initialEnableSiteDetail ?? false
  )

  useEffect(() => {
    if (initialEnableSiteDetail !== undefined) return
    let cancelled = false
    async function load() {
      const settings = await fetchPublicSettings()
      if (!cancelled) {
        setEnableSiteDetail(settings.enableSiteDetail)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [initialEnableSiteDetail])

  return (
    <SiteDetailContext.Provider value={{ enableSiteDetail }}>
      {children}
    </SiteDetailContext.Provider>
  )
}

export function useSiteDetail() {
  return useContext(SiteDetailContext)
}
