import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

export default async function NotFound() {
  const t = await getTranslations("notFound")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="text-xl font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
