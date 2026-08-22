"use client"

import { useEffect, useRef, useState } from "react"
import { Header } from "./header"

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
}

// 点击分类后锁定高亮的时长（覆盖平滑滚动期），期间滚动事件不重算
const CLICK_LOCK_MS = 1200

export function ScrollHeader({
  categories,
  siteName,
  searchQuery = "",
  onSearchChange,
  currentCategory: initialCategory = "",
  useAnchorLinks = false,
}: ScrollHeaderProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const clickLockUntilRef = useRef(0)

  useEffect(() => {
    if (typeof window === "undefined" || categories.length === 0) return

    let ticking = false

    // 依据滚动位置计算当前激活分类：
    // 判定线取视口中心（比顶部判定更宽容，尾部短分类也能依次选中）；
    // 激活「区块顶部在判定线上方的最后一个」；触底强制最后一个
    const updateActiveCategory = () => {
      ticking = false
      if (Date.now() < clickLockUntilRef.current) return

      const doc = document.documentElement
      const bottomReached =
        window.innerHeight + window.scrollY >= doc.scrollHeight - 2

      let current: string
      if (bottomReached) {
        current = categories[categories.length - 1].slug
      } else {
        const line = window.scrollY + window.innerHeight / 2
        current = categories[0].slug
        for (const category of categories) {
          const element = document.getElementById(`category-${category.slug}`)
          if (element && element.offsetTop <= line) {
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
    />
  )
}
