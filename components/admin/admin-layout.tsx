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
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="@container/content">
        <AdminHeader />
        <div className="flex-1 px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl">
          <h1 className="mb-4 text-2xl font-bold tracking-tight">{title}</h1>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
