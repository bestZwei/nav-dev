import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider/theme-provider"
import { getDisplaySettings } from "@/lib/actions"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"
import { htmlLang } from "@/lib/i18n"

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  // 展示配置按当前请求的工作区覆盖（域名绑定 → 默认工作区）
  const settings = await getDisplaySettings()
  const t = await getTranslations("metadata")

  return {
    title: settings?.siteName || "Conan Nav",
    description: settings?.siteDescription || t("descriptionFallback"),
    icons: {
      icon: settings?.favicon || "/favicon.ico",
      apple: settings?.favicon || "/apple-touch-icon.png",
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()

  return (
    <html lang={htmlLang(locale)} suppressHydrationWarning>
      <head>
        {/*
          esbuild keepNames 兜底：Vercel / Cloudflare（OpenNext）构建链会把
          next-themes 的主题引导内联脚本改写为带 __name(fn, "fn") 调用的形式，
          但该 helper 只存在于服务端 bundle，浏览器执行内联脚本时抛
          ReferenceError: __name is not defined，水合整体失败（表现为回到顶部
          按钮不出现等交互失效）。此处最早注入无操作 polyfill：
          未被改写的环境不受影响，被改写的环境恢复可用。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'window.__name=window.__name||function(f){return f};',
          }}
        />
      </head>
      <body className={inter.className}>
        {/* 资源提示：提前建立第三方连接，降低图标与诗词接口的首字节延迟 */}
        <link rel="preconnect" href="https://api.jinrishici.com" />
        <link rel="dns-prefetch" href="https://favicon.im" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <SonnerToaster position="bottom-right" richColors />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
