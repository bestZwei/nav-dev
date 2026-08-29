"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useBuiltinPluginEnabled } from "@/lib/plugins/client"
import { PLUGIN_ID } from "@/plugins/site-detail/constants"

interface SiteDetailContextValue {
  enableSiteDetail: boolean
}

const SiteDetailContext = createContext<SiteDetailContextValue>({
  enableSiteDetail: false,
})

// 站点详情弹窗 Provider（装配层薄壳）：
// 开关来源从 SystemSettings.enableSiteDetail 切换为 site-detail 内置插件的启用状态。
// 上下文形状与消费方（site-card 等）保持不变
export function SiteDetailProvider({ children }: { children: ReactNode }) {
  const enableSiteDetail = useBuiltinPluginEnabled(PLUGIN_ID)

  return (
    <SiteDetailContext.Provider value={{ enableSiteDetail }}>
      {children}
    </SiteDetailContext.Provider>
  )
}

export function useSiteDetail() {
  return useContext(SiteDetailContext)
}
