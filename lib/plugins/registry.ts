import { siteSubmissionPlugin } from "@/plugins/site-submission"
import { browserExtensionPlugin } from "@/plugins/browser-extension"
import { poetryCardPlugin } from "@/plugins/poetry-card"
import { visitTrackingPlugin } from "@/plugins/visit-tracking"
import { siteDetailPlugin } from "@/plugins/site-detail"
import { aboutPagePlugin } from "@/plugins/about-page"
import type { PluginDefinition } from "./types"

// 内置插件注册表：新增内置插件仅需 import 并在此数组登记一行。
// 上传插件走 Plugin 表，与注册表在 server.ts 中合并为统一视图。
export const pluginRegistry: PluginDefinition[] = [
  siteSubmissionPlugin,
  browserExtensionPlugin,
  poetryCardPlugin,
  visitTrackingPlugin,
  siteDetailPlugin,
  aboutPagePlugin,
]

// 开发期断言：ID 唯一，构建期 fail-fast
if (process.env.NODE_ENV === "development") {
  const seen = new Set<string>()
  for (const plugin of pluginRegistry) {
    if (seen.has(plugin.id)) {
      throw new Error(`[plugins] duplicate plugin id: ${plugin.id}`)
    }
    seen.add(plugin.id)
  }
}
