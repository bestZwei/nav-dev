import { prisma } from "./prisma"
import { isLocale } from "./i18n"

// 系统设置读取的基础模块（非 "use server"）。
// 同一逻辑若写在 "use server" 文件里会意外导出成公开可调用的 RPC 端点；
// actions / i18n / API 路由统一从这里取数，权限口径由各调用方自行收口。

// 读取唯一设置记录；不存在时创建默认记录。
// 冷启动并发首建会撞 id="default" 唯一约束（P2002），捕获后回落为读取。
export async function getSystemSettingsRecord() {
  let settings = await prisma.systemSettings.findFirst()
  if (!settings) {
    try {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
        },
      })
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        settings = await prisma.systemSettings.findFirst()
      } else {
        throw error
      }
    }
    // 重新获取以确保使用数据库默认值（siteName 等）
    if (settings) {
      settings = await prisma.systemSettings.findFirst()
    }
  }
  return settings
}

// i18n 专用只读投影：无写副作用，DB 异常/记录缺失时返回 undefined，
// 由调用方回退兜底语言。绝不在此处创建默认记录（每请求执行的热路径）
export async function getConfiguredDefaultLanguage(): Promise<string | undefined> {
  try {
    const settings = await prisma.systemSettings.findFirst({
      select: { defaultLanguage: true },
    })
    const configured = settings?.defaultLanguage
    return isLocale(configured) ? configured : undefined
  } catch {
    return undefined
  }
}
