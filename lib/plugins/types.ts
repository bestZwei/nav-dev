import type { ComponentType } from "react"

export type PluginConfigFieldType = "number" | "string" | "boolean"

export interface PluginConfigField {
  key: string
  // 内置插件存 i18n key（plugins.siteSubmission.config.*）；
  // 上传插件直接存明文文案，渲染时无对应翻译则原样显示
  labelKey: string
  type: PluginConfigFieldType
  defaultValue: number | string | boolean
  min?: number
  max?: number
}

// 内置插件定义（代码级，注册表登记）
export interface PluginDefinition {
  id: string
  nameKey: string
  descriptionKey: string
  icon: ComponentType<{ className?: string }>
  version: string
  author?: string
  defaultEnabled: boolean
  configFields: PluginConfigField[]
  // 前台 header 功能入口（如收录按钮）
  headerSlot?: ComponentType
  // 前台 header 工具开关按钮（如诗词显隐切换）
  headerToolsSlot?: ComponentType
  // 首页右侧侧栏卡片（配合 useHomeSideVisible 协议）
  homeSideSlot?: ComponentType
  footerSlot?: ComponentType
  // 声明的后端能力 ID，供守卫与文档使用
  serverActionIds?: string[]
}

// 上传插件 manifest 的注入槽位（声明式四形态，零代码执行）
export interface ManifestSlot {
  type: "button" | "link" | "iframe" | "markdown"
  label?: string
  icon?: string
  // link/button 的跳转地址；iframe 的嵌入地址
  target?: string
  // markdown 形态的内容
  content?: string
  // iframe 弹窗尺寸
  width?: number
  height?: number
}

export interface PluginManifest {
  id: string
  name: string
  description?: string
  version: string
  author?: string
  icon?: string
  slots?: {
    header?: ManifestSlot
    footer?: ManifestSlot
  }
  // 核心扩展点 → 插件端点（第一期支持 siteSubmitted）
  webhooks?: Record<string, string>
  configFields?: PluginConfigField[]
}

// 注入点与管理页统一消费的合并视图
export interface MergedPlugin {
  id: string
  name: string
  description: string
  version: string
  author?: string
  source: "builtin" | "uploaded"
  enabled: boolean
  configFields: PluginConfigField[]
  headerSlot?: ComponentType
  footerSlot?: ComponentType
  // 上传插件的声明槽位（由 ManifestPluginRenderer 渲染）
  manifestSlots?: PluginManifest["slots"]
  manifestIcon?: string
}

// client-settings 下发到浏览器的精简插件视图（不包含服务端能力）
export interface ClientPluginView {
  builtinEnabledIds: string[]
  uploaded: Array<{
    id: string
    name: string
    icon?: string
    slots?: PluginManifest["slots"]
  }>
}

export const PLUGIN_DISABLED_CODE = "PLUGIN_DISABLED"

// 上传插件可订阅的核心事件（manifest.webhooks 键必须取自此清单）
export const PLUGIN_EVENTS = [
  "siteSubmitted",
  "sitePublished",
  "siteUnpublished",
  "siteDeleted",
] as const

export type PluginEvent = (typeof PLUGIN_EVENTS)[number]

export class PluginDisabledError extends Error {
  constructor(public pluginId: string) {
    super(`Plugin "${pluginId}" is disabled`)
    this.name = "PluginDisabledError"
  }
}
