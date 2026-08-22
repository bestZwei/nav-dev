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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react"
import { CategoryFormDialog } from "@/components/admin/category-form-dialog"
import { CategoryIcon } from "@/components/category-icon"
import { getCategoriesWithPagination, deleteCategory, updateCategoriesOrder } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  order: number
  _count?: {
    sites: number
  }
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  // 分页状态
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)

  // 加载分类列表
  const loadCategories = async (currentPage = page) => {
    setLoading(true)
    try {
      const result = await getCategoriesWithPagination({ page: currentPage, pageSize: 20 })
      if (result.success && result.data) {
        // Sort by order ascending
        const sorted = [...result.data].sort((a, b) => a.order - b.order)
        setCategories(sorted)
        setPagination(result.pagination || null)
        setPage(result.pagination?.page || 1)
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: result.error || "无法加载分类列表",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories(1)
  }, [])

  // 保存排序到数据库
  const persistOrder = async (updatedList: Category[]) => {
    setIsSavingOrder(true)
    try {
      const orderPayload = updatedList.map((cat, idx) => ({
        id: cat.id,
        order: idx + 1,
      }))
      const result = await updateCategoriesOrder(orderPayload)
      if (result.success) {
        toast({
          title: "排序已保存",
          description: "分类顺序已成功更新并同步至前台",
        })
      } else {
        toast({
          variant: "destructive",
          title: "排序保存失败",
          description: result.error || "无法保存排序",
        })
        loadCategories(page)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "排序保存失败",
        description: "网络错误，请稍后重试",
      })
      loadCategories(page)
    } finally {
      setIsSavingOrder(false)
    }
  }

  // 拖拽排序逻辑
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const updated = [...categories]
      const [movedItem] = updated.splice(draggedIndex, 1)
      updated.splice(dragOverIndex, 0, movedItem)

      // Re-assign order numbers
      const withNewOrders = updated.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }))
      setCategories(withNewOrders)
      persistOrder(withNewOrders)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 上移/下移
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const updated = [...categories]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    const withNewOrders = updated.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }))
    setCategories(withNewOrders)
    persistOrder(withNewOrders)
  }

  // 打开创建对话框
  const handleCreate = () => {
    setDialogMode("create")
    setEditingCategoryId(null)
    setDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (categoryId: string) => {
    setDialogMode("edit")
    setEditingCategoryId(categoryId)
    setDialogOpen(true)
  }

  // 页面切换处理
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination && newPage > pagination.totalPages)) return
    loadCategories(newPage)
  }

  // 打开删除确认对话框
  const handleDeleteClick = (categoryId: string) => {
    setDeletingCategoryId(categoryId)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!deletingCategoryId) return

    try {
      const result = await deleteCategory(deletingCategoryId)
      if (result.success) {
        toast({
          title: "删除成功",
          description: "分类已删除",
        })
        loadCategories()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.error || "删除失败，请稍后重试",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeletingCategoryId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 提示信息栏 */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            <strong>拖拽排序提示：</strong> 按住分类左侧的「拖拽手柄 ⠿」上下拖拽即可调整分类在首页导航中的显示顺序。
          </span>
        </div>
        {isSavingOrder && (
          <div className="flex items-center gap-1.5 text-primary font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>保存排序中...</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">分类管理</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                管理分类图标、自定义排序与网址归属，调整前台导航展示结构
              </p>
            </div>
            <CardAction>
              <Button onClick={handleCreate} className="gap-1.5">
                <Plus className="h-4 w-4" />
                新增分类
              </Button>
            </CardAction>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <p>暂无分类，点击「新增分类」添加第一个分类</p>
              <Button variant="outline" size="sm" onClick={handleCreate}>
                <Plus className="mr-1.5 h-4 w-4" /> 新增分类
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">排序</TableHead>
                    <TableHead className="w-[180px]">分类图标 & 名称</TableHead>
                    <TableHead>标识 (Slug)</TableHead>
                    <TableHead className="w-[100px] text-center">网站数</TableHead>
                    <TableHead className="w-[120px] text-center">位置调整</TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => {
                    const isDragging = draggedIndex === index
                    const isOver = dragOverIndex === index

                    return (
                      <TableRow
                        key={category.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`transition-all ${
                          isDragging ? "opacity-40 bg-muted/70 cursor-grabbing" : ""
                        } ${
                          isOver && !isDragging ? "border-t-2 border-primary bg-primary/5" : ""
                        }`}
                      >
                        {/* 拖拽手柄 & 序号 */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                              title="按住拖拽调整顺序"
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {category.order}
                            </span>
                          </div>
                        </TableCell>

                        {/* 图标与名称 */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {category.icon && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                                <CategoryIcon icon={category.icon} className="h-4 w-4" size={18} />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-sm flex items-center gap-1.5">
                                {category.name}
                              </div>
                              {category.icon ? (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px] block">
                                  图标: {category.icon.startsWith("data:") ? "自定义图片" : category.icon}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/60">
                                  未设置图标
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Slug */}
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-normal">
                            {category.slug}
                          </Badge>
                        </TableCell>

                        {/* 网站数 */}
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {category._count?.sites || 0}
                          </Badge>
                        </TableCell>

                        {/* 快捷上移/下移按钮 */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMove(index, "up")}
                                    disabled={index === 0 || isSavingOrder}
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>上移一位</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMove(index, "down")}
                                    disabled={index === categories.length - 1 || isSavingOrder}
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>下移一位</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>

                        {/* 操作按钮 */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(category.id)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>编辑分类</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteClick(category.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>删除分类</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categoryId={editingCategoryId}
        mode={dialogMode}
        onSuccess={() => loadCategories()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个分类吗？此操作将同时删除该分类下的所有网站，无法撤销。
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
