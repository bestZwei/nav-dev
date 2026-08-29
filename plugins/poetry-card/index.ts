import { BookOpen } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { HomeSideCard } from "./home-side-card"
import { PoetryToggle } from "./toggle"
import { PLUGIN_ID } from "./constants"

// 今日诗词插件：首页右上角展示诗词卡片。
// header 工具按钮在卡片隐藏后提供重新打开入口；
// 站长启停走插件开关，用户显隐走 homeSide 可见性协议
export const poetryCardPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.poetryCard.name",
  descriptionKey: "plugins.poetryCard.description",
  icon: BookOpen,
  version: "1.0.0",
  author: "kenanlabs",
  defaultEnabled: false,
  configFields: [],
  headerToolsSlot: PoetryToggle,
  homeSideSlot: HomeSideCard,
}
