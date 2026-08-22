"use client"

import { useState, useEffect, useRef } from "react"
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Plus, Pencil, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Sparkles } from "lucide-react"
import { CategoryFormDialog } from "@/components/admin/category-form-dialog"
import { CategoryIcon } from "@/components/category-icon"
import { getAllCategories, deleteCategory, updateCategoriesOrder } from "@/lib/actions"
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

export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  // 拖拽排序状态
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // 加载所有分类（为了便于全局拖拽排序，获取全部列表）
  const loadCategories = async () => {
    setLoading(true)
    try {
      const result = await getAllCategories()
      if (result.success && result.data) {
        setCategories(result.data)
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
    loadCategories()
  }, [])

  // 保存排序到数据库
  const persistOrder = async (updatedList: Category[]) => {
    setSavingOrder(true)
    try {
      const orderData = updatedList.map((cat, index) => ({
        id: cat.id,
        order: index,
      }))

      const result = await updateCategoriesOrder(orderData)
      if (result.success) {
        toast({
          title: "排序已保存",
          description: "分类显示顺序已成功同步至数据库与前台导航",
        })
      } else {
        toast({
          variant: "destructive",
          title: "保存排序失败",
          description: result.error || "未能保存新的分类顺序",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "保存排序失败",
        description: "发生错误，请稍后重试",
      })
    } finally {
      setSavingOrder(false)
    }
  }

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  // 拖拽离开
  const handleDragLeave = () => {
    // 保持状态直到 drop 或 dragEnd
  }

  // 放置完成
  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = [...categories]
    const [movedItem] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, movedItem)

    // 重新赋予递增的 order
    const normalized = updated.map((item, idx) => ({ ...item, order: idx }))
    setCategories(normalized)
    setDraggedIndex(null)
    setDragOverIndex(null)

    await persistOrder(normalized)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // 上移/下移快捷按钮
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const updated = [...categories]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    const normalized = updated.map((item, idx) => ({ ...item, order: idx }))
    setCategories(normalized)
    await persistOrder(normalized)
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
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>分类管理</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                按住左侧手柄 <GripVertical className="inline h-3 w-3 align-text-bottom" /> 即可直接拖拽排序，顺序将自动保存并同步至首页导航
              </p>
            </div>
            <CardAction className="flex items-center gap-2">
              {savingOrder && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  正在保存顺序...
                </div>
              )}
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                新增分类
              </Button>
            </CardAction>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无分类，点击「新增分类」添加第一个分类
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">排序</TableHead>
                    <TableHead className="w-14">图标</TableHead>
                    <TableHead>分类名称</TableHead>
                    <TableHead>标识 (Slug)</TableHead>
                    <TableHead>序号</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => {
                    const isDragging = draggedIndex === index
                    const isDragOver = dragOverIndex === index

                    return (
                      <TableRow
                        key={category.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`transition-all select-none ${
                          isDragging
                            ? "opacity-40 bg-muted/70 scale-[0.99]"
                            : isDragOver
                            ? "border-t-2 border-t-primary bg-primary/5"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        {/* 拖拽手柄及上下移动 */}
                        <TableCell className="text-center p-2">
                          <div className="flex items-center justify-center gap-0.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>按住拖拽排序</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={index === 0 || savingOrder}
                                onClick={() => handleMove(index, "up")}
                                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
                                title="上移"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={index === categories.length - 1 || savingOrder}
                                onClick={() => handleMove(index, "down")}
                                className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
                                title="下移"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </TableCell>

                        {/* 分类图标 */}
                        <TableCell>
                          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-primary">
                            <CategoryIcon icon={category.icon} className="h-4 w-4" size={16} />
                          </div>
                        </TableCell>

                        {/* 分类名称 */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{category.name}</span>
                            {category.icon && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                                {category.icon.startsWith("data:") ? "自定义图片" : category.icon}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* 标识 */}
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {category.slug}
                        </TableCell>

                        {/* 排序序号 */}
                        <TableCell>
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                        </TableCell>

                        {/* 操作 */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(category.id)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>编辑分类与图标</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(category.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个分类吗？此操作将同时删除该分类下的所有网站，无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
