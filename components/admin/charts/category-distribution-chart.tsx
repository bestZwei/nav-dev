"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { FolderKanban } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface CategoryDistributionChartProps {
  data: Array<{
    category: string
    count: number
    share: number
  }>
}

// 五个官方主题色循环使用，超过 5 个分类自动循环
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  // 前 5 个分类 + 其余合并为「其他」
  const displayData = (() => {
    if (data.length <= 6) return data
    const top = data.slice(0, 5)
    const rest = data.slice(5)
    const restCount = rest.reduce((sum, d) => sum + d.count, 0)
    const total = data.reduce((sum, d) => sum + d.count, 0)
    return [
      ...top,
      {
        category: "其他",
        count: restCount,
        share: total > 0 ? Math.round((restCount / total) * 100) : 0,
      },
    ]
  })()

  const chartConfig = {
    count: { label: "网站数" },
  } satisfies ChartConfig

  if (displayData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>分类分布</CardTitle>
          <CardDescription>各分类已发布网站占比</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="h-[240px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderKanban className="size-5" />
              </EmptyMedia>
              <EmptyTitle>暂无数据</EmptyTitle>
              <EmptyDescription>发布网站后即可查看分类分布</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>分类分布</CardTitle>
        <CardDescription>各分类已发布网站占比</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[200px] min-w-[200px] shrink-0"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="category" hideLabel />}
              />
              <Pie
                data={displayData}
                dataKey="count"
                nameKey="category"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="w-full space-y-2 text-sm">
            {displayData.map((entry, index) => (
              <li key={entry.category} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="truncate">{entry.category}</span>
                <span className="ml-auto shrink-0 font-medium tabular-nums text-muted-foreground">
                  {entry.count}
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground/70">
                  {entry.share}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
