import { SearchableLayout } from "@/components/layout/searchable-layout"
import { SiteGrid } from "@/components/layout/site-grid"
import { getAllCategories, getCategories, getSystemSettings, getSites } from "@/lib/actions"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// ISR 配置：每 10 秒自动重新生成页面
// 这样在 seed 后 10 秒内会自动看到新数据
// 当后台更新数据时，revalidatePath("/") 会触发立即重新生成
export const revalidate = 10

export default async function HomePage() {
  const { data: categories } = await getCategories()
  const { data: allCategories } = await getAllCategories()
  const { data: settings } = await getSystemSettings()
  const { data: allSites } = await getSites()

  // 将所有网站扁平化，用于客户端搜索
  const flatSites = allSites?.filter(site => site.isPublished) || []

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
    >
      <div className="space-y-10">
        {/* 分类内容 */}
        {categories && categories.length > 0 ? (
          <>
            {categories.map((category, index) => (
            <section key={category.id} id={`category-${category.slug}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{category.name}</h2>
                  {category.sites && category.sites.length > 0 && (
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                      {category.sites.length}
                    </Badge>
                  )}
                </div>
              </div>

              {category.sites && category.sites.length > 0 ? (
                <SiteGrid sites={category.sites} />
              ) : (
                <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20">
                  <p className="text-xs text-muted-foreground">暂无网站</p>
                </div>
              )}

              {index < categories.length - 1 && <Separator className="mt-10" />}
            </section>
          ))}
          </>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8">
            <p className="text-base font-semibold text-foreground">暂无分类数据</p>
            <p className="text-xs text-muted-foreground mt-1">
              请先在后台创建分类和网站
            </p>
          </div>
        )}
      </div>
    </SearchableLayout>
  )
}

