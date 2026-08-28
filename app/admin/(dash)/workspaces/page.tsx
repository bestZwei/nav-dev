"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Globe,
  Star,
  Link2,
  X,
  Info,
} from "lucide-react"
import { WorkspaceFormDialog } from "@/components/admin/workspace-form-dialog"
import {
  getWorkspaces,
  deleteWorkspace,
  setPrimaryWorkspace,
  addWorkspaceDomain,
  removeWorkspaceDomain,
} from "@/lib/actions"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface DomainItem {
  id: string
  host: string
  isPrimary: boolean
  workspaceId: string
}

interface Workspace {
  id: string
  slug: string
  name: string
  description: string | null
  siteName: string | null
  siteDescription: string | null
  siteLogo: string | null
  favicon: string | null
  isDefault: boolean
  isPublished: boolean
  order: number
  domains: DomainItem[]
}

export default function AdminWorkspacesPage() {
  const t = useTranslations("admin.workspaces")
  const tc = useTranslations("common")
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editing, setEditing] = useState<Workspace | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState<Workspace | null>(null)

  // 域名管理：记录正在操作的工作区与输入中的 host
  const [domainInput, setDomainInput] = useState<Record<string, string>>({})
  const [domainBusy, setDomainBusy] = useState<Record<string, boolean>>({})
  const loadRef = useRef(loadWorkspaces)

  async function loadWorkspaces() {
    setLoading(true)
    try {
      const result = await getWorkspaces()
      if (result.success && result.data) {
        setWorkspaces(result.data as Workspace[])
      } else {
        toast.error(tc("loadFailed"), { description: result.error || t("cannotLoad") })
      }
    } catch {
      toast.error(tc("loadFailed"), { description: tc("retryLater") })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRef.current = loadWorkspaces
  })
  useEffect(() => {
    loadRef.current()
  }, [])

  async function handleSetPrimary(ws: Workspace) {
    const result = await setPrimaryWorkspace(ws.id)
    if (result.success) {
      toast.success(t("primarySet", { name: ws.name }))
      loadRef.current()
    } else {
      toast.error(result.error || t("actionFailed"))
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const result = await deleteWorkspace(deleting.id)
    if (result.success) {
      toast.success(t("deleteSuccess"))
      loadRef.current()
    } else {
      toast.error(result.error || t("actionFailed"))
    }
    setDeleteOpen(false)
    setDeleting(null)
  }

  async function handleAddDomain(ws: Workspace) {
    const raw = (domainInput[ws.id] || "").trim()
    if (!raw) return
    setDomainBusy(prev => ({ ...prev, [ws.id]: true }))
    try {
      const result = await addWorkspaceDomain(ws.id, raw)
      if (result.success) {
        setDomainInput(prev => ({ ...prev, [ws.id]: "" }))
        toast.success(t("domainAdded", { host: raw }))
        loadRef.current()
      } else {
        toast.error(result.error || t("actionFailed"))
      }
    } finally {
      setDomainBusy(prev => ({ ...prev, [ws.id]: false }))
    }
  }

  async function handleRemoveDomain(domain: DomainItem) {
    const result = await removeWorkspaceDomain(domain.id)
    if (result.success) {
      toast.success(t("domainRemoved"))
      loadRef.current()
    } else {
      toast.error(result.error || t("actionFailed"))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            {t("title")}
            <span className="ml-auto">
              <Button
                onClick={() => {
                  setFormMode("create")
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("create")}
              </Button>
            </span>
          </CardTitle>
          <CardDescription className="flex items-start gap-1.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t("desc")}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed text-center">
              <p className="text-sm font-semibold">{t("emptyTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("emptyDesc")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workspaces.map(ws => (
                <div key={ws.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{ws.name}</span>
                        <Badge variant="outline" className="font-mono text-xs">{ws.slug}</Badge>
                        {ws.isDefault && (
                          <Badge className="gap-1">
                            <Star className="h-3 w-3" />
                            {t("default")}
                          </Badge>
                        )}
                        <Badge variant={ws.isPublished ? "secondary" : "destructive"}>
                          {ws.isPublished ? t("published") : t("unpublished")}
                        </Badge>
                      </div>
                      {ws.description && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">{ws.description}</p>
                      )}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      {!ws.isDefault && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleSetPrimary(ws)}>
                                <Star className="mr-1 h-3.5 w-3.5" />
                                {t("setPrimary")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("setPrimaryTip")}</TooltipContent>
                          </Tooltip>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormMode("edit")
                              setEditing(ws)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            {tc("edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeleting(ws)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 域名绑定 */}
                  <div className="mt-3 rounded-lg bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t("domains")}</span>
                      {ws.domains.length === 0 && (
                        <span className="text-xs text-muted-foreground">{t("noDomains")}</span>
                      )}
                      {ws.domains.map(d => (
                        <Badge key={d.id} variant="secondary" className="gap-1 font-mono">
                          {d.host}
                          <button
                            className="ml-0.5 rounded-full hover:text-destructive"
                            onClick={() => handleRemoveDomain(d)}
                            aria-label={t("removeDomain")}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <span className="ml-auto flex items-center gap-2">
                        <Input
                          className="h-8 w-56 font-mono text-xs"
                          placeholder="zh.example.com"
                          value={domainInput[ws.id] || ""}
                          onChange={e =>
                            setDomainInput(prev => ({ ...prev, [ws.id]: e.target.value }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") handleAddDomain(ws)
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={domainBusy[ws.id] || !(domainInput[ws.id] || "").trim()}
                          onClick={() => handleAddDomain(ws)}
                        >
                          {domainBusy[ws.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          {t("addDomain")}
                        </Button>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkspaceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initial={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                slug: editing.slug,
                description: editing.description,
                isPublished: editing.isPublished,
              }
            : undefined
        }
        onSuccess={() => loadRef.current()}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDesc", { name: deleting?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {tc("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
