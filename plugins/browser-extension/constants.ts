import type { PluginConfigField } from "@/lib/plugins/types"

export const PLUGIN_ID = "browser-extension"

// 浏览器扩展直连收录的访问令牌：管理员生成后填入扩展选项页。
// 存于插件配置（SystemSettings.pluginConfigs），不与站点数据混存
export const EXTENSION_CONFIG_FIELDS: PluginConfigField[] = [
  {
    key: "extensionToken",
    labelKey: "plugins.browserExtension.config.token",
    type: "string",
    defaultValue: "",
  },
]
