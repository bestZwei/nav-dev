"use client"

import { useCallback, useEffect, useState } from "react"

const STORAGE_PREFIX = "nav-site-order:v1:"

function storageKey(categoryId: string) {
  return `${STORAGE_PREFIX}${categoryId}`
}

function readOrder(categoryId: string): string[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(categoryId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every(id => typeof id === "string")
      ? parsed
      : null
  } catch {
    return null
  }
}

// 前台卡片本地排序：拖拽结果仅保存在浏览器 localStorage（按分类维度记忆），
// 换设备或清缓存后回到管理员设置的默认顺序。
// 水合安全：服务端与客户端首帧都按默认顺序渲染，挂载后才应用本地顺序。
export function useLocalSiteOrder<T extends { id: string }>(
  categoryId: string | undefined,
  sites: T[]
) {
  const [mounted, setMounted] = useState(false)
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!categoryId) {
      setLocalOrder(null)
      return
    }
    setLocalOrder(readOrder(categoryId))
  }, [categoryId])

  const saveOrder = useCallback(
    (order: string[]) => {
      if (!categoryId) return
      setLocalOrder(order)
      try {
        window.localStorage.setItem(storageKey(categoryId), JSON.stringify(order))
      } catch {
        // 隐私模式等写入失败时顺序仅在当前页面会话内生效
      }
    },
    [categoryId]
  )

  const resetOrder = useCallback(() => {
    if (!categoryId) return
    setLocalOrder(null)
    try {
      window.localStorage.removeItem(storageKey(categoryId))
    } catch {
      // 忽略：状态已清空，界面回到默认顺序
    }
  }, [categoryId])

  // 应用本地顺序：本地序列在前（剔除已不存在的站点），未覆盖的按默认顺序追加
  let orderedSites = sites
  let hasCustomOrder = false
  if (mounted && localOrder && categoryId) {
    const byId = new Map(sites.map(s => [s.id, s]))
    const ordered = localOrder
      .map(id => byId.get(id))
      .filter((s): s is T => Boolean(s))
    if (ordered.length > 0) {
      const known = new Set(localOrder)
      const rest = sites.filter(s => !known.has(s.id))
      orderedSites = [...ordered, ...rest]
      hasCustomOrder = true
    }
  }

  return { orderedSites, hasCustomOrder, saveOrder, resetOrder }
}
