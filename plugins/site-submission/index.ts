import { Archive } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { SiteSubmissionHeaderSlot } from "./header-slot"
import { PLUGIN_ID, SUBMISSION_CONFIG_FIELDS } from "./constants"

// 网站收录插件：访客投稿网址，站长审核后公开。
// 前台注入 header 收录入口；后端能力 submitSite 带插件守卫与每 IP 每日限额
export const siteSubmissionPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.siteSubmission.name",
  descriptionKey: "plugins.siteSubmission.description",
  icon: Archive,
  version: "1.0.0",
  author: "kenanlabs",
  // 依产品决策：升级与全新部署后默认禁用，站长在插件管理页主动开启
  defaultEnabled: false,
  configFields: SUBMISSION_CONFIG_FIELDS,
  headerSlot: SiteSubmissionHeaderSlot,
  serverActionIds: ["submitSite"],
}
