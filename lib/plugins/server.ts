import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { pluginRegistry } from "./registry"
import type { ClientPluginView, MergedPlugin, PluginManifest } from "./types"

// 管理面运行时：合并视图（内置注册表 + 上传 Plugin 表）。
// 守卫与配置读取的轻量路径见 ./runtime.ts

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

// 内置 + 上传双源合并；任一来源读取失败均降级为空而非抛出，
// 保证插件系统自身故障不拖垮前台渲染
export async function getMergedPlugins(): Promise<MergedPlugin[]> {
  const [builtin, uploaded] = await Promise.all([
    getBuiltinPluginsSafe(),
    getUploadedPluginsSafe(),
  ])
  return [...builtin, ...uploaded]
}

async function getBuiltinPluginsSafe(): Promise<MergedPlugin[]> {
  try {
    const settings = await prisma.systemSettings.findFirst()
    const enabledIds = new Set(parseStringArray(settings?.enabledPlugins))
    return pluginRegistry.map((def) => ({
      id: def.id,
      name: def.nameKey,
      description: def.descriptionKey,
      version: def.version,
      author: def.author,
      source: "builtin" as const,
      enabled: enabledIds.has(def.id),
      configFields: def.configFields,
      headerSlot: def.headerSlot,
      footerSlot: def.footerSlot,
    }))
  } catch (error) {
    logger.warn("[plugins] builtin registry read failed:", error)
    return []
  }
}

async function getUploadedPluginsSafe(): Promise<MergedPlugin[]> {
  try {
    const rows = await prisma.plugin.findMany()
    return rows.map((row) => {
      const manifest = row.manifest as unknown as PluginManifest
      return {
        id: row.id,
        name: manifest.name || row.id,
        description: manifest.description || "",
        version: manifest.version || "",
        author: manifest.author,
        source: "uploaded" as const,
        enabled: row.enabled,
        configFields: manifest.configFields || [],
        manifestSlots: manifest.slots,
        manifestIcon: manifest.icon,
      }
    })
  } catch (error) {
    logger.warn("[plugins] uploaded plugins read failed:", error)
    return []
  }
}

// 前台下发的精简插件视图：内置只给启用 ID（组件在 bundle 内），
// 上传插件给完整声明（渲染所需元数据）。webhooks 端点不下发
export async function getClientPluginsView(): Promise<ClientPluginView> {
  const [builtin, uploaded] = await Promise.all([
    getBuiltinPluginsSafe(),
    getUploadedPluginsSafe().catch(() => [] as MergedPlugin[]),
  ])
  return {
    builtinEnabledIds: builtin.filter((p) => p.enabled).map((p) => p.id),
    uploaded: uploaded
      .filter((p) => p.enabled)
      .map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.manifestIcon,
        slots: p.manifestSlots,
      })),
  }
}
