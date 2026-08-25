"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BookOpen } from "lucide-react"
import { usePoetryToggle } from "@/hooks/use-poetry-toggle"

export function PoetryToggle() {
  const { isVisible, toggle, mounted } = usePoetryToggle()
  const t = useTranslations("poetry")

  // 古诗词显示时，不显示按钮（避免逻辑冲突）
  if (!mounted || isVisible) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
          >
            <BookOpen className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{t("show")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("show")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
