import type { Metadata } from "next"
import { getSystemSettingsRecord } from "@/lib/settings"
import { getTranslations } from "next-intl/server"

// 管理端元数据（含登录页）：
// 不能走 getSystemSettings server action——它在未认证时被拒绝，
// 会让登录页丢失站点名/图标；这里用只读记录查询
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettingsRecord().catch(() => null)
  const t = await getTranslations("metadata")

  return {
    title: `${settings?.siteName || "Conan Nav"} - ${t("adminTitleSuffix")}`,
    description: settings?.siteDescription || t("descriptionFallback"),
    icons: {
      icon: settings?.favicon || "/favicon.ico",
      apple: settings?.favicon || "/apple-touch-icon.png",
    },
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
