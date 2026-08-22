"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { PoetryToggle } from "@/components/poetry-toggle"
import { FaviconServiceToggle } from "@/components/favicon-service-toggle"
import { CardDensityToggle } from "@/components/card-density-toggle"
import { SiteSubmissionDialog } from "@/components/layout/site-submission-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Search, X } from "lucide-react"
import { fetchPublicSettings } from "@/lib/client-settings"
import { CategoryIcon } from "@/components/category-icon"

interface HeaderProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    icon?: string | null
  }>
  currentCategory?: string
  siteName?: string
  siteLogo?: string | null
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function Header({
  categories,
  currentCategory = "",
  siteName = "Conan Nav",
  siteLogo = null,
  searchQuery = "",
  onSearchChange
}: HeaderProps) {
  const [logo, setLogo] = useState<string | null>(siteLogo)
  const [enableSubmission, setEnableSubmission] = useState<boolean>(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const settings = await fetchPublicSettings()
      if (!cancelled) {
        if (settings.siteLogo) setLogo(settings.siteLogo)
        setEnableSubmission(settings.enableSubmission ?? true)
      }
    }

    loadSettings()

    const handleFocus = () => {
      loadSettings()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleClearSearch = () => {
    onSearchChange?.("")
  }

  // 快捷键支持：按 '/' 或 'Cmd+K / Ctrl+K' 聚焦搜索输入框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        const input = document.getElementById('search') as HTMLInputElement | null
        input?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center">
          <div className="flex-shrink-0 pr-6 sm:pr-8">
            <Link href="/" className="flex items-center space-x-2">
              {logo && (
                <Image
                  src={logo}
                  alt="Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                  referrerPolicy="no-referrer"
                  priority
                />
              )}
              <span className="font-bold text-xl">{siteName}</span>
            </Link>
          </div>

          {/* 桌面端：Tabs 风格横向分类导航 */}
          <nav className="hidden md:flex flex-1 items-center overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="bg-muted inline-flex h-9 items-center justify-center rounded-lg p-[3px] gap-0.5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] ${
                    currentCategory === category.slug
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {category.icon && (
                    <CategoryIcon icon={category.icon} className="h-3.5 w-3.5 opacity-85 shrink-0" size={14} />
                  )}
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* 移动端：Drawer（从左侧展开） */}
          <div className="flex md:hidden flex-1 items-center">
            <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
              <DrawerTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                  <span className="sr-only">分类</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="h-full w-[280px] rounded-none border-r">
                <DrawerHeader className="sr-only">
                  <DrawerTitle>选择分类</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-1 px-4 py-6">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 py-3 px-4 rounded-md transition-colors ${
                        currentCategory === category.slug
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {category.icon && (
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                          <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" size={14} />
                        </div>
                      )}
                      <span>{category.name}</span>
                    </Link>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="flex-shrink-0 pl-2 sm:pl-4 flex items-center gap-2">
            <div className="relative hidden sm:block group">
              <Label htmlFor="search" className="sr-only">搜索</Label>
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none select-none transition-colors group-focus-within:text-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="搜索... (快捷键 /)"
                className="h-9 w-40 sm:w-48 lg:w-64 pl-8 pr-8 text-xs bg-muted/40 transition-all focus:bg-background focus:w-56 sm:focus:w-60 lg:focus:w-72 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                suppressHydrationWarning
              />
              {searchQuery ? (
                <button
                  onClick={handleClearSearch}
                  className="absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-transform active:scale-90"
                  type="button"
                  aria-label="清除搜索"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
                  /
                </kbd>
              )}
            </div>

            {/* 网站收录按钮 */}
            {enableSubmission && (
              <SiteSubmissionDialog categories={categories} />
            )}

            <CardDensityToggle />
            <FaviconServiceToggle />
            <PoetryToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
