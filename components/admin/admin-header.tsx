"use client"

import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

// 路径到标题的映射
const pageTitleMap: Record<string, string> = {
  "/admin/dashboard": "数据统计",
  "/admin/sites": "网站管理",
  "/admin/categories": "分类管理",
  "/admin/data": "数据管理",
  "/admin/users": "系统设置",
}

export function AdminHeader() {
  const pathname = usePathname()

  // 获取当前页面的标题，默认为"管理后台"
  const title = pageTitleMap[pathname] || "管理后台"

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
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
