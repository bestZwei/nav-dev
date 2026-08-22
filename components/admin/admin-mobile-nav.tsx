"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { AdminAvatar } from "./admin-avatar"
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  Users,
  Database,
} from "lucide-react"
import { fetchPublicSettings } from "@/lib/client-settings"

const navItems = [
  {
    title: "数据统计",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "网站管理",
    href: "/admin/sites",
    icon: Globe,
  },
  {
    title: "分类管理",
    href: "/admin/categories",
    icon: FolderKanban,
  },
  {
    title: "数据管理",
    href: "/admin/data",
    icon: Database,
  },
  {
    title: "系统设置",
    href: "/admin/users",
    icon: Users,
  },
]

interface AdminMobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminMobileNav({ open, onOpenChange }: AdminMobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [siteName, setSiteName] = useState("Conan Nav")
  const [siteLogo, setSiteLogo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      const settings = await fetchPublicSettings()
      if (!cancelled) {
        if (settings.siteName) setSiteName(settings.siteName)
        if (settings.siteLogo) setSiteLogo(settings.siteLogo)
      }
    }
    loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  // 点击导航项后关闭 Drawer
  const handleNavClick = () => {
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="left">
      <DrawerContent className="h-full w-[280px] rounded-none border-r">
        <DrawerHeader className="sr-only">
          <DrawerTitle>导航菜单</DrawerTitle>
          <DrawerDescription>管理后台导航菜单</DrawerDescription>
        </DrawerHeader>

        {/* Logo 区域 */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" onClick={handleNavClick} className="flex items-center space-x-2">
            {siteLogo && (
              <Image
                src={siteLogo}
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

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} onClick={handleNavClick}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* 用户信息 */}
        <div className="p-3">
          <AdminAvatar
            onLogout={() => {
              onOpenChange(false)
              router.push("/admin/login")
              router.refresh()
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
