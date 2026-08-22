"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  Users,
  Database,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { AdminAvatar } from "./admin-avatar"
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

export function AdminSidebar() {
  const pathname = usePathname()
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 pt-4 pb-2 group-data-[collapsible=icon]:!px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                {siteLogo ? (
                  <div className="flex aspect-square size-8 items-center justify-center">
                    <Image
                      src={siteLogo}
                      alt="Logo"
                      width={24}
                      height={24}
                      className="h-6 w-6 object-contain"
                      referrerPolicy="no-referrer"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-sm font-bold">{siteName.charAt(0)}</span>
                  </div>
                )}
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-bold">{siteName}</span>
                  <span className="truncate text-xs text-muted-foreground">管理后台</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3 py-4 group-data-[collapsible=icon]:!px-2">
          <SidebarGroupLabel className="px-2 text-xs text-muted-foreground">管理菜单</SidebarGroupLabel>
          <SidebarGroupContent className="mt-1">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:!p-2">
        <AdminAvatar />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
