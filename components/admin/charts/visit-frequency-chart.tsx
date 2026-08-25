"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { useMemo } from "react"

interface VisitFrequencyChartProps {
  data: Array<{
    date: string
    count: number
  }>
  timeRange: number
  onTimeRangeChange: (days: 0 | 7 | 30 | 90) => void
}

export function VisitFrequencyChart({ data, timeRange, onTimeRangeChange }: VisitFrequencyChartProps) {
  const t = useTranslations("admin.chart")

  // 填充缺失的日期数据
  const displayData = useMemo(() => {
    if (timeRange === 0) {
      // 全部数据模式，不填充
      return data
    }

    // 计算日期范围
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - timeRange + 1)

    // 创建日期映射
    const dateMap = new Map<string, number>()
    data.forEach(item => {
      const dateKey = item.date.split('T')[0] // YYYY-MM-DD
      dateMap.set(dateKey, item.count)
    })

    // 填充所有日期
    const filledData: Array<{ date: string; count: number }> = []
    for (let i = 0; i < timeRange; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      filledData.push({
        date: dateKey,
        count: dateMap.get(dateKey) || 0
      })
    }

    return filledData
  }, [data, timeRange])

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return month + "/" + day
  }

  // 格式化完整日期
  const formatFullDate = (dateStr: any) => {
    if (!dateStr) return ''
    const date = new Date(String(dateStr))
    if (isNaN(date.getTime())) return String(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDay = t(`weekDay${date.getDay()}` as never)
    return t("fullDate", { year, month, day, weekday: weekDay })
  }

  // 计算总访问量
  const totalVisits = data.reduce((sum, item) => sum + item.count, 0)

  // 计算合理的 Y 轴最大值
  const maxCount = Math.max(...displayData.map(d => d.count), 0)
  const yAxisMax = maxCount > 0 ? Math.ceil(maxCount * 1.2) : 10 // 留20%空间，最小为10

  // 获取时间范围标签
  const getTimeRangeLabel = () => {
    if (timeRange === 0) return t("rangeAll")
    if (timeRange === 90) return t("range3months")
    if (timeRange === 30) return t("range30days")
    return t("rangeDays", { days: timeRange })
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t("frequencyTitle")}
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {getTimeRangeLabel()} · {t('visitsTotal', { count: totalVisits.toLocaleString() })}
          </span>
          <span className="@[540px]/card:hidden">
            {getTimeRangeLabel()}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange.toString()}
            onValueChange={(value) => value && onTimeRangeChange(Number(value) as 0 | 7 | 30 | 90)}
            variant="outline"
            className="hidden md:flex"
          >
            <ToggleGroupItem value="7" className="rounded-r-none">Last 7 days</ToggleGroupItem>
            <ToggleGroupItem value="30" className="rounded-none border-l-0">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="90" className="rounded-none border-l-0">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="0" className="rounded-l-none border-l-0">All</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange.toString()}
            onValueChange={(value) => onTimeRangeChange(Number(value) as 0 | 7 | 30 | 90)}
          >
            <SelectTrigger
              className="flex w-32 md:hidden"
              aria-label={t("selectRangeLabel")}
            >
              <SelectValue placeholder={t("selectRangeLabel")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7" className="rounded-lg">Last 7 days</SelectItem>
              <SelectItem value="30" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="90" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="0" className="rounded-lg">All</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {displayData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, yAxisMax]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  if (value >= 1000) return (value / 1000).toFixed(1) + "k"
                  return value.toString()
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(label) => formatFullDate(label)}
                formatter={(value: any) => [
                  t("visitCountWithUnit", { count: value ?? 0 }),
                  t("visitsLabel"),
                ]}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty className="h-[300px]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TrendingUp className="size-5" />
              </EmptyMedia>
              <EmptyTitle>{t("noData")}</EmptyTitle>
              <EmptyDescription>
                {t("noVisits")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
