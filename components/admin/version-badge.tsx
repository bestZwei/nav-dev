"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowUpCircle, CheckCircle2, CircleOff, Github } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type UpdateStatus = "loading" | "update" | "latest" | "unavailable" | "dev"

type VersionCheckResponse = {
  current: string
  isDev: boolean
  latest: string | null
  hasUpdate: boolean
  releaseUrl: string
  checkAvailable: boolean
}

export function VersionBadge() {
  const t = useTranslations("admin.sidebar.version")
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev"
  const isDev = version === "dev"
  const [status, setStatus] = useState<UpdateStatus>(isDev ? "dev" : "loading")
  const [latest, setLatest] = useState<string | null>(null)
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isDev) return

    let cancelled = false

    async function checkUpdate() {
      try {
        const response = await fetch("/api/admin/version")
        if (!response.ok) {
          if (!cancelled) setStatus("unavailable")
          return
        }
        const data = (await response.json()) as VersionCheckResponse
        if (cancelled) return
        if (!data.checkAvailable) {
          setStatus("unavailable")
          return
        }
        if (data.hasUpdate) {
          setLatest(data.latest)
          setReleaseUrl(data.releaseUrl)
          setStatus("update")
        } else {
          setStatus("latest")
        }
      } catch {
        if (!cancelled) setStatus("unavailable")
      }
    }

    checkUpdate()
    return () => {
      cancelled = true
    }
  }, [isDev])

  return (
    <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground group-data-[collapsible=icon]:justify-center">
      <a
        href="https://github.com/kenanlabs/nav"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        title={t("current", { version })}
      >
        <Github className="size-3.5 shrink-0" />
        <span className="font-mono group-data-[collapsible=icon]:hidden">
          {version}
        </span>
      </a>

      {status === "loading" ? (
        <Badge
          variant="outline"
          className="h-5 animate-pulse px-1.5 text-[10px] group-data-[collapsible=icon]:hidden"
        >
          ···
        </Badge>
      ) : status === "update" ? (
        <a
          href={releaseUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group-data-[collapsible=icon]:hidden"
        >
          <Badge className="h-5 gap-1 bg-emerald-600 hover:bg-emerald-600 px-1.5 text-[10px] text-white">
            <ArrowUpCircle className="size-3" />
            {t("updateAvailable", { version: latest ?? "" })}
          </Badge>
        </a>
      ) : status === "latest" ? (
        <Badge
          variant="secondary"
          className="h-5 gap-1 px-1.5 text-[10px] font-normal group-data-[collapsible=icon]:hidden"
          title={t("latest")}
        >
          <CheckCircle2 className="size-3 text-emerald-600" />
        </Badge>
      ) : status === "unavailable" ? (
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-normal group-data-[collapsible=icon]:hidden"
          title={t("unavailable")}
        >
          <CircleOff className="size-3" />
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="h-5 px-1.5 text-[10px] font-normal group-data-[collapsible=icon]:hidden"
        >
          {t("dev")}
        </Badge>
      )}
    </div>
  )
}
