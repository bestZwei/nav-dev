"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { changePassword } from "@/lib/actions"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { resolveActionError } from "@/lib/action-error"

interface PasswordChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
}

export function PasswordChangeDialog({
  open,
  onOpenChange,
  userEmail,
}: PasswordChangeDialogProps) {
  const t = useTranslations("admin.profile")
  const tc = useTranslations("common")
  const tAE = useTranslations("actionErrors")
  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error(t("passwordTooShort"), {
        description: t("passwordTooShortDesc"),
      })
      return
    }

    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"), {
        description: t("passwordMismatchDesc"),
      })
      return
    }

    if (!currentPassword) {
      toast.error(t("currentPasswordRequired"), {
        description: t("currentPasswordRequiredDesc"),
      })
      return
    }

    setLoading(true)
    try {
      // 以当前会话身份为准，服务端强制校验旧密码
      const result = await changePassword(currentPassword, password)
      if (result.success) {
        toast.success(t("passwordChanged"), {
          description: t("passwordChangedDesc"),
        })
        onOpenChange(false)
        setCurrentPassword("")
        setPassword("")
        setConfirmPassword("")
      } else {
        toast.error(t("changeFailed"), {
          description: resolveActionError(tAE, result.error, t("changeFailedDesc")),
        })
      }
    } catch (error) {
      toast.error(t("changeFailed"), {
        description: tc("retryLater"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <DialogHeader>
            <DialogTitle>{t("changePasswordTitle")}</DialogTitle>
            <DialogDescription>
              {t("changePasswordDesc", { email: userEmail })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("currentPasswordLabel")}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("currentPasswordPlaceholder")}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("newPasswordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("confirmPasswordLabel")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                required
                minLength={6}
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
            <Button type="submit" disabled={loading} className="transition-all duration-200 active:scale-[0.97]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirmChange")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
