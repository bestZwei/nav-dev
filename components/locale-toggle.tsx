"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "@/lib/i18n"

export function LocaleToggle() {
  const locale = useLocale()
  const t = useTranslations("locale")
  const router = useRouter()

  // 循环切换：中文 → English → 中文 ...
  const toggleLocale = () => {
    const next: Locale = locale === "zh" ? "en" : "zh"

    // 写入语言偏好 Cookie（有效期一年），随后触发服务端按新语言重新渲染
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`

    // toast 以目标语言展示切换结果
    toast.success(t("switch"), {
      description: next === "zh" ? t("switchedToZh") : t("switchedToEn"),
    })

    router.refresh()
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={toggleLocale}>
            <Languages className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{t("switch")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("switch")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
