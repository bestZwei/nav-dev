import { Puzzle } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { EXTENSION_CONFIG_FIELDS, PLUGIN_ID } from "./constants"

// 浏览器扩展插件：配套 extension/ 目录的浏览器扩展，提供
// Token 鉴权的直连收录 API（工作区/分类由扩展侧选择，站点直接发布）。
// 纯服务端能力，无前台注入槽位；令牌在插件管理页生成
export const browserExtensionPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.browserExtension.name",
  descriptionKey: "plugins.browserExtension.description",
  icon: Puzzle,
  version: "1.0.0",
  author: "kenanlabs",
  defaultEnabled: false,
  configFields: EXTENSION_CONFIG_FIELDS,
  serverActionIds: ["getExtensionMeta", "submitSiteViaExtension"],
}
