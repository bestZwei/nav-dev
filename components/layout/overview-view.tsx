"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  useFaviconService,
  getProxiedFaviconUrl,
  proxyIconUrlIfPossible,
  type FaviconService,
} from "@/hooks/use-favicon-service"

export interface OverviewSiteEntry {
  id: string
  name: string
  url: string
  iconUrl: string | null
}

export interface OverviewCategoryEntry {
  id: string
  name: string
  sites: OverviewSiteEntry[]
}

export interface OverviewData {
  siteName: string
  siteDescription?: string
  footerCopyright?: string
  categories: OverviewCategoryEntry[]
}

function OverviewSiteIcon({
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

// 站点数超过阈值的分类横跨两列，内部站点也按两列排布，避免单列过长
const WIDE_CATEGORY_THRESHOLD = 10

export function OverviewView({ data }: { data: OverviewData }) {
  const t = useTranslations("overview")
  const tc = useTranslations("common")
  const { service } = useFaviconService()
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const visibleCategories = useMemo(
    () => data.categories.filter((category) => category.sites && category.sites.length > 0),
    [data.categories]
  )

  return (
    <div className="mx-auto w-full max-w-5xl animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {data.siteName}
      </h1>
      {data.siteDescription && (
        <p className="mt-1.5 text-sm text-muted-foreground">{data.siteDescription}</p>
      )}

      {visibleCategories.length === 0 ? (
        <div className="mt-8 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20">
          <p className="text-sm text-muted-foreground">{tc("noData")}</p>
        </div>
      ) : (
        <div
          aria-label={t("label")}
          className="mt-6 grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-4 lg:p-7"
        >
          {visibleCategories.map((category) => {
            const isWide = category.sites.length > WIDE_CATEGORY_THRESHOLD

            return (
              <section
                key={category.id}
                className={`rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5 ${
                  isWide ? "col-span-1 sm:col-span-2" : "col-span-1"
                }`}
              >
                <h2 className="text-sm font-semibold text-foreground">{category.name}</h2>
                <ul
                  className={`mt-2.5 grid gap-y-1.5 ${
                    isWide ? "grid-cols-1 gap-x-5 sm:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {category.sites.map((site) => (
                    <li key={site.id} className="flex min-w-0 items-center gap-2">
                      <OverviewSiteIcon
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
              </section>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        <span className="truncate">{data.footerCopyright}</span>
        {origin && <span className="font-mono">{origin}</span>}
      </div>
    </div>
  )
}
