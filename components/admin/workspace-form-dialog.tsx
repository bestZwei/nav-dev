"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { resolveActionError } from "@/lib/action-error"
import { createWorkspace, updateWorkspace } from "@/lib/actions"

// 展示项（标题/描述/Logo/Favicon）统一在「系统设置」页按当前工作区上下文编辑，
// 此表单只管理工作区结构信息
export interface WorkspaceFormValues {
  id?: string
  name: string
  slug: string
  description: string
  isPublished: boolean
}

interface WorkspaceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initial?: {
    id: string
    name: string
    slug: string
    description: string | null
    isPublished: boolean
  }
  onSuccess?: () => void
}

const emptyValues: WorkspaceFormValues = {
  name: "",
  slug: "",
  description: "",
  isPublished: false,
}

export function WorkspaceFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSuccess,
}: WorkspaceFormDialogProps) {
  const t = useTranslations("admin.workspaceForm")
  const tAE = useTranslations("actionErrors")
  const [values, setValues] = useState<WorkspaceFormValues>(emptyValues)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initial) {
        setValues({
          id: initial.id,
          name: initial.name,
          slug: initial.slug,
          description: initial.description || "",
          isPublished: initial.isPublished,
        })
      } else {
        setValues(emptyValues)
      }
    }
  }, [open, mode, initial])

  const set = <K extends keyof WorkspaceFormValues>(key: K, v: WorkspaceFormValues[K]) =>
    setValues(prev => ({ ...prev, [key]: v }))

  async function handleSubmit() {
    if (!values.name.trim()) {
      toast.error(t("nameRequired"))
      return
    }
    if (!values.slug.trim()) {
      toast.error(t("slugRequired"))
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        isPublished: values.isPublished,
      }
      const result =
        mode === "edit" && values.id
          ? await updateWorkspace(values.id, payload)
          : await createWorkspace(payload)
      if (result.success) {
        toast.success(mode === "edit" ? t("updateSuccess") : t("createSuccess"))
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(resolveActionError(tAE, result.error, t("saveFailed")))
      }
    } catch {
      toast.error(t("saveFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("formDesc")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ws-name">{t("name")}</Label>
              <Input
                id="ws-name"
                value={values.name}
                onChange={e => set("name", e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ws-slug">{t("slug")}</Label>
              <Input
                id="ws-slug"
                value={values.slug}
                onChange={e => set("slug", e.target.value.toLowerCase())}
                placeholder="zh"
                disabled={mode === "edit"}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ws-desc">{t("description")}</Label>
            <Textarea
              id="ws-desc"
              value={values.description}
              onChange={e => set("description", e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="ws-published">{t("published")}</Label>
              <p className="text-xs text-muted-foreground">{t("publishedDesc")}</p>
            </div>
            <Switch
              id="ws-published"
              checked={values.isPublished}
              onCheckedChange={v => set("isPublished", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "edit" ? t("save") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
