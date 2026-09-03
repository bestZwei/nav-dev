"use client"

import { useHomeSideVisible, useBuiltinPluginEnabled } from "@/lib/plugins/client"
import { cn } from "@/lib/utils"
import { JinrishiciCard } from "./jinrishici-card"
import { PLUGIN_ID } from "./constants"

// 今日诗词卡片：首页右上角固定展示。
// 站长级开关走插件启停（useBuiltinPluginEnabled），
// 用户级显隐走 homeSide 可见性协议（useHomeSideVisible）
export function HomeSideCard() {
  const enabled = useBuiltinPluginEnabled(PLUGIN_ID)
  const { visible, mounted, setUserVisible } = useHomeSideVisible(enabled)

  const handleClose = () => {
    setUserVisible(false)
  }

  // 避免服务端水合不一致；插件禁用时不渲染。
  // 不能把 visible 再复制进一个 effect 驱动的 state，否则关闭状态会晚一帧生效。
  if (!mounted || !enabled) {
    return null
  }

  return (
    <div
      id="jinrishici-card-anchor"
      className={cn(
        "fixed top-20 right-4 z-40 hidden lg:block animate-fade-in origin-top-right",
        // 用户关闭时保留占位几何（visibility:hidden 不响应点击），
        // BackToTop 等消费方始终量到同一条右缘基准线
        !visible && "invisible"
      )}
    >
      <JinrishiciCard onClose={handleClose} />
    </div>
  )
}
