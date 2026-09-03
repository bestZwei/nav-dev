"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// 显示阈值：滚动超过 min(半视口高度, 420px) 时显示按钮。
// 旧值为整个视口高度，大屏（1000px+）要滚过 1000px 才出现，体感"滚很深才出现"
const SHOW_THRESHOLD_MAX_PX = 420

function getShowThreshold(): number {
  if (typeof window === "undefined") return SHOW_THRESHOLD_MAX_PX
  return Math.min(window.innerHeight * 0.5, SHOW_THRESHOLD_MAX_PX)
}

// 按钮宽度 w-11 = 44px，半宽用于中心对齐计算
const BUTTON_HALF_WIDTH = 22

// 诗词卡片锚点 id（见 jinrishici-card-wrapper.tsx）
const POETRY_ANCHOR_ID = "jinrishici-card-anchor"

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const [marginRight, setMarginRight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("common")

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateVisibility = () => {
      setVisible(window.scrollY > getShowThreshold())
    }

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          ticking = false
          updateVisibility()
        })
      }
    }

    updateVisibility()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  // 水平位置与诗词卡片中心对齐：
  // 按钮右边缘移到「诗词卡片中心 + 按钮半宽」处，以 margin-right 表达相对内容区域右边缘的偏移
  useEffect(() => {
    if (typeof window === "undefined") return

    const updateOffset = () => {
      const container = containerRef.current
      const poetryCard = document.getElementById(POETRY_ANCHOR_ID)
      if (!container || !poetryCard) {
        setMarginRight(0)
        return
      }

      const cardRect = poetryCard.getBoundingClientRect()
      // 移动端断点隐藏时宽度为 0；插件启用时锚点常驻（用户关闭仅隐藏可见性）
      if (cardRect.width === 0 || cardRect.height === 0) {
        setMarginRight(0)
        return
      }

      const contentRight = container.parentElement?.getBoundingClientRect().right ?? 0
      const cardCenter = cardRect.left + cardRect.width / 2
      const shift = cardCenter + BUTTON_HALF_WIDTH - contentRight
      setMarginRight(-shift)
    }

    updateOffset()
    window.addEventListener("resize", updateOffset)
    // 诗词卡片挂载/插件开关变化都会改动 DOM，兜底重算
    const observer = new MutationObserver(updateOffset)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      window.removeEventListener("resize", updateOffset)
      observer.disconnect()
    }
  }, [])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div
      ref={containerRef}
      className="sticky bottom-6 z-50 flex h-11 items-end justify-end pointer-events-none"
    >
      <Button
        variant="secondary"
        size="icon"
        aria-label={t("backToTop")}
        title={t("backToTop")}
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        onClick={handleClick}
        style={{ marginRight: `${marginRight}px` }}
        className={cn(
          "h-11 w-11 rounded-full border bg-background/70 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 hover:bg-background/90 supports-[backdrop-filter]:hover:bg-background/70 transition-all duration-300 ease-spring hover:scale-110 hover:-translate-y-1 hover:shadow-xl active:scale-90 pointer-events-auto",
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-90 pointer-events-none"
        )}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  )
}
