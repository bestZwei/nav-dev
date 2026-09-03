"use client"

import { useState } from "react"
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
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setUserVisible(false)
      setIsClosing(false)
    }, 240)
  }

  // 避免服务端水合不一致；插件禁用时不渲染。
  if (!mounted || !enabled) {
    return null
  }

  return (
    <div
      id="jinrishici-card-anchor"
      className={cn(
        "fixed top-20 right-4 z-40 hidden lg:block origin-top-right transition-all duration-250 ease-out",
        isClosing
          ? "animate-unroll-out pointer-events-none"
          : visible
          ? "animate-unroll-in"
          : "invisible opacity-0 pointer-events-none scale-90 -translate-y-2"
      )}
    >
      <JinrishiciCard onClose={handleClose} />
    </div>
  )
}
