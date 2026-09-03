"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Download, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useFaviconService,
  getProxiedFaviconUrl,
  proxyIconUrlIfPossible,
  type FaviconService,
} from "@/hooks/use-favicon-service"

export interface ShareSiteEntry {
  id: string
  name: string
  url: string
  iconUrl: string | null
}

export interface ShareCategoryEntry {
  id: string
  name: string
  sites: ShareSiteEntry[]
}

// 分享卡片数据：由首页服务端渲染时就地传入，弹窗打开即渲染，无运行时请求
export interface ShareData {
  siteName: string
  siteDescription?: string
  footerCopyright?: string
  categories: ShareCategoryEntry[]
}

// 站点小图标：iconUrl 优先，favicon 服务兜底，最终降级为首字母占位
function ShareSiteIcon({
  name,
  iconUrl,
  siteUrl,
  service,
}: {
  name: string
  iconUrl: string | null
  siteUrl: string
  service: FaviconService
}) {
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading")
  const initial = useMemo(() => (name.trim().charAt(0) || "?").toUpperCase(), [name])

  const iconSrc = useMemo(() => {
    if (iconUrl) return proxyIconUrlIfPossible(iconUrl)
    try {
      return getProxiedFaviconUrl(new URL(siteUrl).hostname, service)
    } catch {
      return null
    }
  }, [iconUrl, siteUrl, service])

  useEffect(() => {
    setLoadState(iconSrc ? "loading" : "error")
  }, [iconSrc])

  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-[3px]">
      {iconSrc && loadState !== "error" && (
        <Image
          src={iconSrc}
          alt=""
          width={16}
          height={16}
          sizes="16px"
          referrerPolicy="no-referrer"
          loading="lazy"
          unoptimized
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
          className={`h-full w-full object-contain transition-opacity duration-200 ${
            loadState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {(loadState === "error" || !iconSrc) && (
        <span className="flex h-full w-full select-none items-center justify-center bg-muted text-[9px] font-bold text-muted-foreground">
          {initial}
        </span>
      )}
    </span>
  )
}

// 站点数超过该阈值的分类横跨两列，内部站点按两列排布，避免单列过长
const WIDE_CATEGORY_THRESHOLD = 10

// 分享弹窗：以独立卡片呈现站点全貌供截图分享
function ShareDialog({
  open,
  onOpenChange,
  data,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ShareData
}) {
  const t = useTranslations("share")
  const tc = useTranslations("common")
  const { service } = useFaviconService()
  const [origin, setOrigin] = useState("")
  const [exporting, setExporting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  // 无已发布站点的分类整体隐藏
  const visibleCategories = useMemo(
    () => data.categories.filter((c) => c.sites && c.sites.length > 0),
    [data.categories]
  )

  // 1x1 透明 PNG：图标拉取失败（CORS/混合内容被阻止等）时的兜底占位。
  // 失败图在页面上本就隐藏（首字母占位显示），透明占位与其视觉一致
  const TRANSPARENT_IMAGE_PLACEHOLDER =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

  // 将图片 URL 转为 dataURL；跨域、混合内容等失败场景返回 null 由调用方兜底
  const fetchAsDataUrl = async (src: string): Promise<string | null> => {
    try {
      const res = await fetch(src, { mode: "cors", credentials: "omit" })
      if (!res.ok) return null
      const blob = await res.blob()
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader()
        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : null)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  // 一键导出卡片为 PNG：html-to-image 按需动态加载；
  // 深色主题下临时给卡片挂 .dark 类，保证克隆节点内 CSS 变量解析为深色值
  const handleSaveImage = async () => {
    const node = cardRef.current
    if (!node || exporting) return
    setExporting(true)
    const isDark = document.documentElement.classList.contains("dark")
    if (isDark) node.classList.add("dark")

    // 预转换卡片内全部图标为 dataURL 后再导出，html-to-image 无需再发起
    // 图片请求，跨域/混合内容等场景便无法令整体导出失败；
    // 导出完成后恢复原 src，保证 React 状态与 DOM 一致
    const imgNodes = Array.from(node.querySelectorAll("img"))
    const originalSrcs = imgNodes.map((img) => img.getAttribute("src"))

    try {
      await Promise.all(
        imgNodes.map(async (img, i) => {
          const src = originalSrcs[i]
          if (!src) return
          const imageDataUrl = await fetchAsDataUrl(src)
          img.setAttribute(
            "src",
            imageDataUrl || TRANSPARENT_IMAGE_PLACEHOLDER
          )
        })
      )

      const { toPng } = await import("html-to-image")
      // 页面自定义字体（如 @import 引入的字体 CSS）在克隆文档插入常失败，直接跳过
      const dataUrl = await toPng(node, { pixelRatio: 2, skipFonts: true })
      const link = document.createElement("a")
      link.download = `${data.siteName.replace(/[\\/:*?"<>|]+/g, "-") || "share"}-share.png`
      link.href = dataUrl
      link.click()
      toast.success(t("saved"))
    } catch (err) {
      console.error("Failed to export share card:", err)
      toast.error(t("saveFailed"))
    } finally {
      imgNodes.forEach((img, i) => {
        const src = originalSrcs[i]
        if (src !== null) img.setAttribute("src", src)
      })
      if (isDark) node.classList.remove("dark")
      setExporting(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
        <DialogDescription>{t("description")}</DialogDescription>
      </DialogHeader>

      <div className="-mx-1 max-h-[70vh] overflow-y-auto px-1">
        <div ref={cardRef} className="rounded-xl border bg-card p-5 sm:p-8">
          {/* 卡片头部：站点名 + 描述 */}
          <h3 className="text-2xl font-bold tracking-tight text-foreground">
            {data.siteName}
          </h3>
          {data.siteDescription && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {data.siteDescription}
            </p>
          )}

          {/* 卡片内容：默认 4 列网格，站点多的分类跨两列；每格带浅边框 */}
          {visibleCategories.length === 0 ? (
            <div className="mt-8 flex min-h-[120px] items-center justify-center">
              <p className="text-sm text-muted-foreground">{tc("noData")}</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {visibleCategories.map((category) => {
                const isWide = category.sites.length > WIDE_CATEGORY_THRESHOLD
                return (
                  <div
                    key={category.id}
                    className={`rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5 ${
                      isWide ? "col-span-1 sm:col-span-2" : "col-span-1"
                    }`}
                  >
                    <h4 className="text-sm font-semibold text-foreground">
                      {category.name}
                    </h4>
                    <ul
                      className={`mt-2.5 grid gap-y-1.5 ${
                        isWide ? "grid-cols-1 gap-x-5 sm:grid-cols-2" : "grid-cols-1"
                      }`}
                    >
                      {category.sites.map((site) => (
                        <li key={site.id} className="flex min-w-0 items-center gap-2">
                          <ShareSiteIcon
                            name={site.name}
                            iconUrl={site.iconUrl}
                            siteUrl={site.url}
                            service={service}
                          />
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={site.name}
                            className="min-w-0 truncate text-xs text-foreground/90 underline decoration-border underline-offset-[3px] transition-colors hover:text-primary hover:decoration-primary"
                          >
                            {site.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}

          {/* 卡片底部：版权与站点地址 */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
            <span className="truncate">{data.footerCopyright}</span>
            {origin && <span className="font-mono">{origin}</span>}
          </div>
        </div>
      </div>

      {/* 导出操作：卡片在滚动容器内可完整导出，按钮固定在弹窗底部始终可见 */}
      <DialogFooter className="border-t pt-4 sm:justify-center">
        <Button onClick={handleSaveImage} disabled={exporting} className="min-w-36">
          <Download className="h-4 w-4" />
          {exporting ? t("saving") : t("saveImage")}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// Header 工具按钮：数据仅由首页传入，天然限定分享入口仅出现在首页
export function ShareToggle({ data }: { data?: ShareData }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations("share")

  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Share2 className="h-[1.2rem] w-[1.2rem] transition-transform duration-200 group-hover:scale-110" />
                <span className="sr-only">{t("toggle")}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("toggle")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ShareDialog open={open} onOpenChange={setOpen} data={data} />
    </Dialog>
  )
}
