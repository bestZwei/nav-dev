import { useState, useEffect } from "react"
import { fetchPublicSettings } from "@/lib/client-settings"

const POETRY_VISIBLE_KEY = "poetry-visible"
const STORAGE_EVENT = "poetry-visible-change"

export function usePoetryToggle() {
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)
  // 管理后台诗词功能总开关（默认开启，拉取公开设置后校正）
  const [isEnabled, setIsEnabled] = useState(true)

  // 初始化：从 localStorage 读取设置
  useEffect(() => {
    const saved = localStorage.getItem(POETRY_VISIBLE_KEY)
    if (saved !== null) {
      setIsVisible(saved === "true")
    } else {
      // 默认显示
      setIsVisible(true)
    }
    setMounted(true)
  }, [])

  // 拉取后台总开关状态；fetchPublicSettings 自带 5 分钟客户端缓存
  useEffect(() => {
    let cancelled = false
    fetchPublicSettings().then((settings) => {
      if (!cancelled) {
        setIsEnabled(settings.enablePoetry)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // 监听自定义存储事件，实现跨组件同步
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(POETRY_VISIBLE_KEY)
      setIsVisible(saved === "true")
    }

    window.addEventListener(STORAGE_EVENT, handleStorageChange)
    return () => {
      window.removeEventListener(STORAGE_EVENT, handleStorageChange)
    }
  }, [])

  // 切换显示状态并保存到 localStorage
  const toggle = () => {
    const newValue = !isVisible
    setIsVisible(newValue)
    localStorage.setItem(POETRY_VISIBLE_KEY, String(newValue))
    // 触发自定义事件，通知其他组件
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  }

  // 直接设置显示状态
  const setVisible = (value: boolean) => {
    setIsVisible(value)
    localStorage.setItem(POETRY_VISIBLE_KEY, String(value))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  }

  return { isVisible, toggle, setVisible, mounted, isEnabled }
}
