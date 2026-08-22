import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider/theme-provider"
import { getSystemSettings } from "@/lib/actions"

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSystemSettings()
  const settings = result.success && result.data ? result.data : null

  return {
    title: settings?.siteName || "Conan Nav",
    description: settings?.siteDescription || "简洁现代化的网址导航系统",
    icons: {
      icon: settings?.favicon || "/favicon.ico",
      apple: settings?.favicon || "/apple-touch-icon.png",
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 资源提示：提前建立第三方连接，降低图标与诗词接口的首字节延迟 */}
        <link rel="preconnect" href="https://api.jinrishici.com" />
        <link rel="dns-prefetch" href="https://favicon.im" />
        <link rel="dns-prefetch" href="https://www.google.com" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SonnerToaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
