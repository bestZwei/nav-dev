"use client"

import { SiteCard, type SiteItemProps } from "./site-card"
import { useCardDensity } from "@/hooks/use-card-density"

interface SiteGridProps {
  sites: SiteItemProps[]
  className?: string
}

export function SiteGrid({ sites, className = "" }: SiteGridProps) {
  const { isCompact, density, mounted } = useCardDensity()

  // 避免服务端客户端水合不一致，默认标准模式
  const currentDensity = mounted ? density : "standard"

  return (
    <div
      className={
        currentDensity === "compact"
          ? `grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 transition-all duration-200 ${className}`
          : `grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all duration-200 ${className}`
      }
    >
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} density={currentDensity} />
      ))}
    </div>
  )
}
