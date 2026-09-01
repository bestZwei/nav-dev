"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "./header"
import type { ShareData } from "./share-dialog"

interface ScrollHeaderProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    icon?: string | null
  }>
  siteName?: string
  searchQuery?: string
  onSearchChange?: (query: string) => void
  currentCategory?: string
  useAnchorLinks?: boolean
  shareData?: ShareData
}

// 点击分类后锁定高亮的时长（覆盖平滑滚动期），期间滚动事件不重算
const CLICK_LOCK_MS = 1200

// 判定线相对视口顶部的偏移，与 header.tsx 锚点滚动的 headerOffset 保持一致，
// 使点击分类后的落点区块与滚动高亮判定完全对齐
const HEADER_OFFSET = 80

// 视为处于页面顶部的滚动阈值
const TOP_EPSILON = 4

export function ScrollHeader({
  categories,
  siteName,
  searchQuery = "",
  onSearchChange,
  currentCategory: initialCategory = "",
  useAnchorLinks = false,
  shareData,
}: ScrollHeaderProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const clickLockUntilRef = useRef(0)

  useEffect(() => {
    if (typeof window === "undefined" || categories.length === 0) return

    let ticking = false

    // 依据滚动位置计算当前激活分类：
    // 判定线取 sticky header 下缘（HEADER_OFFSET），即「贴在导航栏下方的区块」
    // 为当前阅读区块，与点击分类的锚点落点一致；
    // 页面置于顶部时固定第一个分类，触底时强制最后一个
    const updateActiveCategory = () => {
      ticking = false
      if (Date.now() < clickLockUntilRef.current) return

      const doc = document.documentElement
      const scrollY = window.scrollY
      const bottomReached =
        window.innerHeight + scrollY >= doc.scrollHeight - 2
      const atTop = scrollY <= TOP_EPSILON

      let current: string
      if (atTop) {
        current = categories[0].slug
      } else if (bottomReached) {
        current = categories[categories.length - 1].slug
      } else {
        const line = scrollY + HEADER_OFFSET
        current = categories[0].slug
        for (const category of categories) {
          const element = document.getElementById(`category-${category.slug}`)
          if (element && element.getBoundingClientRect().top + scrollY <= line) {
            current = category.slug
          }
        }
      }
      setActiveCategory((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(updateActiveCategory)
      }
    }

    updateActiveCategory()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [categories])

  // 点击分类时立即高亮并锁定，避免平滑滚动过程中的中间态覆盖；
  // 锁定期结束后由用户下一次滚动重新同步
  const handleCategoryClick = (slug: string) => {
    clickLockUntilRef.current = Date.now() + CLICK_LOCK_MS
    setActiveCategory(slug)
  }

  return (
    <Header
      categories={categories}
      currentCategory={activeCategory}
      siteName={siteName}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      useAnchorLinks={useAnchorLinks}
      onCategoryClick={handleCategoryClick}
      shareData={shareData}
    />
  )
}
