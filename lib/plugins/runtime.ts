import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import {
  PluginDisabledError,
  type PluginConfigField,
  type PluginManifest,
} from "./types"

// 运行时核心工具：被各插件的 server action 导入。
// 本模块有意保持零注册表依赖（注册表 → 插件组件 → actions 会形成环），
// 需要注册表元数据的管理面逻辑见 ./server.ts

// SystemSettings.enabledPlugins 为 Prisma Json，容忍任意脏值
function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === "string")
}

function parseConfigMap(raw: unknown): Record<string, Record<string, unknown>> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, Record<string, unknown>>
  }
  return {}
}

// ---------- 启用状态 ----------

// Plugin 表记录优先（上传插件）；无记录则视为内置插件，读 SystemSettings
export async function isPluginEnabled(id: string): Promise<boolean> {
  try {
    const uploaded = await prisma.plugin.findUnique({ where: { id } })
    if (uploaded) return uploaded.enabled
  } catch (error) {
    logger.warn("[plugins] uploaded lookup failed, fallback to builtin path:", error)
  }

  try {
    const settings = await prisma.systemSettings.findFirst()
    return parseStringArray(settings?.enabledPlugins).includes(id)
  } catch (error) {
    logger.warn("[plugins] enabled lookup failed, fallback to disabled:", error)
    return false
  }
}

// server action / API 守卫：禁用时抛出，调用方捕获后返回统一响应
export async function assertPluginEnabled(id: string): Promise<void> {
  if (!(await isPluginEnabled(id))) {
    throw new PluginDisabledError(id)
  }
}

// ---------- 配置读取 ----------

function clampNumber(value: number, field: PluginConfigField): number {
  let v = value
  if (typeof field.min === "number") v = Math.max(field.min, v)
  if (typeof field.max === "number") v = Math.min(field.max, v)
  return v
}

// 按声明字段裁剪写入值：丢弃未声明键、越界 clamp、类型纠偏
export function resolveConfig(
  fields: PluginConfigField[],
  stored: Record<string, unknown> | undefined
): Record<string, number | string | boolean> {
  const result: Record<string, number | string | boolean> = {}
  for (const field of fields) {
    const raw = stored?.[field.key]
    if (field.type === "number") {
      const n = typeof raw === "number" && Number.isFinite(raw) ? raw : Number(field.defaultValue)
      result[field.key] = clampNumber(Number.isFinite(n) ? n : 0, field)
    } else if (field.type === "boolean") {
      result[field.key] = typeof raw === "boolean" ? raw : Boolean(field.defaultValue)
    } else {
      result[field.key] = typeof raw === "string" ? raw : String(field.defaultValue)
    }
  }
  return result
}

// 读取插件配置。fields 由调用方显式传入（内置插件传自身 constants 中的声明，
// 规避运行时对注册表的依赖）；上传插件可省略，回退 manifest 内声明。
export async function getPluginConfig(
  id: string,
  fields?: PluginConfigField[]
): Promise<Record<string, number | string | boolean>> {
  try {
    const uploaded = await prisma.plugin.findUnique({ where: { id } })
    if (uploaded) {
      const manifest = uploaded.manifest as unknown as PluginManifest
      const declared = fields || manifest.configFields || []
      return resolveConfig(declared, uploaded.configs as Record<string, unknown>)
    }
  } catch (error) {
    logger.warn("[plugins] uploaded config lookup failed:", error)
  }

  if (!fields || fields.length === 0) return {}

  try {
    const settings = await prisma.systemSettings.findFirst()
    const stored = parseConfigMap(settings?.pluginConfigs)[id]
    return resolveConfig(fields, stored)
  } catch (error) {
    logger.warn("[plugins] builtin config lookup failed, fallback to defaults:", error)
    return resolveConfig(fields, undefined)
  }
}

// ---------- webhook 扩展点 ----------

// 触发所有启用中的上传插件声明的事件端点。
// 多插件并行投递（整体等待上限为单次超时 5s，避免串行放大主流程延迟）；
// 失败仅记录，不阻塞主流程
export async function firePluginWebhook(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  let rows
  try {
    rows = await prisma.plugin.findMany({ where: { enabled: true } })
  } catch (error) {
    logger.warn("[plugins] webhook fanout read failed:", error)
    return
  }

  const targets = rows
    .map((row) => ({
      id: row.id,
      endpoint: (row.manifest as unknown as PluginManifest).webhooks?.[event],
    }))
    .filter(
      (t): t is { id: string; endpoint: string } =>
        Boolean(t.endpoint) && /^https?:\/\//i.test(t.endpoint as string)
    )
  if (targets.length === 0) return

  await Promise.allSettled(
    targets.map(({ id, endpoint }) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      return fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, pluginId: id, payload }),
        signal: controller.signal,
      })
        .catch((error) => {
          logger.warn(`[plugins] webhook ${event} for ${id} failed:`, error)
        })
        .finally(() => clearTimeout(timer))
    })
  )
}
