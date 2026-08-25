"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Languages, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  localeNames,
  locales,
  type Locale,
} from "@/lib/i18n"

export function LocaleToggle() {
  const locale = useLocale()
  const t = useTranslations("locale")
  const router = useRouter()

  const switchLocale = (next: Locale) => {
    if (next === locale) return

    // 写入语言偏好 Cookie（有效期一年），随后触发服务端按新语言重新渲染
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`

    // toast 以目标语言展示切换结果
    toast.success(t("switch"), {
      description: t("switchedTo", { language: localeNames[next] }),
    })

    router.refresh()
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{t("switch")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((l) => (
                <DropdownMenuItem
                  key={l}
                  onClick={() => switchLocale(l)}
                  className="gap-2 justify-between"
                >
                  {localeNames[l]}
                  {l === locale && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("switch")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
