import { FileText } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { PLUGIN_ID } from "./constants"

// 关于页面插件：启用后前台出现 /about 路由入口（页脚链接 + sitemap）。
// 内容为 Markdown：全局默认存 SystemSettings.aboutContent，工作区可覆盖；
// 内容数据与插件开关分离（禁用插件保留内容，重新启用即恢复）
export const aboutPagePlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.aboutPage.name",
  descriptionKey: "plugins.aboutPage.description",
  icon: FileText,
  version: "1.0.0",
  author: "kenanlabs",
  defaultEnabled: false,
  configFields: [],
}
