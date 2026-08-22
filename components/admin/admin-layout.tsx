"use client"

import * as React from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="@container/content h-svh md:peer-data-[variant=inset]:h-[calc(100svh-1rem)]">
        <AdminHeader />
        <div className="flex-1 overflow-y-auto px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
