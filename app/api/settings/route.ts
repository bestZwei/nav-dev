import { NextResponse } from "next/server"
import { getDisplaySettings } from "@/lib/actions"
import { defaultSettings } from "@/lib/client-settings"
import { getClientPluginsView } from "@/lib/plugins/server"

// 公开设置接口：展示项（标题/描述/Logo/Favicon）按当前请求的工作区覆盖后返回。
// aboutContent 为 /about 页专用，整篇 Markdown 不随本接口下发（启停走 about-page 插件状态）；
// plugins 仅下发启用的插件精简视图（内置只给 ID，上传给渲染声明），webhooks 端点不外泄
export async function GET() {
  try {
    const [merged, plugins] = await Promise.all([getDisplaySettings(), getClientPluginsView()])
    const {
      id,
      aboutContent: _aboutContent,
      enabledPlugins: _enabledPlugins,
      pluginConfigs: _pluginConfigs,
      ...publicSettings
    } = merged as Record<string, unknown> & { id?: string }
    return NextResponse.json({ ...defaultSettings, ...publicSettings, plugins })
  } catch (error) {
    console.warn("Using default settings fallback:", error)
    return NextResponse.json(defaultSettings)
  }
}
