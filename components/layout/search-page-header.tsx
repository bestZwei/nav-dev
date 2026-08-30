"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "./header"

interface SearchPageHeaderProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    icon?: string | null
  }>
  siteName?: string
  initialQuery: string
}

// /search 结果页的 Header 包装：Header 的搜索框是受控组件，
// 需要宿主页面提供搜索状态。结果页由 URL ?q= 驱动服务端检索，
// 因此输入实时更新本地状态，回车时携带新关键词跳转重新检索；
// 清空后回车或提交空关键词则回首页
export function SearchPageHeader({
  categories,
  siteName,
  initialQuery,
}: SearchPageHeaderProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  // 浏览器前进/后退（或外链跳转）带来新的 ?q= 时同步输入框，
  // 避免服务端结果与输入框关键词脱节
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleSearchSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      router.push("/")
      return
    }
    if (trimmed === initialQuery) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <Header
      categories={categories}
      siteName={siteName}
      searchQuery={query}
      onSearchChange={setQuery}
      onSearchSubmit={handleSearchSubmit}
    />
  )
}
