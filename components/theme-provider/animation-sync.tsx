"use client"

import { useEffect } from "react"
import { fetchPublicSettings } from "@/lib/client-settings"

export function AnimationSync() {
  useEffect(() => {
    let cancelled = false
    async function sync() {
      const settings = await fetchPublicSettings()
      if (!cancelled && settings) {
        const enabled = settings.enableAnimations !== false
        document.documentElement.setAttribute("data-animations", enabled ? "true" : "false")
      }
    }
    sync()

    const onSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ enableAnimations?: boolean }>
      if (customEvent.detail && typeof customEvent.detail.enableAnimations === "boolean") {
        document.documentElement.setAttribute(
          "data-animations",
          customEvent.detail.enableAnimations ? "true" : "false"
        )
      } else {
        sync()
      }
    }

    window.addEventListener("animations-settings-changed", onSettingsChanged)
    return () => {
      cancelled = true
      window.removeEventListener("animations-settings-changed", onSettingsChanged)
    }
  }, [])

  return null
}
