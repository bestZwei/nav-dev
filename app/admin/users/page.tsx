"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, Info, Zap, Link2, PanelBottom } from "lucide-react"
import { getSystemSettings, updateSystemSettings } from "@/lib/actions"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SystemSettingsData {
  id: string
  siteName: string
  siteDescription: string
  siteLogo: string | undefined
  favicon: string | undefined
  pageSize: number
  showFooter: boolean
  footerCopyright: string
  footerLinks: Array<{ name: string; url: string }>
  showAdminLink: boolean
  enableVisitTracking: boolean
  enableSubmission: boolean
  submissionMaxPerDay: number
  githubUrl: string | undefined
  showIcp: boolean
  icpNumber: string | undefined
  icpLink: string | undefined
  defaultLanguage: "zh" | "en"
}

const sections = [
  { id: "basic", titleKey: "secBasic", icon: Info },
  { id: "features", titleKey: "secFeatures", icon: Zap },
  { id: "links", titleKey: "secLinks", icon: Link2 },
  { id: "footer", titleKey: "secFooter", icon: PanelBottom },
] as const

type SectionId = (typeof sections)[number]["id"]

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings")
  const tc = useTranslations("common")
  const [settings, setSettings] = useState<SystemSettingsData>({
    id: "",
    siteName: "Conan Nav",
    siteDescription: "简洁现代化的网址导航系统",
    siteLogo: undefined,
    favicon: undefined,
    pageSize: 20,
    showFooter: true,
    footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
    footerLinks: [],
    showAdminLink: true,
    enableVisitTracking: true,
    enableSubmission: true,
    submissionMaxPerDay: 3,
    githubUrl: undefined,
    showIcp: false,
    icpNumber: undefined,
    icpLink: undefined,
    defaultLanguage: "zh",
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("basic")

  // 加载数据
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await getSystemSettings()
    if (result.success && result.data) {
      setSettings({
        ...result.data,
        siteLogo: result.data.siteLogo || undefined,
        favicon: result.data.favicon || undefined,
        footerLinks: (result.data.footerLinks as Array<{ name: string; url: string }>) || [],
        githubUrl: result.data.githubUrl || undefined,
        showIcp: result.data.showIcp || false,
        icpNumber: result.data.icpNumber || undefined,
        icpLink: result.data.icpLink || undefined,
        enableSubmission: result.data.enableSubmission ?? true,
        submissionMaxPerDay: result.data.submissionMaxPerDay ?? 3,
        defaultLanguage: result.data.defaultLanguage === "en" ? "en" : "zh",
      })
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const result = await updateSystemSettings(settings)
      if (result.success) {
        toast.success(t("saveSuccess"), {
          description: t("saveSuccessDesc"),
        })
        setTimeout(() => window.location.reload(), 500)
      } else {
        toast.error(t("saveFailed"), {
          description: result.error || t("saveFailedDesc"),
        })
      }
    } catch (error) {
      toast.error(t("saveFailed"), {
        description: tc("retryLater"),
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const addFooterLink = () => {
    setSettings({
      ...settings,
      footerLinks: [...settings.footerLinks, { name: "", url: "" }],
    })
  }

  const removeFooterLink = (index: number) => {
    const newLinks = settings.footerLinks.filter((_, i) => i !== index)
    setSettings({ ...settings, footerLinks: newLinks })
  }

  const updateFooterLink = (index: number, field: "name" | "url", value: string) => {
    const newLinks = [...settings.footerLinks]
    newLinks[index][field] = value
    setSettings({ ...settings, footerLinks: newLinks })
  }

  const sectionMeta: Record<SectionId, { title: string; description: string }> = {
    basic: { title: t("secBasic"), description: t("secBasicDesc") },
    features: { title: t("secFeatures"), description: t("secFeaturesDesc") },
    links: { title: t("secLinks"), description: t("secLinksDesc") },
    footer: { title: t("secFooter"), description: t("secFooterDesc") },
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("pageTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("pageDesc")}
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={savingSettings} className="shrink-0">
          {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveBtn")}
        </Button>
      </div>
      <Separator />

      {/* 内容区：左侧选项 + 右侧表单 */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 左侧选项导航 */}
        <nav className="shrink-0 lg:w-48" aria-label={t("navLabel")}>
          <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors w-full",
                    activeSection === section.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {t(section.titleKey as never)}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 右侧表单内容 */}
        <div className="min-w-0 flex-1">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-1">
              <h4 className="text-base font-semibold">{sectionMeta[activeSection].title}</h4>
              <p className="text-sm text-muted-foreground">
                {sectionMeta[activeSection].description}
              </p>
            </div>
            <Separator />

            {/* 基本信息 */}
            {activeSection === "basic" && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="site-name">{t("siteNameLabel")}</Label>
                  <Input
                    id="site-name"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder={t("siteNamePlaceholder")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("siteNameHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">{t("siteDescLabel")}</Label>
                  <Textarea
                    id="site-description"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    placeholder={t("siteDescPlaceholder")}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("siteDescHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-logo">{t("logoLabel")}</Label>
                  <Input
                    id="site-logo"
                    value={settings.siteLogo || ""}
                    onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("logoHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon">Favicon URL</Label>
                  <Input
                    id="favicon"
                    value={settings.favicon || ""}
                    onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                    placeholder="https://example.com/favicon.ico"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("faviconHint")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-language">{t("defaultLanguageLabel")}</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(value) =>
                      setSettings({ ...settings, defaultLanguage: value as "zh" | "en" })
                    }
                  >
                    <SelectTrigger id="default-language" className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">{t("langZh")}</SelectItem>
                      <SelectItem value="en">{t("langEn")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {t("defaultLanguageHint")}
                  </p>
                </div>
              </div>
            )}

            {/* 功能开关 */}
            {activeSection === "features" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-tracking">{t("trackingLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("trackingHint")}
                    </p>
                  </div>
                  <Switch
                    id="enable-tracking"
                    checked={settings.enableVisitTracking}
                    onCheckedChange={(checked) => setSettings({ ...settings, enableVisitTracking: checked })}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-submission">{t("submissionLabel")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("submissionHint")}
                      </p>
                    </div>
                    <Switch
                      id="enable-submission"
                      checked={settings.enableSubmission}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableSubmission: checked })}
                    />
                  </div>
                  {settings.enableSubmission && (
                    <div className="space-y-2">
                      <Label htmlFor="submission-limit">{t("submissionLimitLabel")}</Label>
                      <Input
                        id="submission-limit"
                        type="number"
                        min="1"
                        max="100"
                        value={settings.submissionMaxPerDay}
                        onChange={(e) => setSettings({ ...settings, submissionMaxPerDay: parseInt(e.target.value) || 3 })}
                        className="w-32"
                      />
                      <p className="text-sm text-muted-foreground">
                        {t("submissionLimitHint", { count: settings.submissionMaxPerDay })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 外部链接 */}
            {activeSection === "links" && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="github-url">{t("githubLabel")}</Label>
                  <Input
                    id="github-url"
                    value={settings.githubUrl || ""}
                    onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("githubHint")}
                  </p>
                </div>
              </div>
            )}

            {/* 页脚与版权 */}
            {activeSection === "footer" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-footer">{t("footerLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("footerHint")}
                    </p>
                  </div>
                  <Switch
                    id="show-footer"
                    checked={settings.showFooter}
                    onCheckedChange={(checked) => setSettings({ ...settings, showFooter: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-admin-link">{t("adminLinkLabel")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("adminLinkHint")}
                    </p>
                  </div>
                  <Switch
                    id="show-admin-link"
                    checked={settings.showAdminLink}
                    onCheckedChange={(checked) => setSettings({ ...settings, showAdminLink: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">{t("copyrightLabel")}</Label>
                  <Textarea
                    id="footer-copyright"
                    value={settings.footerCopyright}
                    onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                    rows={2}
                    placeholder={t("copyrightPlaceholder")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t("copyrightHint")}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-icp">{t("icpLabel")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("icpHint")}
                      </p>
                    </div>
                    <Switch
                      id="show-icp"
                      checked={settings.showIcp}
                      onCheckedChange={(checked) => setSettings({ ...settings, showIcp: checked })}
                    />
                  </div>
                  {settings.showIcp && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="icp-number">{t("icpNumberLabel")}</Label>
                        <Input
                          id="icp-number"
                          value={settings.icpNumber || ""}
                          onChange={(e) => setSettings({ ...settings, icpNumber: e.target.value })}
                          placeholder={t("icpNumberPlaceholder")}
                        />
                        <p className="text-sm text-muted-foreground">
                          {t("icpNumberHint")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icp-link">{t("icpLinkLabel")}</Label>
                        <Input
                          id="icp-link"
                          value={settings.icpLink || ""}
                          onChange={(e) => setSettings({ ...settings, icpLink: e.target.value })}
                          placeholder="https://beian.miit.gov.cn"
                        />
                        <p className="text-sm text-muted-foreground">
                          {t("icpLinkHint")}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("friendLinksLabel")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("friendLinksHint")}
                      </p>
                    </div>
                    <Button onClick={addFooterLink} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      {t("addLink")}
                    </Button>
                  </div>
                  {settings.footerLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder={t("linkNamePlaceholder")}
                        value={link.name}
                        onChange={(e) => updateFooterLink(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder={t("linkUrlPlaceholder")}
                        value={link.url}
                        onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFooterLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
