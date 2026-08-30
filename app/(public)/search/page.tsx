import { SearchPageHeader } from "@/components/layout/search-page-header"
import { Footer } from "@/components/layout/footer"
import { SiteCard } from "@/components/layout/site-card"
import { searchSites, getAllCategories, getDisplaySettings } from "@/lib/actions"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query } = await searchParams
  const { data: categories } = await getAllCategories()
  const settings = await getDisplaySettings()
  const t = await getTranslations("search")

  if (!query) {
    redirect("/")
  }

  const { data: sites } = await searchSites(query)

  return (
    <div className="min-h-screen flex flex-col">
      <SearchPageHeader
        categories={categories || []}
        siteName={settings?.siteName}
        initialQuery={query}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 page-enter">
        <div className="mx-auto max-w-7xl w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{t("resultsTitle")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("keywordLabel")}<span className="font-semibold text-foreground">{t("quoted", { query })}</span>
              {sites && (
                <span className="ml-2">
                  {t("foundResults", { count: sites.length })}
                </span>
              )}
            </p>
          </div>

          {!sites || sites.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
              <p className="text-lg text-muted-foreground">{t("notFoundTitle")}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("tryOtherKeywords")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
