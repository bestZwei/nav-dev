import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { getSystemSettings } from "@/lib/actions"
import { LOCALE_COOKIE, defaultLocale, isLocale } from "@/lib/i18n"

// 语言解析链：语言偏好 Cookie > 管理员配置的全局默认语言 > 兜底语言 zh
export default getRequestConfig(async () => {
  const requested = (await cookies()).get(LOCALE_COOKIE)?.value

  let locale = defaultLocale

  if (isLocale(requested)) {
    locale = requested
  } else {
    // Cookie 缺失或非法时，读取系统设置中的全局默认语言
    try {
      const result = await getSystemSettings()
      const configured = result.success
        ? result.data?.defaultLanguage
        : undefined
      if (isLocale(configured)) {
        locale = configured
      }
    } catch {
      // 数据库异常时保持兜底语言 zh
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
