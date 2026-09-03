"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader, usePageTitle } from "./admin-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const title = usePageTitle(pathname)

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AdminSidebar />
      <SidebarInset className="@container/content min-h-0 overflow-hidden">
        <div
          data-admin-scroll
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {/* 顶栏放在滚动容器内吸顶，内容从其下方穿过，backdrop-blur 才有可模糊的背景 */}
          <AdminHeader />
          <div className="px-4 pb-6 pt-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl">
            <h1 className="mb-4 text-2xl font-bold tracking-tight">{title}</h1>
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
