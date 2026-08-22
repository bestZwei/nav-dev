"use client"

import { useState, useMemo } from "react"
import { ScrollHeader } from "./scroll-header"
import { Footer } from "./footer"
import { SiteGrid } from "./site-grid"
import { JinrishiciCardWrapper } from "./jinrishici-card-wrapper"
import { Badge } from "@/components/ui/badge"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  category?: {
    name: string
  } | null
}

interface SearchableLayoutProps {
  allCategories: Array<{
    id: string
    name: string
    slug: string
  }>
  flatSites: Site[]
  siteName?: string
  currentCategory?: string
  children: React.ReactNode
}

export function SearchableLayout({
  allCategories,
  flatSites,
  siteName,
  currentCategory,
  children,
}: SearchableLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return flatSites.filter(site =>
      site.name.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query) ||
      site.url.toLowerCase().includes(query)
    )
  }, [searchQuery, flatSites])

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollHeader
        categories={allCategories}
        siteName={siteName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentCategory={currentCategory}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-[1600px] w-full">
          {/* 今日诗词 - 固定在右上角，根据用户设置显示/隐藏 */}
          <JinrishiciCardWrapper />

          {/* 内容区域：为诗词卡片预留右侧空间 */}
          <div className="lg:pr-36 lg:pl-2">
            {isSearching ? (
              // 搜索结果
              <div className="animate-fade-in">
                <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">搜索结果</h1>
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                    找到 {filteredSites.length} 个站点
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    关键词：<span className="font-semibold text-foreground">「{searchQuery}」</span>
                  </p>
                </div>

                {filteredSites.length === 0 ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center animate-scale-in">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-foreground">未找到匹配的网站</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      没有找到与「{searchQuery}」相关的站点，请尝试更换关键词或缩短搜索字词。
                    </p>
                  </div>
                ) : (
                  <SiteGrid sites={filteredSites} />
                )}
              </div>
            ) : (
              // 页面内容（由父组件传入）
              children
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
