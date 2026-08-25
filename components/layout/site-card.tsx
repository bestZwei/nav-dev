"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ExternalLink, Copy, Check, Pin } from "lucide-react"
import { useFaviconService, getProxiedFaviconUrl, proxyIconUrlIfPossible } from "@/hooks/use-favicon-service"
import { useCardDensity } from "@/hooks/use-card-density"
import { useSiteDetail } from "@/components/layout/site-detail-provider"
import { SiteDetailDialog } from "@/components/layout/site-detail-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// 生成首字母图标
function getInitial(name: string): string {
  if (!name) return "?"
  const firstChar = name.trim().charAt(0)
  return firstChar.toUpperCase()
}

export interface SiteItemProps {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  categoryId?: string
  isPinned?: boolean
  hasDetail?: boolean
  category?: {
    name: string
  } | null
}

interface SiteCardProps {
  site: SiteItemProps
  density?: "standard" | "compact"
}

// 独立的网站图标组件：支持 Next.js Image 优化、占位符骨架屏动画与平滑渐变
function SiteIcon({
  iconSrc,
  name,
  size = "standard",
}: {
  iconSrc: string | null
  name: string
  size?: "standard" | "compact"
}) {
  const t = useTranslations("siteCard")
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading")
  const initial = useMemo(() => getInitial(name), [name])
  const isCompact = size === "compact"

  // 当 iconSrc 改变时重置状态
  useEffect(() => {
    if (!iconSrc) {
      setLoadState("error")
    } else {
      setLoadState("loading")
    }
  }, [iconSrc])

  const containerSizeClass = isCompact ? "h-7 w-7 rounded-md p-0.5" : "h-10 w-10 rounded-lg p-1"
  const pixelSize = isCompact ? 22 : 36

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-border/50 bg-muted/40 transition-transform duration-200 group-hover:scale-105 ${containerSizeClass}`}
    >
      {/* 骨架屏加载动画占位符 */}
      {loadState === "loading" && iconSrc && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted/60">
          <div className="h-full w-full animate-pulse bg-gradient-to-tr from-muted/80 via-muted to-muted/80 rounded" />
        </div>
      )}

      {/* Next.js 优化后的 Image 组件 */}
      {iconSrc && loadState !== "error" && (
        <Image
          src={iconSrc}
          alt={t("iconAlt", { name })}
          width={pixelSize}
          height={pixelSize}
          sizes={isCompact ? "28px" : "40px"}
          referrerPolicy="no-referrer"
          loading="lazy"
          unoptimized
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
          className={`h-full w-full object-contain rounded-xs transition-all duration-300 ease-out ${
            loadState === "loaded" ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        />
      )}

      {/* 加载失败或无图标时的首字母占位 */}
      {(loadState === "error" || !iconSrc) && (
        <div
          className={`flex h-full w-full items-center justify-center font-bold text-muted-foreground select-none animate-fade-in ${
            isCompact ? "text-[11px]" : "text-sm"
          }`}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

export function SiteCard({ site, density: propDensity }: SiteCardProps) {
  const [copied, setCopied] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const { service } = useFaviconService()
  const { density: contextDensity } = useCardDensity()
  const { enableSiteDetail } = useSiteDetail()
  const t = useTranslations("siteCard")

  const density = propDensity || contextDensity
  const isCompact = density === "compact"

  // 详情弹窗开启条件：全局开关开启 且 站点已填写详情内容
  const useDetailDialog = enableSiteDetail && site.hasDetail === true

  const iconSrc = useMemo(() => {
    if (site.iconUrl) return proxyIconUrlIfPossible(site.iconUrl)

    try {
      const domain = new URL(site.url).hostname
      return getProxiedFaviconUrl(domain, service)
    } catch {
      return null
    }
  }, [site.iconUrl, site.url, service])

  const handleClick = () => {
    if (navigator.sendBeacon && !useDetailDialog) {
      const data = JSON.stringify({ siteId: site.id })
      navigator.sendBeacon("/api/visit", new Blob([data], { type: "application/json" }))
    }
  }

  // 弹窗模式下拦截默认导航，改为打开详情弹窗
  const handleCardClick = (e: React.MouseEvent) => {
    if (useDetailDialog) {
      e.preventDefault()
      setDetailOpen(true)
    } else {
      handleClick()
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(site.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // ================= 紧凑模式 (Compact Mode) =================
  if (isCompact) {
    return (
      <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCardClick}
              aria-label={t("visit", { name: site.name })}
              className={`group relative flex h-12 items-center gap-2.5 rounded-lg border px-3 py-2 text-card-foreground shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs select-none ${
                site.isPinned
                  ? "border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/60 hover:bg-amber-500/[0.08]"
                  : "border-border/80 bg-card hover:border-primary/40 hover:bg-accent/40"
              }`}
            >
              <SiteIcon iconSrc={iconSrc} name={site.name} size="compact" />

              <div className="flex-1 min-w-0 pr-1 flex items-center gap-1.5">
                <span className="truncate text-xs sm:text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {site.name}
                </span>
                {site.isPinned && (
                  <span title={t("pinned")} className="inline-flex shrink-0">
                    <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />
                  </span>
                )}
              </div>

              <div className="shrink-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            className="max-w-[280px] p-3 text-left shadow-lg border bg-popover text-popover-foreground rounded-lg"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-sm text-foreground">{site.name}</span>
              {site.isPinned && (
                <span title={t("pinned")} className="inline-flex items-center">
                  <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />
                </span>
              )}
              {site.category?.name && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {site.category.name}
                </span>
              )}
            </div>
            {site.description ? (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {site.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">{t("noDescription")}</p>
            )}
            <p className="mt-2 text-[10px] text-muted-foreground/80 font-mono truncate border-t border-border/40 pt-1.5">
              {site.url}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {detailOpen && (
        <SiteDetailDialog
          site={site}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
      </>
    )
  }

  // ================= 标准模式 (Standard Mode) =================
  return (
    <>
    <Link
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleCardClick}
      aria-label={t("visit", { name: site.name })}
      className="group relative block h-full select-none"
    >
      <div className={`relative flex h-full items-start gap-3.5 rounded-xl border p-3.5 sm:p-4 text-card-foreground shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${
        site.isPinned
          ? "border-amber-500/30 bg-card hover:border-amber-500/60 ring-1 ring-amber-500/10"
          : "border-border/80 bg-card hover:border-primary/40 hover:bg-card"
      }`}>
        {/* 网站图标 */}
        <SiteIcon iconSrc={iconSrc} name={site.name} size="standard" />

        {/* 网站标题与描述 */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5">
            <h3
              className="text-sm sm:text-base font-semibold leading-snug tracking-tight text-foreground transition-colors duration-150 group-hover:text-primary line-clamp-1"
              title={site.name}
            >
              {site.name}
            </h3>
            {site.isPinned && (
              <span title={t("pinned")} className="inline-flex shrink-0">
                <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              </span>
            )}
          </div>
          {site.description ? (
            <p
              className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed"
              title={site.description}
            >
              {site.description}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/60 italic">{t("noDescription")}</p>
          )}
        </div>

        {/* 悬停快捷操作 */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            onClick={handleCopy}
            title={copied ? t("copied") : t("copy")}
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500 animate-scale-in" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
          <div className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
    {detailOpen && (
      <SiteDetailDialog
        site={site}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    )}
    </>
  )
}

