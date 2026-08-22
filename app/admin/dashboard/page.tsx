"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Loader2, BarChart3, TrendingUp, Globe, FolderKanban, Users, CalendarPlus, Inbox, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { VisitFrequencyChart } from "@/components/admin/charts/visit-frequency-chart"
import { CategoryDistributionChart } from "@/components/admin/charts/category-distribution-chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VisitStats {
  topSites: Array<{
    id: string
    name: string
    url: string
    description: string
    iconUrl: string | null
    visitCount: number
    category: {
      name: string
    }
  }>
  totalVisits: number
}

interface FrequencyData {
  frequency: Array<{
    date: string
    count: number
  }>
}

interface TodayStats {
  today: number
  yesterday: number
  growthRate: number | null
}

interface ContentStats {
  pendingSubmissions: number
  weekNewSites: number
  missingIcons: number
}

interface CategoryDistribution {
  data: Array<{
    category: string
    count: number
    share: number
  }>
  total: number
}

type TimeRange = 0 | 7 | 30 | 90
type TopCount = 5 | 10 | 30 | 0

const formatNumber = (value: number) => value.toLocaleString()

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null)
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null)
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>(7)
  const [topCount, setTopCount] = useState<TopCount>(5)
  const [siteStats, setSiteStats] = useState([
    { title: "网站总数", value: 0, loading: true, icon: Globe },
    { title: "分类总数", value: 0, loading: true, icon: FolderKanban },
    { title: "独立访客数", value: 0, loading: true, icon: Users },
    { title: "总访问量", value: 0, loading: true, icon: TrendingUp },
    { title: "今日访问", value: 0, loading: true, icon: CalendarPlus, badge: null as number | null },
    { title: "待审核提交", value: 0, loading: true, icon: Inbox, href: "/admin/sites" },
    { title: "近7天新增", value: 0, loading: true, icon: Sparkles, href: "/admin/sites" },
    { title: "缺少图标", value: 0, loading: true, icon: Globe, href: "/admin/sites" },
  ])

  // 获取时间范围描述
  const getTimeRangeLabel = (days: TimeRange) => {
    if (days === 0) return "全部时间"
    if (days === 90) return "近3个月"
    if (days === 30) return "近30天"
    return `近${days}天`
  }

  // 加载统计数据
  useEffect(() => {
    async function loadStats() {
      try {
        const [
          sitesRes,
          categoriesRes,
          usersRes,
          visitsRes,
          frequencyRes,
          todayRes,
          contentRes,
          distributionRes,
        ] = await Promise.all([
          fetch("/api/admin/stats/sites"),
          fetch("/api/admin/stats/categories"),
          fetch("/api/admin/stats/users"),
          fetch(`/api/admin/stats/visits?days=${timeRange}&limit=${topCount}`),
          fetch(`/api/admin/stats/frequency?days=${timeRange}`),
          fetch("/api/admin/stats/today"),
          fetch("/api/admin/stats/content"),
          fetch("/api/admin/stats/category-distribution"),
        ])

        const sitesData = await sitesRes.json()
        const categoriesData = await categoriesRes.json()
        const usersData = await usersRes.json()
        const visitsData = await visitsRes.json()
        const frequencyData = await frequencyRes.json()
        const todayData = await todayRes.json()
        const contentData = await contentRes.json()
        const distributionData = await distributionRes.json()

        setSiteStats([
          { title: "网站总数", value: sitesData.total || 0, loading: false, icon: Globe },
          { title: "分类总数", value: categoriesData.total || 0, loading: false, icon: FolderKanban },
          { title: "独立访客数", value: usersData.total || 0, loading: false, icon: Users },
          { title: "总访问量", value: visitsData.totalVisits || 0, loading: false, icon: TrendingUp },
          { title: "今日访问", value: todayData.today || 0, loading: false, icon: CalendarPlus, badge: todayData.growthRate ?? null },
          { title: "待审核提交", value: contentData.pendingSubmissions || 0, loading: false, icon: Inbox, href: "/admin/sites" },
          { title: "近7天新增", value: contentData.weekNewSites || 0, loading: false, icon: Sparkles, href: "/admin/sites" },
          { title: "缺少图标", value: contentData.missingIcons || 0, loading: false, icon: Globe, href: "/admin/sites" },
        ])

        setVisitStats(visitsData)
        setFrequencyData(frequencyData)
        setTodayStats(todayData)
        setContentStats(contentData)
        setCategoryDistribution(distributionData)
      } catch (error) {
        console.error("Failed to load stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [timeRange, topCount])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {siteStats.map((stat) => (
          <Card key={stat.title} className="@container/card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <CardAction>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
                  {stat.loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatNumber(stat.value)
                  )}
                </div>
                {"badge" in stat && stat.badge !== null && stat.badge !== undefined && (
                  <Badge
                    variant="outline"
                    className={
                      stat.badge >= 0
                        ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10"
                    }
                  >
                    {stat.badge >= 0 ? "+" : ""}
                    {stat.badge}%
                  </Badge>
                )}
              </div>
              {stat.title === "今日访问" && todayStats && (
                <p className="text-xs text-muted-foreground mt-1">
                  昨日 {formatNumber(todayStats.yesterday)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 排行 + 分类分布 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              网站访问排行
            </CardTitle>
            <CardDescription>
              {getTimeRangeLabel(timeRange)}热门网站
              {topCount > 5 || topCount === 0 ? "（表内滚动查看更多）" : ""}
            </CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                value={topCount.toString()}
                onValueChange={(value) => value && setTopCount(Number(value) as 5 | 10 | 30 | 0)}
                variant="outline"
                className="hidden md:flex"
              >
                <ToggleGroupItem value="5" className="rounded-r-none">Top 5</ToggleGroupItem>
                <ToggleGroupItem value="10" className="rounded-none border-l-0">Top 10</ToggleGroupItem>
                <ToggleGroupItem value="30" className="rounded-none border-l-0">Top 30</ToggleGroupItem>
                <ToggleGroupItem value="0" className="rounded-l-none border-l-0">All</ToggleGroupItem>
              </ToggleGroup>
              <Select
                value={topCount.toString()}
                onValueChange={(value) => setTopCount(Number(value) as 5 | 10 | 30 | 0)}
              >
                <SelectTrigger
                  className="flex w-28 md:hidden"
                  aria-label="选择显示数量"
                >
                  <SelectValue placeholder="选择数量" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="5" className="rounded-lg">Top 5</SelectItem>
                  <SelectItem value="10" className="rounded-lg">Top 10</SelectItem>
                  <SelectItem value="30" className="rounded-lg">Top 30</SelectItem>
                  <SelectItem value="0" className="rounded-lg">All</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent>
            {visitStats && visitStats.topSites.length > 0 ? (
              <div className="max-h-[318px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">排名</TableHead>
                      <TableHead>网站名称</TableHead>
                      <TableHead className="text-right">访问次数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitStats.topSites.map((site, index) => (
                      <TableRow key={site.id}>
                        <TableCell className="font-medium">
                          {index === 0 && (
                            <Badge variant="default">1</Badge>
                          )}
                          {index === 1 && (
                            <Badge variant="secondary">2</Badge>
                          )}
                          {index === 2 && (
                            <Badge variant="secondary">3</Badge>
                          )}
                          {index > 2 && (
                            <span className="text-muted-foreground">#{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {site.iconUrl && (
                              <img
                                src={site.iconUrl}
                                alt={site.name}
                                className="h-5 w-5 rounded"
                              />
                            )}
                            <span className="font-medium">{site.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{site.visitCount.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BarChart3 className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>暂无访问数据</EmptyTitle>
                  <EmptyDescription>
                    当前时间范围内还没有访问记录
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {categoryDistribution && (
          <CategoryDistributionChart data={categoryDistribution.data} />
        )}
      </div>

      {/* 访问频次统计 */}
      {frequencyData && (
        <VisitFrequencyChart
          data={frequencyData.frequency || []}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
    </div>
  )
}
