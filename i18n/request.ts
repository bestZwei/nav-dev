import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { getConfiguredDefaultLanguage } from "@/lib/settings"
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/lib/i18n"

// 语言解析链：语言偏好 Cookie > 管理员配置的全局默认语言 > 兜底语言 zh。
// 使用 lib/settings 的只读投影：此配置每请求执行，绝不能触发写副作用
// （旧的 getSystemSettings 通道会在表空时创建默认记录，并发冷启动撞唯一约束）
export default getRequestConfig(async () => {
  const requested = (await cookies()).get(LOCALE_COOKIE)?.value

  let locale = defaultLocale

  if (isLocale(requested)) {
    locale = requested
  } else {
    // Cookie 缺失或非法时，读取系统设置中的全局默认语言（DB 异常时保持兜底 zh）
    const configured = await getConfiguredDefaultLanguage()
    if (isLocale(configured)) {
      locale = configured
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
