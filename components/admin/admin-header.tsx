"use client"

import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// 路径到标题的映射
const pageTitleMap: Record<string, string> = {
  "/admin/dashboard": "数据统计",
  "/admin/sites": "网站管理",
  "/admin/categories": "分类管理",
  "/admin/data": "数据管理",
  "/admin/users": "系统设置",
}

// 导出供内容区使用的页面标题 hook
export function usePageTitle(pathname: string) {
  return pageTitleMap[pathname] || "管理后台"
}

export function AdminHeader() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }
    document.addEventListener("scroll", onScroll, { passive: true })
    return () => document.removeEventListener("scroll", onScroll)
  }, [])

  const scrolled = offset > 10

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 w-full",
        scrolled ? "shadow" : "shadow-none"
      )}
    >
      <div
        className={cn(
          "relative flex h-full items-center gap-2 px-4 lg:px-6",
          scrolled &&
            "after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg after:rounded-t-xl"
        )}
      >
        <SidebarTrigger variant="outline" className="-ml-1 max-md:scale-125" />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="sr-only">访问网站首页</span>
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
