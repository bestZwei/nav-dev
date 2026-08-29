import { FileText } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { PLUGIN_ID } from "./constants"

// 站点详情弹窗插件：为站点卡片提供二级详情弹窗能力。
// UI 组件 site-detail-dialog 归属本插件；核心装配层（site-card /
// site-detail-provider 壳）按插件启用状态装配，数据获取 getSiteDetail
// 属于核心能力（弹窗与管理编辑回填共用）
export const siteDetailPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.siteDetail.name",
  descriptionKey: "plugins.siteDetail.description",
  icon: FileText,
  version: "1.0.0",
  author: "kenanlabs",
  defaultEnabled: false,
  configFields: [],
}
