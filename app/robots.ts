import { MetadataRoute } from "next"
import { headers } from "next/headers"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const sitemapUrl = `${await getRequestBaseUrl()}/sitemap.xml`
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: sitemapUrl,
  }
}

// 从请求头推导站点根地址（与 sitemap.ts 保持一致）
async function getRequestBaseUrl(): Promise<string> {
  const fallback = process.env.NEXTAUTH_URL || "http://localhost:3000"
  try {
    const h = await headers()
    const host =
      h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      h.get("x-workspace-host") ||
      h.get("host")
    if (!host) return fallback
    const proto =
      h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    return `${proto}://${host}`
  } catch {
    return fallback
  }
}
