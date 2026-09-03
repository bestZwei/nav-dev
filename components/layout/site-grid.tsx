"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { GripVertical, RotateCcw } from "lucide-react"
import { SiteCard, type SiteItemProps } from "./site-card"
import { useCardDensity, type CardDensity } from "@/hooks/use-card-density"
import { useLocalSiteOrder } from "@/hooks/use-local-site-order"

interface SiteGridProps {
  sites: SiteItemProps[]
  className?: string
  // 传入分类 id 时启用本地拖拽排序：拖拽结果仅保存在浏览器 localStorage
  categoryId?: string
  enableDrag?: boolean
}

export function SiteGrid({
  sites,
  className = "",
  categoryId,
  enableDrag = false,
}: SiteGridProps) {
  const { isCompact, density, mounted: densityMounted } = useCardDensity()
  const t = useTranslations("siteOrder")
  const { orderedSites, hasCustomOrder, saveOrder, resetOrder } =
    useLocalSiteOrder(categoryId, sites)

  // 图鉴模式只替换首页正文；搜索结果仍使用标准卡片网格
  const currentDensity: CardDensity =
    densityMounted && density !== "overview" ? density : "standard"

  const dragEnabled = enableDrag && Boolean(categoryId) && orderedSites.length > 1
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDrop = (targetId: string) => {
    const from = orderedSites.findIndex(s => s.id === draggedId)
    const to = orderedSites.findIndex(s => s.id === targetId)
    setDraggedId(null)
    if (from < 0 || to < 0 || from === to) return
    const next = [...orderedSites]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    saveOrder(next.map(s => s.id))
  }

  return (
    <div className={className || undefined}>
      {hasCustomOrder && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={resetOrder}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            {t("resetOrder")}
          </button>
        </div>
      )}
      <div
        className={
          currentDensity === "compact"
            ? `grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 transition-all duration-300 ease-spring`
            : `grid auto-rows-[76px] grid-cols-1 content-start gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 transition-all duration-300 ease-spring`
        }
      >
        {orderedSites.map((site, index) => (
          <div
            key={site.id}
            draggable={dragEnabled}
            onDragStart={(e) => {
              if (!dragEnabled) return
              e.dataTransfer.effectAllowed = "move"
              // Firefox 需要 dataTransfer 有内容才允许发起拖拽
              e.dataTransfer.setData("text/plain", site.id)
              setDraggedId(site.id)
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(e) => {
              if (dragEnabled && draggedId && draggedId !== site.id) {
                e.preventDefault()
              }
            }}
            onDrop={(e) => {
              if (!dragEnabled) return
              e.preventDefault()
              handleDrop(site.id)
            }}
            style={{ animationDelay: `${Math.min(index * 20, 240)}ms` }}
            className={`group relative animate-fade-in-up ${draggedId === site.id ? "opacity-40" : ""}`}
          >
            {dragEnabled && (
              <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 rounded bg-background/80 p-0.5 text-muted-foreground/60 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <GripVertical className="h-3.5 w-3.5" />
              </span>
            )}
            <SiteCard site={site} density={currentDensity} dragEnabled={dragEnabled} />
          </div>
        ))}
      </div>
    </div>
  )
}
