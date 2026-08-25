"use client"

import { useState, useEffect } from "react"
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
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { updateUser } from "@/lib/actions"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "next-intl"

interface UpdatedUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
}

interface UserEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userEmail: string
  userName?: string | null
  onUpdate?: (user: UpdatedUser) => void
}

export function UserEditDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
  onUpdate,
}: UserEditDialogProps) {
  const t = useTranslations("admin.profile")
  const tc = useTranslations("common")
  const [name, setName] = useState(userName || "")
  const [email, setEmail] = useState(userEmail)
  const [avatar, setAvatar] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(userName || "")
    setEmail(userEmail)
    setAvatar("")
    setPassword("")
    setConfirmPassword("")
  }, [userName, userEmail, open])

  // 生成用户名首字母作为 fallback
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email
        .split("@")[0]
        .slice(0, 2)
        .toUpperCase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error(t("emailInvalid"), {
        description: t("emailInvalidDesc"),
      })
      return
    }

    // 如果填写了密码，验证密码
    if (password && password.length < 6) {
      toast.error(t("passwordTooShort"), {
        description: t("passwordTooShortDesc"),
      })
      return
    }

    if (password && password !== confirmPassword) {
      toast.error(t("passwordMismatch"), {
        description: t("passwordMismatchDesc"),
      })
      return
    }

    setLoading(true)
    try {
      const updateData: {
        email?: string
        name?: string
        password?: string
        avatar?: string
      } = {}

      if (email !== userEmail) {
        updateData.email = email
      }

      if (name !== userName) {
        updateData.name = name || undefined
      }

      if (password) {
        updateData.password = password
      }

      if (avatar) {
        updateData.avatar = avatar
      }

      // 如果没有任何更改，直接关闭
      if (Object.keys(updateData).length === 0) {
        onOpenChange(false)
        setLoading(false)
        return
      }

      const result = await updateUser(userId, updateData)
      if (result.success) {
        toast.success(t("updateSuccess"), {
          description: t("updateSuccessDesc"),
        })
        // 更新缓存中的用户信息
        if (onUpdate && result.data) {
          onUpdate(result.data)
        }
        onOpenChange(false)
      } else {
        toast.error(t("updateFailed"), {
          description: result.error || t("updateFailedDesc"),
        })
      }
    } catch (error) {
      toast.error(t("updateFailed"), {
        description: tc("retryLater"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>
              {t("editDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* 头像预览和输入 */}
            <div className="space-y-2">
              <Label htmlFor="avatar">{t("avatarLabel")}</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatar || undefined} alt={t("avatarPreviewAlt")} />
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Input
                    id="avatar"
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder={t("avatarPlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("avatarHint")}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                minLength={password ? 6 : undefined}
              />
            </div>
            {password && (
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
            )}
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
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
