"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Pencil, Trash2, Power, Loader2, RotateCcw, Pin, PinOff, ExternalLink } from "lucide-react"
import { SiteFormDialog } from "@/components/admin/site-form-dialog"
import { getSitesWithPagination, deleteSite, toggleSitePublish, toggleSitePin, getCategoriesForFilter } from "@/lib/actions"
import { toast } from "sonner"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  submitterContact: string | null
  submitterIp: string | null
  categoryId: string
  isPublished: boolean
  isPinned?: boolean
  order: number
  category?: {
    id: string
    name: string
  } | null
  createdAt: Date
  updatedAt: Date
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function AdminSitesPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null)

  // 筛选状态
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPinned, setFilterPinned] = useState<string>("all")
  const [filterSubmitter, setFilterSubmitter] = useState<string>("all")

  // 分页状态
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  // 加载网站列表
  const loadSites = async (currentPage = page) => {
    setLoading(true)
    try {
      const result = await getSitesWithPagination({
        page: currentPage,
        pageSize: 10,
        categoryId: filterCategory !== "all" ? filterCategory : undefined,
        isPublished: filterStatus !== "all" ? (filterStatus === "true") : undefined,
        isPinned: filterPinned !== "all" ? (filterPinned === "true") : undefined,
        submitterIp: filterSubmitter !== "all" ? filterSubmitter : undefined,
      })
      if (result.success && result.data) {
        setSites(result.data)
        setPagination(result.pagination || null)
        setPage(result.pagination?.page || 1)
      } else {
        toast.error("加载失败", {
          description: result.error || "无法加载网站列表",
        })
      }
    } catch (error) {
      toast.error("加载失败", {
        description: "发生错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const result = await getCategoriesForFilter()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  useEffect(() => {
    loadSites(1)
    loadCategories()
  }, [])

  // 重置筛选
  const handleResetFilters = () => {
    setFilterCategory("all")
    setFilterStatus("all")
    setFilterPinned("all")
    setFilterSubmitter("all")
    setPage(1)
  }

  // 筛选条件改变时重新加载
  useEffect(() => {
    loadSites(1)
  }, [filterCategory, filterStatus, filterPinned, filterSubmitter])

  // 打开创建对话框
  const handleCreate = () => {
    setDialogMode("create")
    setEditingSite(null)
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (site: Site) => {
    setDialogMode("edit")
    setEditingSite(site)
    setDialogOpen(true)
  }

  // 页面切换处理
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return
    loadSites(newPage)
  }

  // 打开删除确认对话框
  const handleDeleteClick = (siteId: string) => {
    setDeletingSiteId(siteId)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!deletingSiteId) return

    try {
      const result = await deleteSite(deletingSiteId)
      if (result.success) {
        toast.success("删除成功", {
          description: "网站已删除",
        })
        loadSites()
      } else {
        toast.error("删除失败", {
          description: result.error || "删除失败，请稍后重试",
        })
      }
    } catch (error) {
      toast.error("删除失败", {
        description: "发生错误，请稍后重试",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingSiteId(null)
    }
  }

  // 切换发布状态
  const handleTogglePublish = async (siteId: string) => {
    try {
      const result = await toggleSitePublish(siteId)
      if (result.success) {
        toast.success("状态已更新", {
          description: "网站发布状态已切换",
        })
        loadSites()
      } else {
        toast.error("操作失败", {
          description: result.error || "操作失败，请稍后重试",
        })
      }
    } catch (error) {
      toast.error("操作失败", {
        description: "发生错误，请稍后重试",
      })
    }
  }

  // 切换置顶状态
  const handleTogglePin = async (siteId: string, currentPin?: boolean) => {
    try {
      const result = await toggleSitePin(siteId)
      if (result.success) {
        toast.success(currentPin ? "已取消置顶" : "已设为置顶", {
          description: currentPin ? "该网站将按常规顺序展示" : "该网站将在前台分类中优先推荐展示",
        })
        loadSites()
      } else {
        toast.error("操作失败", {
          description: result.error || "切换置顶状态失败",
        })
      }
    } catch (error) {
      toast.error("操作失败", {
        description: "发生错误，请稍后重试",
      })
    }
  }

  return (
    <div className="space-y-4 p-6">
      {/* 筛选器工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 分类筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>分类</FieldLabel>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* 置顶筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>置顶</FieldLabel>
            <Select value={filterPinned} onValueChange={setFilterPinned}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部置顶" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="true">仅置顶</SelectItem>
                <SelectItem value="false">未置顶</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* 状态筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>状态</FieldLabel>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="true">已发布</SelectItem>
                <SelectItem value="false">草稿</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* 提交者筛选 */}
          <Field orientation="horizontal" className="w-auto">
            <FieldLabel>来源</FieldLabel>
            <Select value={filterSubmitter} onValueChange={setFilterSubmitter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="全部来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="true">用户提交</SelectItem>
                <SelectItem value="false">管理员创建</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* 重置按钮 */}
          {(filterCategory !== "all" || filterStatus !== "all" || filterPinned !== "all" || filterSubmitter !== "all") && (
                          <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetFilters}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="sr-only">重置筛选</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>重置筛选</p>
                </TooltipContent>
                          </Tooltip>
          )}
        </div>

        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新增网站
        </Button>
      </div>

      {/* 网站列表卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>收录你的宝藏网站</CardTitle>
            <span className="text-xs text-muted-foreground">
              共 {pagination?.total || 0} 个网站
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无符合条件的网站
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20 min-w-[72px] text-center whitespace-nowrap">图标</TableHead>
                    <TableHead className="min-w-[180px] whitespace-nowrap">名称 & 描述</TableHead>
                    <TableHead className="w-36 whitespace-nowrap">分类</TableHead>
                    <TableHead className="w-24 text-center whitespace-nowrap">置顶推荐</TableHead>
                    <TableHead className="w-24 text-center whitespace-nowrap">状态</TableHead>
                    <TableHead className="w-28 text-center whitespace-nowrap">来源</TableHead>
                    <TableHead className="text-right w-36 whitespace-nowrap">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sites.map((site) => (
                    <TableRow key={site.id} className={site.isPinned ? "bg-amber-500/5" : ""}>
                      {/* 图标 */}
                      <TableCell className="text-center w-20 min-w-[72px]">
                        <div className="flex items-center justify-center">
                          {site.iconUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={site.iconUrl}
                              alt={site.name}
                              className="h-8 w-8 rounded-md object-contain border bg-background p-0.5"
                              onError={(e) => {
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E"
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {site.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 名称 & 描述 & URL */}
                      <TableCell>
                        <div className="space-y-1 max-w-[280px]">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{site.name}</span>
                            {site.isPinned && (
                              <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                                <Pin className="h-2.5 w-2.5 fill-current" />
                                置顶
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {site.description || "暂无描述"}
                          </p>
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                          >
                            <span className="truncate max-w-[200px]">{site.url}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                          </a>
                        </div>
                      </TableCell>

                      {/* 分类 */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {site.category?.name || "未分类"}
                        </Badge>
                      </TableCell>

                      {/* 置顶切换开关 */}
                      <TableCell className="text-center">
                                                  <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={site.isPinned ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleTogglePin(site.id, site.isPinned)}
                                className={`h-7 px-2 text-xs gap-1 transition-all ${
                                  site.isPinned
                                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                                    : "text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                                }`}
                              >
                                <Pin className={`h-3.5 w-3.5 ${site.isPinned ? "fill-current" : ""}`} />
                                <span>{site.isPinned ? "已置顶" : "置顶"}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{site.isPinned ? "点击取消置顶" : "点击置顶该网站"}</p>
                            </TooltipContent>
                                                  </Tooltip>
                      </TableCell>

                      {/* 状态 */}
                      <TableCell className="text-center">
                        {site.isPublished ? (
                          <Badge variant="default" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
                            已发布
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            草稿
                          </Badge>
                        )}
                      </TableCell>

                      {/* 提交来源 */}
                      <TableCell className="text-center text-muted-foreground">
                        {site.submitterIp ? (
                          <span className="text-xs font-mono text-muted-foreground">用户提交</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">管理员</span>
                        )}
                      </TableCell>

                      {/* 操作 */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                                                      <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleTogglePublish(site.id)}
                                >
                                  <Power className={`h-4 w-4 ${site.isPublished ? "text-emerald-600" : "text-muted-foreground"}`} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{site.isPublished ? "取消发布" : "立即发布"}</p>
                              </TooltipContent>
                                                      </Tooltip>

                                                      <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(site)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>编辑网站</p>
                              </TooltipContent>
                                                      </Tooltip>

                                                      <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteClick(site.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>删除网站</p>
                              </TooltipContent>
                                                      </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页组件 */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(page - 1)}
                className={
                  page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (pageNum) =>
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
              )
              .map((pageNum, idx, arr) => {
                const prevPage = arr[idx - 1]
                const showEllipsis = prevPage && pageNum - prevPage > 1

                return (
                  <div key={pageNum} className="flex items-center">
                    {showEllipsis && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={pageNum === page}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  </div>
                )
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(page + 1)}
                className={
                  page === pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <SiteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={editingSite}
        mode={dialogMode}
        onSuccess={() => loadSites()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除网站</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个网站吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
