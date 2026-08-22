"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LayoutGrid, Grid3X3 } from "lucide-react"
import { useCardDensity } from "@/hooks/use-card-density"
import { useToast } from "@/hooks/use-toast"

export function CardDensityToggle() {
  const { density, toggleDensity, mounted } = useCardDensity()
  const { toast } = useToast()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled>
        <LayoutGrid className="h-4 w-4" />
      </Button>
    )
  }

  const handleToggle = () => {
    const nextMode = toggleDensity()
    toast({
      title: "已切换卡片视图",
      description: nextMode === "compact" ? "已切换为「紧凑模式」(7列极简布局)" : "已切换为「标准模式」(5列图文布局)",
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
            aria-label={`切换卡片视图模式，当前为：${isCompact ? "紧凑模式" : "标准模式"}`}
          >
            {isCompact ? (
              <Grid3X3 className="h-4 w-4 text-primary animate-scale-in" />
            ) : (
              <LayoutGrid className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
            <span className="sr-only">切换卡片大小与布局</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            卡片大小：<span className="font-semibold">{isCompact ? "紧凑模式 (7列)" : "标准模式 (5列)"}</span>
            <span className="block text-muted-foreground text-[10px] mt-0.5">点击切换视图布局</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
