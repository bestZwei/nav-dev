"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LayoutGrid, Grid3X3, BookMarked } from "lucide-react"
import { useCardDensity } from "@/hooks/use-card-density"
import { toast } from "sonner"

export function CardDensityToggle() {
  const { density, toggleDensity, isOverview, mounted } = useCardDensity()
  const t = useTranslations("density")

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled>
        <LayoutGrid className="h-4 w-4" />
      </Button>
    )
  }

  const handleToggle = () => {
    const nextMode = toggleDensity()
    toast.success(t("changedTitle"), {
      description:
        nextMode === "compact"
          ? t("switchedToCompact")
          : nextMode === "overview"
            ? t("switchedToOverview")
            : t("switchedToStandard"),
      duration: 2000,
    })
  }

  const isCompact = density === "compact"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="h-9 w-9 transition-transform active:scale-95"
            aria-label={t("ariaLabel", {
              mode: isOverview ? t("overview") : isCompact ? t("compact") : t("standard"),
            })}
          >
            {isOverview ? (
              <BookMarked className="h-4 w-4 text-primary animate-scale-in" />
            ) : isCompact ? (
              <Grid3X3 className="h-4 w-4 text-primary animate-scale-in" />
            ) : (
              <LayoutGrid className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
            <span className="sr-only">{t("srToggle")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {t("sizeLabel")}：
            <span className="font-semibold">
              {isOverview ? t("overview") : isCompact ? t("compact") : t("standard")}
            </span>
            <span className="block text-muted-foreground text-[10px] mt-0.5">{t("clickHint")}</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
