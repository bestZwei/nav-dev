import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">页面未找到</h2>
        <p className="text-sm text-muted-foreground">
          抱歉，您访问的页面不存在或已被移除。
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
