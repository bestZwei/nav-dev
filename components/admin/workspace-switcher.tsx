"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Layers, Check, ChevronDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { getCurrentAdminWorkspace, getWorkspaceOptions } from "@/lib/actions"

interface WorkspaceOption {
  id: string
  name: string
  slug: string
  isDefault: boolean
  isPublished: boolean
}

// 纯全局页面：数据不随工作区切换（仪表盘为全站统计，工作区管理页跨工作区操作，
// 插件管理与插件启停为全站生效），切换器禁用并显示「全局」
const GLOBAL_PAGES = ["/admin/dashboard", "/admin/workspaces", "/admin/plugins"]

// 后台顶栏工作区切换器：选中值写入 admin_workspace_id Cookie，
// 分类/网址/数据等管理页面的 Server Action 均按该 Cookie 解析工作区上下文
export function WorkspaceSwitcher() {
  const t = useTranslations("admin.workspaceSwitcher")
  const router = useRouter()
  const pathname = usePathname()
  const isGlobalPage = GLOBAL_PAGES.some(p => pathname.startsWith(p))
  const [options, setOptions] = useState<WorkspaceOption[]>([])
  const [current, setCurrent] = useState<string>("")
  const [pageScope, setPageScope] = useState<"workspace" | "global">("workspace")
  const currentName = options.find(ws => ws.id === current)?.name ?? ""

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [optionsResult, currentResult] = await Promise.all([
        getWorkspaceOptions(),
        getCurrentAdminWorkspace(),
      ])
      if (cancelled) return
      if (optionsResult.success && optionsResult.data) {
        setOptions(optionsResult.data)
      }
      if (currentResult.success && currentResult.data) {
        setCurrent(currentResult.data.id)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function handleSelect(id: string) {
    if (id === current) return
    const target = options.find(ws => ws.id === id)
    setCurrent(id)
    // 会话内保持选中（30 天），后台 Actions 通过 cookies() 读取
    document.cookie = `admin_workspace_id=${id}; path=/; max-age=${30 * 24 * 3600 }; samesite=lax`
    if (target) {
      toast.success(t("switchedTo", { name: target.name }))
    }
    // 刷新服务端组件与页面数据
    router.refresh()
    // 通知同页数据列表（分类/网址页监听此事件自行重载）
    window.dispatchEvent(new CustomEvent("workspace-context-changed", { detail: { id } }))
  }

  // 设置页等页面通过事件声明当前区块作用域（global = 当前内容不随工作区变化）
  useEffect(() => {
    const onScopeChanged = (e: Event) => {
      const scope = (e as CustomEvent<{ scope?: string }>).detail?.scope
      setPageScope(scope === "global" ? "global" : "workspace")
    }
    window.addEventListener("admin-scope-changed", onScopeChanged)
    return () => window.removeEventListener("admin-scope-changed", onScopeChanged)
  }, [])

  // 离开声明过作用域的页面后重置，避免禁用态残留到其他页面
  useEffect(() => {
    setPageScope("workspace")
  }, [pathname])

  const isGlobal = isGlobalPage || pageScope === "global"

  // 始终展示当前工作区（含单工作区场景），保证后台随时可见上下文；
  // 全局页面/全局区块禁用切换并以「全局」示意内容不随工作区变化
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isGlobal ? (
            <span className="inline-flex">
              <Button variant="outline" size="sm" disabled className="h-8 gap-1.5 px-2.5 font-normal transition-all duration-200 active:scale-95 hover:bg-accent group">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{t("globalLabel")}</span>
                <span className="sr-only">{t("globalTooltip")}</span>
              </Button>
            </span>
          ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 font-normal">
                <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{currentName}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="sr-only">{t("label")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {options.map(ws => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleSelect(ws.id)}
                  className="gap-2 justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    {ws.name}
                    {ws.isDefault && (
                      <span className="text-xs text-muted-foreground">({t("defaultSuffix")})</span>
                    )}
                  </span>
                  {ws.id === current && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{isGlobalPage ? t("globalTooltip") : t("label")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
