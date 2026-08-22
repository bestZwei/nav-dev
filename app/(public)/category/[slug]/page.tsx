import { SearchableLayout } from "@/components/layout/searchable-layout"
import { SiteGrid } from "@/components/layout/site-grid"
import { CategoryIcon } from "@/components/category-icon"
import { getAllCategories, getCategoryBySlug, getSystemSettings, getSites } from "@/lib/actions"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// ISR 配置：每 10 秒自动重新生成页面
// 这样在 seed 后 10 秒内会自动看到新数据
// 当后台更新数据时，revalidatePath("/") 会触发立即重新生成
export const revalidate = 10

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const { data: category } = await getCategoryBySlug(slug)
  const { data: allCategories } = await getAllCategories()
  const { data: settings } = await getSystemSettings()
  const { data: allSites } = await getSites()

  if (!category) {
    notFound()
  }

  // 将所有网站扁平化，用于客户端搜索
  const flatSites = allSites?.filter(site => site.isPublished) || []

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
      currentCategory={slug}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {(category as any).icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <CategoryIcon icon={(category as any).icon} className="h-5 w-5" size={20} />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/95">{category.name}</h1>
          {category.sites && category.sites.length > 0 && (
            <Badge variant="secondary" className="px-2 py-0 text-[11px] font-medium h-5 rounded-full">
              共 {category.sites.length} 个网站
            </Badge>
          )}
        </div>
      </div>

      {category.sites && category.sites.length > 0 ? (
        <SiteGrid sites={category.sites} />
      ) : (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">该分类下暂无网站</p>
          <p className="text-xs text-muted-foreground mt-1">
            请在后台添加网站到此分类
          </p>
        </div>
      )}
    </SearchableLayout>
  )
}

