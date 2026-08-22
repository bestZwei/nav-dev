"use client"

import { useState, useEffect } from "react"

export type CardDensity = "standard" | "compact"

const STORAGE_KEY = "conan_nav_card_density"
const EVENT_NAME = "conan-nav-card-density-change"

export function useCardDensity() {
  const [density, setDensityState] = useState<CardDensity>("standard")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 从 localStorage 读取存储的模式
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as CardDensity | null
      if (stored === "compact" || stored === "standard") {
        setDensityState(stored)
      }
    } catch {
      // 忽略 localStorage 限制
    }
    setMounted(true)

    // 监听多组件间同步事件
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<CardDensity>
      if (customEvent.detail === "compact" || customEvent.detail === "standard") {
        setDensityState(customEvent.detail)
      }
    }

    window.addEventListener(EVENT_NAME, handleCustomEvent)
    return () => window.removeEventListener(EVENT_NAME, handleCustomEvent)
  }, [])

  const setDensity = (newDensity: CardDensity) => {
    setDensityState(newDensity)
    try {
      localStorage.setItem(STORAGE_KEY, newDensity)
    } catch {
      // 忽略
    }
    window.dispatchEvent(new CustomEvent<CardDensity>(EVENT_NAME, { detail: newDensity }))
  }

  const toggleDensity = () => {
    const next = density === "standard" ? "compact" : "standard"
    setDensity(next)
    return next
  }

  return {
    density,
    setDensity,
    toggleDensity,
    isCompact: density === "compact",
    mounted,
  }
}
