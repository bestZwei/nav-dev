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
}

const sections = [
  { id: "basic", title: "基本信息", icon: Info },
  { id: "features", title: "功能开关", icon: Zap },
  { id: "links", title: "外部链接", icon: Link2 },
  { id: "footer", title: "页脚与版权", icon: PanelBottom },
] as const

type SectionId = (typeof sections)[number]["id"]

export default function AdminSettingsPage() {
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
      })
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const result = await updateSystemSettings(settings)
      if (result.success) {
        toast.success("保存成功", {
          description: "系统设置已更新",
        })
        setTimeout(() => window.location.reload(), 500)
      } else {
        toast.error("保存失败", {
          description: result.error || "保存设置失败，请稍后重试",
        })
      }
    } catch (error) {
      toast.error("保存失败", {
        description: "发生错误，请稍后重试",
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
    basic: { title: "基本信息", description: "配置网站的基本信息和图片资源" },
    features: { title: "功能开关", description: "启用或禁用系统功能" },
    links: { title: "外部链接", description: "配置外部链接" },
    footer: { title: "页脚与版权", description: "配置页面底部信息" },
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题区 */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">系统设置</h3>
          <p className="text-sm text-muted-foreground">
            定制网站信息、功能开关，开启你的个性化导航
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={savingSettings} className="shrink-0">
          {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存设置
        </Button>
      </div>
      <Separator />

      {/* 内容区：左侧选项 + 右侧表单 */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 左侧选项导航 */}
        <nav className="shrink-0 lg:w-48" aria-label="设置分类">
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
                  {section.title}
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
                  <Label htmlFor="site-name">网站名称</Label>
                  <Input
                    id="site-name"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder="请输入网站名称"
                  />
                  <p className="text-sm text-muted-foreground">
                    显示在浏览器标签和页面标题中
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-description">网站描述</Label>
                  <Textarea
                    id="site-description"
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    placeholder="请输入网站描述"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    网站简介，有助于搜索引擎优化（SEO）
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-logo">网站 Logo URL</Label>
                  <Input
                    id="site-logo"
                    value={settings.siteLogo || ""}
                    onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-sm text-muted-foreground">
                    建议尺寸：200x60 像素，支持 PNG、JPG、SVG 格式
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
                    浏览器标签图标，建议尺寸：32x32 或 16x16 像素
                  </p>
                </div>
              </div>
            )}

            {/* 功能开关 */}
            {activeSection === "features" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-tracking">启用访问统计</Label>
                    <p className="text-sm text-muted-foreground">
                      记录网站访问次数，用于数据统计
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
                      <Label htmlFor="enable-submission">启用网站收录</Label>
                      <p className="text-sm text-muted-foreground">
                        允许访客提交网站收录申请，管理员审核后发布
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
                      <Label htmlFor="submission-limit">每日提交限制</Label>
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
                        同一 IP 24 小时内最多可以提交 {settings.submissionMaxPerDay} 次网站收录申请
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
                  <Label htmlFor="github-url">GitHub 仓库地址</Label>
                  <Input
                    id="github-url"
                    value={settings.githubUrl || ""}
                    onChange={(e) => setSettings({ ...settings, githubUrl: e.target.value })}
                    placeholder="https://github.com/username/repo"
                  />
                  <p className="text-sm text-muted-foreground">
                    将显示在登录页面底部，用于项目展示或源码分享
                  </p>
                </div>
              </div>
            )}

            {/* 页脚与版权 */}
            {activeSection === "footer" && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-footer">底部信息</Label>
                    <p className="text-sm text-muted-foreground">
                      启用后将在页面底部显示版权信息和友情链接
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
                    <Label htmlFor="show-admin-link">管理后台链接</Label>
                    <p className="text-sm text-muted-foreground">
                      在底部添加管理后台入口，方便管理员快速登录
                    </p>
                  </div>
                  <Switch
                    id="show-admin-link"
                    checked={settings.showAdminLink}
                    onCheckedChange={(checked) => setSettings({ ...settings, showAdminLink: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footer-copyright">版权信息</Label>
                  <Textarea
                    id="footer-copyright"
                    value={settings.footerCopyright}
                    onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                    rows={2}
                    placeholder="© 2026 公司名称. All rights reserved."
                  />
                  <p className="text-sm text-muted-foreground">
                    显示在页面底部的版权声明，支持 HTML 标签
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="show-icp">备案信息</Label>
                      <p className="text-sm text-muted-foreground">
                        在页面底部显示 ICP 备案号，符合中国大陆网站法规要求
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
                        <Label htmlFor="icp-number">ICP 备案号</Label>
                        <Input
                          id="icp-number"
                          value={settings.icpNumber || ""}
                          onChange={(e) => setSettings({ ...settings, icpNumber: e.target.value })}
                          placeholder="例如：京ICP备12345678号-1"
                        />
                        <p className="text-sm text-muted-foreground">
                          请填写您的网站备案号，可在工信部备案系统查询
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icp-link">ICP 备案链接（可选）</Label>
                        <Input
                          id="icp-link"
                          value={settings.icpLink || ""}
                          onChange={(e) => setSettings({ ...settings, icpLink: e.target.value })}
                          placeholder="https://beian.miit.gov.cn"
                        />
                        <p className="text-sm text-muted-foreground">
                          填写后备案号将显示为可点击的链接，跳转到工信部备案查询页面
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>友情链接</Label>
                      <p className="text-sm text-muted-foreground">
                        添加合作伙伴或常用网站链接
                      </p>
                    </div>
                    <Button onClick={addFooterLink} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      添加链接
                    </Button>
                  </div>
                  {settings.footerLinks.map((link, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="链接名称"
                        value={link.name}
                        onChange={(e) => updateFooterLink(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="链接地址"
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
