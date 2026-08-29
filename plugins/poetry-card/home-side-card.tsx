"use client"

import { useState, useEffect } from "react"
import { useHomeSideVisible, useBuiltinPluginEnabled } from "@/lib/plugins/client"
import { JinrishiciCard } from "./jinrishici-card"
import { PLUGIN_ID } from "./constants"

// 今日诗词卡片：首页右上角固定展示。
// 站长级开关走插件启停（useBuiltinPluginEnabled），
// 用户级显隐走 homeSide 可见性协议（useHomeSideVisible）
export function HomeSideCard() {
  const enabled = useBuiltinPluginEnabled(PLUGIN_ID)
  const { visible, mounted, setUserVisible } = useHomeSideVisible(enabled)
  const [showCard, setShowCard] = useState(true)

  useEffect(() => {
    if (mounted) {
      setShowCard(visible)
    }
  }, [visible, mounted])

  const handleClose = () => {
    setUserVisible(false)
  }

  // 避免服务端水合不一致；插件禁用或用户隐藏时不渲染
  if (!mounted || !enabled || !showCard) {
    return null
  }

  return (
    <div
      id="jinrishici-card-anchor"
      className="fixed top-20 right-4 z-40 hidden lg:block animate-fade-in origin-top-right"
    >
      <JinrishiciCard onClose={handleClose} />
    </div>
  )
}
