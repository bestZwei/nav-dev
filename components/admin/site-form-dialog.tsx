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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createSite, updateSite, getAllCategories } from "@/lib/actions"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  categoryId: string
  isPublished: boolean
  isPinned?: boolean
}

interface Category {
  id: string
  name: string
}

interface SiteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site | null
  mode: "create" | "edit"
  onSuccess?: () => void
}

export function SiteFormDialog({ open, onOpenChange, site, mode, onSuccess }: SiteFormDialogProps) {
  const router = useRouter()
  const t = useTranslations("admin.siteForm")
  const tc = useTranslations("common")
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    iconUrl: "",
    categoryId: "",
    isPublished: false,
    isPinned: false,
  })

  // 加载分类列表
  useEffect(() => {
    async function loadCategories() {
      const result = await getAllCategories()
      if (result.success && result.data) {
        setCategories(result.data)
        if (result.data.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: result.data[0].id }))
        }
      }
    }
    loadCategories()
  }, [])

  // 编辑模式：填充表单数据
  useEffect(() => {
    if (mode === "edit" && site) {
      setFormData({
        name: site.name,
        url: site.url,
        description: site.description,
        iconUrl: site.iconUrl || "",
        categoryId: site.categoryId,
        isPublished: site.isPublished,
        isPinned: site.isPinned ?? false,
      })
    } else if (mode === "create") {
      setFormData({
        name: "",
        url: "",
        description: "",
        iconUrl: "",
        categoryId: "",
        isPublished: false,
        isPinned: false,
      })
    }
  }, [site, mode, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = mode === "create"
        ? await createSite(formData)
        : await updateSite(site!.id, formData)

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
          description: result.error || tc("operationFailed"),
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
      <DialogContent className="sm:max-w-[500px]">
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">{t("urlLabel")}</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">{t("categoryLabel")}</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t("descLabel")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("descPlaceholder")}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="iconUrl">{t("iconLabel")}</Label>
              <Input
                id="iconUrl"
                type="url"
                value={formData.iconUrl}
                onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="pinned" className="font-medium">{t("pinnedLabel")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("pinnedDesc")}
                </p>
              </div>
              <Switch
                id="pinned"
                checked={formData.isPinned}
                onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="published">{t("publishedLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("publishedDesc")}
                </p>
              </div>
              <Switch
                id="published"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
              />
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
