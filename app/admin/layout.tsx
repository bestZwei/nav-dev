import type { Metadata } from "next"
import { getSystemSettings } from "@/lib/actions"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSystemSettings()
  const settings = result.success && result.data ? result.data : null
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
