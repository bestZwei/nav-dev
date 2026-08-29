import type { PluginConfigField } from "@/lib/plugins/types"

export const PLUGIN_ID = "site-submission"

// 投稿成功后触发的 webhook 事件名（供上传插件订阅）
export const WEBHOOK_SITE_SUBMITTED = "siteSubmitted"

export const SUBMISSION_CONFIG_FIELDS: PluginConfigField[] = [
  {
    key: "submissionMaxPerDay",
    labelKey: "plugins.siteSubmission.config.maxPerDay",
    type: "number",
    defaultValue: 3,
    min: 1,
    max: 100,
  },
]

// submitSite 结果错误码：客户端按 locale 映射文案
export type SubmitSiteErrorCode =
  | "PLUGIN_DISABLED"
  | "INVALID_URL"
  | "RATE_LIMITED"
  | "SUBMIT_FAILED"
