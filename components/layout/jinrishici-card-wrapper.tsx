"use client"

import { useState, useEffect } from "react"
import { usePoetryToggle } from "@/hooks/use-poetry-toggle"
import { JinrishiciCard } from "@/components/layout/jinrishici-card"

export function JinrishiciCardWrapper() {
  const { isVisible, mounted, setVisible, isEnabled } = usePoetryToggle()
  const [showCard, setShowCard] = useState(true)

  useEffect(() => {
    if (mounted) {
      setShowCard(isVisible)
    }
  }, [isVisible, mounted])

  const handleClose = () => {
    setVisible(false)
  }

  // 避免服务端水合不一致；后台总开关关闭时不渲染
  if (!mounted || !isEnabled) {
    return null
  }

  if (!showCard) {
    return null
  }

  return (
    <div
      id="jinrishici-card-anchor"
      className="fixed top-20 right-4 z-40 hidden lg:block animate-fade-in origin-top-right"
    >
      <JinrishiciCard onClose={handleClose} />
    </div>
  )
}

