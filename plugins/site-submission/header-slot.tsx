"use client"

import { useState, useMemo, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { submitSite, getSubmissionCategories } from "./actions"
import type { SubmitSiteErrorCode } from "./constants"

interface SubmissionCategory {
  id: string
  name: string
  slug: string
}

// site-submission 插件的前台 header 注入：收录按钮 + 投稿弹窗。
// 分类列表在弹窗打开时按需拉取（当前工作区），组件自治、核心零 props 依赖
export function SiteSubmissionHeaderSlot() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<SubmissionCategory[]>([])
  const t = useTranslations("plugins.siteSubmission")

  // 校验消息跟随当前语言，schema 在组件内按语言重建
  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("nameRequired")).max(50, t("nameMax")),
        url: z.string().min(1, t("urlRequired")).url(t("urlInvalid")),
        description: z
          .string()
          .min(1, t("descRequired"))
          .max(200, t("descMax")),
        categoryId: z.string().min(1, t("categoryRequired")),
        submitterContact: z
          .string()
          .max(100, t("contactMax"))
          .optional(),
      }),
    [t]
  )

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
      categoryId: "",
      submitterContact: "",
    },
  })

  // 浏览器扩展深链：?__ext_submit=1&ext_url=&ext_title=&ext_desc=
  // 预填投稿弹窗并自动展开，随后清理地址栏避免刷新重复触发
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("__ext_submit") !== "1") return
    const extUrl = params.get("ext_url") || ""
    try {
      const parsed = new URL(extUrl)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return
    } catch {
      return
    }
    setOpen(true)
    form.reset({
      name: (params.get("ext_title") || "").slice(0, 50),
      url: extUrl,
      description: (params.get("ext_desc") || "").slice(0, 200),
      categoryId: "",
      submitterContact: "",
    })
    if (categories.length === 0) {
      getSubmissionCategories().then(setCategories)
    }
    for (const key of ["__ext_submit", "ext_url", "ext_title", "ext_desc"]) {
      params.delete(key)
    }
    const qs = params.toString()
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && categories.length === 0) {
      setCategories(await getSubmissionCategories())
    }
  }

  function resolveError(code: SubmitSiteErrorCode, maxPerDay?: number): string {
    if (code === "RATE_LIMITED") {
      return t(`errors.${code}`, { count: maxPerDay ?? 3 })
    }
    return t(`errors.${code}`)
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const result = await submitSite({
        ...values,
      })

      if (result.success) {
        toast.success(t("success"))
        form.reset()
        setOpen(false)
      } else {
        toast.error(resolveError(result.code, "maxPerDay" in result ? result.maxPerDay : undefined))
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(t("retry"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="relative transition-all duration-200 active:scale-95 group hover:bg-accent">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-archive h-[1.2rem] w-[1.2rem] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105"
                >
                  <rect width="20" height="5" x="2" y="3" rx="1"></rect>
                  <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
                  <path d="M10 12h4"></path>
                </svg>
                <span className="sr-only">{t("trigger")}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("trigger")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-fade-in">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("urlLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("descLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("descPlaceholder")}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t("charCount", { count: field.value.length })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("categoryLabel")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("categoryPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="submitterContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("contactPlaceholder")} {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {t("contactHint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="transition-all duration-200 active:scale-[0.97]">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("submit")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
