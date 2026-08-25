import { SearchableLayout } from "@/components/layout/searchable-layout"
import { SiteGrid } from "@/components/layout/site-grid"
import { CategoryIconBadge } from "@/components/category-icon"
import { getAllCategories, getCategories, getSystemSettings, getSites } from "@/lib/actions"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "next-intl/server"

// 语言解析依赖请求级 Cookie（i18n/request.ts），页面按请求动态渲染；
// 后台数据更新时由 revalidatePath("/") 触发立即重新渲染
export default async function HomePage() {
  const { data: categories } = await getCategories()
  const { data: allCategories } = await getAllCategories()
  const { data: settings } = await getSystemSettings()
  const { data: allSites } = await getSites()
  const t = await getTranslations("home")

  // 将所有网站扁平化，用于客户端搜索
  const flatSites = allSites?.filter(site => site.isPublished) || []

    return (
      <SearchableLayout
        allCategories={allCategories || []}
        flatSites={flatSites}
        siteName={settings?.siteName}
        enableSiteDetail={settings?.enableSiteDetail}
      >
      <div className="space-y-8">
        {/* 分类内容 */}
        {categories && categories.length > 0 ? (
          <>
            {categories.map((category, index) => (
            <section key={category.id} id={`category-${category.slug}`}>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  {category.icon && (
                    <CategoryIconBadge icon={category.icon} size="md" />
                  )}
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground/95">{category.name}</h2>
                  {category.sites && category.sites.length > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-medium h-5 rounded-full">
                      {category.sites.length}
                    </Badge>
                  )}
                </div>
              </div>

              {category.sites && category.sites.length > 0 ? (
                <SiteGrid sites={category.sites} />
              ) : (
                <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{t("noSitesInCategory")}</p>
                </div>
              )}

              {index < categories.length - 1 && <Separator className="mt-8 opacity-60" />}
            </section>
          ))}
          </>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8">
            <p className="text-sm font-semibold text-foreground">{t("noCategoriesTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("noCategoriesDesc")}
            </p>
          </div>
        )}
      </div>
    </SearchableLayout>
  )
}

