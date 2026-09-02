"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CategoryIconPicker } from "@/components/admin/category-icon-picker"
import { createCategory, updateCategory, getCategoryById } from "@/lib/actions"
import { useTranslations } from "next-intl"
import { resolveActionError } from "@/lib/action-error"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  order: number
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId?: string | null
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function CategoryFormDialog({ open, onOpenChange, categoryId, mode, onSuccess }: CategoryFormDialogProps) {
  const router = useRouter()
  const t = useTranslations("admin.categoryForm")
  const tc = useTranslations("common")
  const tAE = useTranslations("actionErrors")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    slug: string
    icon: string | null
    order: number
  }>({
    name: "",
    slug: "",
    icon: null,
    order: 0,
  })

  // 编辑模式：加载分类数据
  useEffect(() => {
    async function loadCategory() {
      if (mode === "edit" && categoryId) {
        const result = await getCategoryById(categoryId)
        if (result.success && result.data) {
          setFormData({
            name: result.data.name,
            slug: result.data.slug,
            icon: (result.data as any).icon || null,
            order: result.data.order,
          })
        }
      } else if (mode === "create") {
        setFormData({ name: "", slug: "", icon: null, order: 0 })
      }
    }
    loadCategory()
  }, [categoryId, mode, open])

  // 根据名称自动生成 slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
  }

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: mode === "create" ? generateSlug(value) : formData.slug,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = mode === "create"
        ? await createCategory(formData)
        : await updateCategory(categoryId!, formData)

      if (result.success) {
        toast.success(mode === "create" ? t("createSuccess") : t("updateSuccess"), {
          description: mode === "create"
            ? t("createSuccessDesc", { name: formData.name })
            : t("updateSuccessDesc", { name: formData.name }),
        })
        onOpenChange(false)
        onSuccess?.()
        router.refresh()
      } else {
        toast.error(tc("operationFailed"), {
          description: resolveActionError(tAE, result.error, tc("operationFailed")),
        })
      }
    } catch (error) {
      toast.error(tc("operationFailed"), {
        description: tc("retryLater"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("createTitle") : t("editTitle")}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("createDesc") : t("editDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>{t("iconLabel")}</Label>
              <CategoryIconPicker
                value={formData.icon}
                onChange={(icon) => setFormData({ ...formData, icon })}
              />
              <p className="text-xs text-muted-foreground">
                {t("iconHint")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">{t("slugLabel")}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="tech"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("slugHint")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="order">{t("orderLabel")}</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                {t("orderHint")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? t("createBtn") : t("saveBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
