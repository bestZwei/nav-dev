import { TrendingUp } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { PLUGIN_ID } from "./constants"

// 访问统计插件：站点点击埋点 + 后台访问统计（排行/频次/今日环比）。
// 埋点与统计 action 自带插件守卫；dashboard 访问区块按插件状态条件渲染
export const visitTrackingPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.visitTracking.name",
  descriptionKey: "plugins.visitTracking.description",
  icon: TrendingUp,
  version: "1.0.0",
  author: "kenanlabs",
  defaultEnabled: false,
  configFields: [],
  serverActionIds: ["recordVisit", "getVisitStats", "getVisitFrequency", "getTodayVisitStats"],
}
