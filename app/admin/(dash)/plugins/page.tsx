import { getMergedPlugins } from "@/lib/plugins/server"
import { getPluginConfig } from "@/lib/plugins/runtime"
import { PluginsManager } from "@/components/admin/plugins-manager"

export const dynamic = "force-dynamic"

export default async function AdminPluginsPage() {
  const plugins = await getMergedPlugins()
  // RSC → client 仅传可序列化数据（组件字段不跨越边界，
  // 客户端从 bundle 内注册表自取内置插件图标）
  const items = await Promise.all(
    plugins.map(async (plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      source: plugin.source,
      enabled: plugin.enabled,
      configFields: plugin.configFields,
      manifestIcon: plugin.manifestIcon,
      configValues: await getPluginConfig(plugin.id, plugin.configFields),
    }))
  )

  return <PluginsManager plugins={items} />
}
