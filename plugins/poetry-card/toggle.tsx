"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { useHomeSideVisible, useBuiltinPluginEnabled } from "@/lib/plugins/client"
import { PLUGIN_ID } from "./constants"

// 诗词显隐工具按钮：卡片被用户隐藏后，从 header 工具栏重新打开。
// 插件禁用或卡片已显示时不渲染（避免逻辑冲突）
export function PoetryToggle() {
  const enabled = useBuiltinPluginEnabled(PLUGIN_ID)
  const { visible, mounted, setUserVisible } = useHomeSideVisible(enabled)
  const t = useTranslations("poetry")

  if (!mounted || !enabled || visible) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserVisible(true)}
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
