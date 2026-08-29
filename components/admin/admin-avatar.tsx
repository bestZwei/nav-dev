"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserEditDialog } from "./user-edit-dialog"
import { LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"

interface UserData {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
}

// 缓存用户数据（模块级缓存，不要持久化到 localStorage）
let userCache: UserData | null = null

// 清除缓存的辅助函数（用于调试或登出后）
export function clearUserCache() {
  userCache = null
}

export function AdminAvatar() {
  const router = useRouter()
  const t = useTranslations("admin.profile")
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    // 从缓存获取用户信息
    if (userCache) {
      setUser(userCache)
      setIsLoading(false)
      return
    }

    // 从 cookie 获取用户 ID
    const getUserId = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include", // 确保发送 cookie
        })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            userCache = data.user
            setUser(data.user)
          } else {
            console.error("No user data in response:", data)
          }
        } else if (res.status === 401) {
          // 会话无效（/api/admin/me 已在 401 响应中清除脏 cookie）：
          // 硬跳转到登录页重新认证，避免停留在无会话的管理页面上
          window.location.href = "/admin/login"
        } else {
          // 仅在 API 真的返回了 JSON 错误时记录日志；5xx 或 HTML 响应
          // （如反向代理 530 / 网关超时）属于网络层问题，避免在控制台刷红
          const ctype = res.headers.get("content-type") || ""
          if (ctype.includes("application/json")) {
            const body = await res.json().catch(() => null)
            console.error("Failed to fetch user:", res.status, body)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [])

  // 退出登录处理
  const handleLogout = async () => {
    try {
      // 清除用户缓存
      clearUserCache()
      // 调用退出 API
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" })
      // 跳转到登录页
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user) {
    return null
  }

  // 生成用户名首字母作为 fallback
  const initials = user.name
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-pointer"
          onClick={() => setEditDialogOpen(true)}
          tooltip={user.name || t("admin")}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">{user.name || t("admin")}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </SidebarMenuButton>
        <SidebarMenuAction
          title={t("logout")}
          onClick={handleLogout}
          className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
        >
          <LogOut />
          <span className="sr-only">{t("logout")}</span>
        </SidebarMenuAction>
      </SidebarMenuItem>

      {editDialogOpen && (
        <UserEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={user.id}
          userEmail={user.email}
          userName={user.name}
          onUpdate={(updatedUser) => {
            userCache = updatedUser
            setUser(updatedUser)
          }}
        />
      )}
    </SidebarMenu>
  )
}
