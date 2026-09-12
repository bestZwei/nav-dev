import { useTranslations } from "next-intl"
import { Github } from "lucide-react"

export function VersionBadge() {
  const t = useTranslations("admin.sidebar.version")
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev"

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
    </div>
  )
}
