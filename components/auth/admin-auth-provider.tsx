"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface AdminAuthContextValue {
  isAdmin: boolean
  refreshAdminStatus: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  isAdmin: false,
  refreshAdminStatus: async () => {},
})

export function AdminAuthProvider({
  initialIsAdmin = false,
  children,
}: {
  initialIsAdmin?: boolean
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(Boolean(initialIsAdmin))

  // 当服务端直出值变更（如路由刷新、页面切换）时同步最新状态
  useEffect(() => {
    setIsAdmin(Boolean(initialIsAdmin))
  }, [initialIsAdmin])

  const refreshAdminStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/status", {
        cache: "no-store",
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
      }
    } catch {
      // 忽略临时网络异常
    }
  }, [])

  // 挂载时立即检测，并在窗口重新聚焦时自动复核（支持跨标签页登录/登出实时同步）
  useEffect(() => {
    refreshAdminStatus()
    const handleFocus = () => {
      refreshAdminStatus()
    }
    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [refreshAdminStatus])

  return (
    <AdminAuthContext.Provider value={{ isAdmin, refreshAdminStatus }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
