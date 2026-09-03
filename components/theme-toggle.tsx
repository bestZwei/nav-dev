"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Moon, Sun, Laptop } from "lucide-react"
import { toast } from "sonner"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const t = useTranslations("theme")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 循环切换：浅色 → 深色 → 跟随系统 → 浅色 ...
  const cycleTheme = () => {
    const currentTheme = theme || "system"
    let nextTheme: string = ""

    if (theme === "light") {
      nextTheme = "dark"
      setTheme("dark")
    } else if (theme === "dark") {
      nextTheme = "system"
      setTheme("system")
    } else {
      nextTheme = "light"
      setTheme("light")
    }

    // 获取主题名称
    const getThemeName = (tm: string) => {
      if (tm === "system") return t("system")
      if (tm === "light") return t("light")
      return t("dark")
    }

    // 显示提示
    toast.success(t("changedTitle"), {
      description: `${getThemeName(currentTheme)} → ${getThemeName(nextTheme)}`,
    })
  }

  // 获取当前主题的显示名称
  const getThemeLabel = () => {
    if (theme === "system") {
      return `${t("system")} (${resolvedTheme === "dark" ? t("darkShort") : t("lightShort")})`
    }
    if (theme === "light") return t("light")
    return t("dark")
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  // 判断实际应用的主题（考虑 system 模式）
  const effectiveTheme = theme === "system" ? resolvedTheme : theme

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
          >
            <Sun className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-spring ${
              theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} />
            <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-spring ${
              theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} />
            <Laptop className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-spring ${
              theme === 'system' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} />
            <span className="sr-only">{t("toggle")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getThemeLabel()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
