import { z } from "zod"
import { pluginRegistry } from "./registry"
import { PLUGIN_EVENTS } from "./types"

// manifest 总大小限制（64KB）
export const MANIFEST_MAX_BYTES = 64 * 1024
// markdown 槽位内容上限（8KB）
export const MANIFEST_CONTENT_MAX = 8 * 1024

const httpUrl = z
  .string()
  .max(2048)
  .url()
  .refine((v) => /^https?:\/\//i.test(v), "URL must be http(s)")

const slotSchema = z
  .object({
    type: z.enum(["button", "link", "iframe", "markdown"]),
    label: z.string().max(64).optional(),
    icon: httpUrl.optional(),
    target: httpUrl.optional(),
    content: z.string().max(MANIFEST_CONTENT_MAX).optional(),
    width: z.number().int().min(200).max(1280).optional(),
    height: z.number().int().min(200).max(1280).optional(),
  })
  .superRefine((slot, ctx) => {
    if (slot.type === "button" || slot.type === "link") {
      if (!slot.target) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["target"], message: "target is required" })
      }
      if (!slot.label && !slot.icon) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["label"], message: "label or icon is required" })
      }
    }
    if (slot.type === "iframe" && !slot.target) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["target"], message: "target is required" })
    }
    if (slot.type === "markdown" && !slot.content) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["content"], message: "content is required" })
    }
  })

const configFieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/),
  labelKey: z.string().min(1).max(128),
  type: z.enum(["number", "string", "boolean"]),
  defaultValue: z.union([z.number(), z.string().max(512), z.boolean()]),
  min: z.number().optional(),
  max: z.number().optional(),
})

export const pluginManifestSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]{1,63}$/, "id must be lowercase alphanumeric/hyphen, 2-64 chars"),
    name: z.string().min(1).max(64),
    description: z.string().max(256).optional(),
    version: z.string().min(1).max(32),
    author: z.string().max(64).optional(),
    icon: httpUrl.optional(),
    slots: z
      .object({
        header: slotSchema.optional(),
        footer: slotSchema.optional(),
      })
      .optional(),
    // 事件名限定为核心支持清单，防止拼写错误导致订阅静默失效
    webhooks: z.record(z.enum(PLUGIN_EVENTS), httpUrl).optional(),
    configFields: z.array(configFieldSchema).max(20).optional(),
  })
  .superRefine((manifest, ctx) => {
    // 与内置插件注册表冲突检测：内置插件 ID 保留
    if (pluginRegistry.some((p) => p.id === manifest.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id"],
        message: "plugin id conflicts with a builtin plugin",
      })
    }
    // 至少声明一种能力
    const hasCapability =
      (manifest.slots?.header || manifest.slots?.footer || manifest.webhooks)
    if (!hasCapability) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slots"],
        message: "manifest must declare at least one slot or webhook",
      })
    }
  })

export type ManifestValidationResult =
  | { ok: true; manifest: z.infer<typeof pluginManifestSchema> }
  | { ok: false; errors: string[] }

// 解析并校验上传的 manifest JSON 文本；返回逐字段错误信息供管理界面展示
export function validatePluginManifest(raw: string): ManifestValidationResult {
  if (new Blob([raw]).size > MANIFEST_MAX_BYTES) {
    return { ok: false, errors: [`manifest exceeds ${MANIFEST_MAX_BYTES} bytes`] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, errors: ["manifest is not valid JSON"] }
  }

  const result = pluginManifestSchema.safeParse(parsed)
  if (result.success) {
    return { ok: true, manifest: result.data }
  }
  return {
    ok: false,
    errors: result.error.issues.map(
      (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`
    ),
  }
}
