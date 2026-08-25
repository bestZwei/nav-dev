"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Images } from "lucide-react"
import { useFaviconService, FAVICON_SERVICES, type FaviconService } from "@/hooks/use-favicon-service"
import { toast } from "sonner"

const SERVICES: FaviconService[] = ["favicon-im", "bqb-cool", "duckduckgo"]

export function FaviconServiceToggle() {
  const { service, setService } = useFaviconService()
  const t = useTranslations("favicon")

  const handleToggle = () => {
    const currentIndex = SERVICES.indexOf(service)
    const nextIndex = (currentIndex + 1) % SERVICES.length
    const nextService = SERVICES[nextIndex]

    // 显示提示
    toast.success(t("switched"), {
      description: t("provider", { name: FAVICON_SERVICES[nextService].name }),
    })

    setService(nextService)

    // 刷新页面以应用新的服务
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
          >
            <Images className="h-4 w-4" />
            <span className="sr-only">{t("srToggle")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{FAVICON_SERVICES[service].name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
