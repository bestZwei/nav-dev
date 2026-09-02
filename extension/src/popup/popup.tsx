import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { Loader2, Settings } from "lucide-react"

import "./popup.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimpleSelect } from "@/components/ui/simple-select"
import {
  fetchExtensionMeta,
  isHttpUrl,
  stripToDomain,
  submitDirect,
  type ExtensionMeta,
} from "../lib/nav"
import { getExtConfig, setExtConfig, type ExtConfig } from "../lib/storage"

type Status = { message: string; tone: "ok" | "err" } | null

function Popup() {
  const [config, setConfig] = useState<ExtConfig | null>(null)
  const [meta, setMeta] = useState<ExtensionMeta | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [keepDomainOnly, setKeepDomainOnly] = useState(false)
  const [workspaceId, setWorkspaceId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const [statusVisible, setStatusVisible] = useState(false)

  // 操作反馈：与设置页一致的顶部居中 toast 弹窗
  function showStatus(message: string, tone: "ok" | "err") {
    setStatus({ message, tone })
    setStatusVisible(true)
    setTimeout(() => setStatusVisible(false), tone === "ok" ? 1100 : 2400)
  }

  const collectable = isHttpUrl(tab?.url || "")

  useEffect(() => {
    // 扩展弹窗默认不持焦点，Radix Select 会误判「外部点击」立即收回；
    // 显式聚焦弹窗窗口即可正常交互
    window.focus()
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark")
    }
    ;(async () => {
      // 深链预填（右键菜单/扩展窗口场景）：参数优先于当前标签页
      const params = new URLSearchParams(window.location.search)
      const extUrl = params.get("ext_url") || ""
      const hasExtTarget = isHttpUrl(extUrl)
      const cfg = await getExtConfig()
      setConfig(cfg)
      setKeepDomainOnly(cfg.keepDomainOnly)
      if (hasExtTarget) {
        setTab({
          id: -1,
          url: extUrl,
          title: params.get("ext_title") || extUrl,
        } as chrome.tabs.Tab)
        setName(params.get("ext_title") || extUrl)
        setDescription(params.get("ext_desc") || "")
      } else {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })
        const current = tabs[0] || null
        setTab(current)
        if (isHttpUrl(current?.url || "")) {
          setName(current!.title || "")
          try {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: current!.id! },
              func: () => {
                const meta =
                  document.querySelector<HTMLMetaElement>(
                    "meta[property='og:description']"
                  ) ||
                  document.querySelector<HTMLMetaElement>(
                    "meta[name='description']"
                  )
                return meta?.content?.trim() || ""
              },
            })
            setDescription((result?.result as string) || "")
          } catch {
            /* 无法注入时静默降级 */
          }
        }
      }
      if (cfg.baseUrl && cfg.token) {
        const result = await fetchExtensionMeta()
        if (result.ok) {
          setMeta(result.data)
          const preferred =
            result.data.workspaces.find(w => w.isDefault) ||
            result.data.workspaces[0]
          if (preferred) setWorkspaceId(preferred.id)
        } else {
          setMetaError(result.error)
        }
      }
    })()
  }, [])

  // 工作区变化时同步默认分类
  useEffect(() => {
    if (!meta || !workspaceId) return
    const list = meta.categories.filter(c => c.workspaceId === workspaceId)
    setCategoryId(list[0]?.id || "")
  }, [meta, workspaceId])

  const sourceUrl = tab?.url || ""
  const displayUrl = keepDomainOnly ? stripToDomain(sourceUrl) : sourceUrl

  async function toggleDomain() {
    const next = !keepDomainOnly
    setKeepDomainOnly(next)
    await setExtConfig({ keepDomainOnly: next })
  }

  async function handleSubmit() {
    const url = displayUrl.trim()
    if (!workspaceId || !categoryId) {
      showStatus("请选择工作区与分类", "err")
      return
    }
    if (!name.trim()) {
      showStatus("请填写网站名称", "err")
      return
    }
    if (!description.trim()) {
      showStatus("请填写网站描述", "err")
      return
    }
    if (!isHttpUrl(url)) {
      showStatus("网址格式不正确", "err")
      return
    }
    setSubmitting(true)
    setStatus(null)
    setStatusVisible(false)
    const result = await submitDirect({
      name: name.trim(),
      url,
      description: description.trim(),
      workspaceId,
      categoryId,
    })
    // 记住本次目标：右键菜单「收录此站点」默认沿用
    await setExtConfig({ lastWorkspaceId: workspaceId, lastCategoryId: categoryId })
    setSubmitting(false)
    if (!result.ok) {
      const messages: Record<string, string> = {
        UNAUTHORIZED: "令牌无效或插件未启用",
        INVALID_NAME: "名称不能为空，最长 50 字",
        INVALID_URL: "网址格式不正确",
        INVALID_DESC: "描述最长 200 字",
        CATEGORY_MISMATCH: "分类与工作区不匹配，请重新选择",
        NOT_CONFIGURED: "请先在设置中配置站点地址与令牌",
        NETWORK_ERROR: "网络错误，无法连接导航站",
        HTTP_403: "请求被站点拒绝：请检查令牌或稍后重试",
      }
      showStatus(messages[result.error] || "收录失败，请稍后重试", "err")
      return
    }
    showStatus("已收录到导航站", "ok")
    setTimeout(() => window.close(), 1300)
  }

  const statusText = (() => {
    if (status) return status.message
    if (!config?.token) return "尚未配置令牌：请在「设置」中粘贴站点令牌"
    if (metaError === "UNAUTHORIZED") return "令牌无效或插件未启用"
    if (metaError) return "加载工作区与分类失败"
    if (!collectable) return "当前页面不是 http/https 网页，无法收录"
    return null
  })()

  return (
    <div className="w-full space-y-2.5 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/icons/icon128.png"
            alt="Waypoint"
            className="h-6 w-6 rounded-md"
          />
          <h1 className="text-sm font-semibold">Waypoint 收录助手</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2.5 rounded-lg border bg-card p-2.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {displayUrl || "当前页面无法收录"}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 rounded-md px-2 text-[11px] font-medium text-muted-foreground"
            disabled={!collectable}
            onClick={toggleDomain}
            title="切换收录时保留的 URL 形式"
          >
            {keepDomainOnly ? "仅域名" : "完整 URL"}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-name">网站名称</Label>
          <Input
            id="site-name"
            className="h-8 text-sm"
            placeholder="网站名称"
            maxLength={50}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-desc">网站描述</Label>
          <Textarea
            id="site-desc"
            className="min-h-[56px] text-sm"
            placeholder="请输入网站描述"
            maxLength={200}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex items-center justify-between">
            {!description ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                未获取到页面描述，请手动填写
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">
              {description.length}/200
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>工作区</Label>
            <SimpleSelect
              value={workspaceId}
              onValueChange={setWorkspaceId}
              options={
                meta?.workspaces.map(w => ({
                  value: w.id,
                  label: w.isDefault ? `${w.name}（默认）` : w.name,
                })) || []
              }
              placeholder="选择工作区"
              disabled={!meta || meta.workspaces.length === 0}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label>分类</Label>
            <SimpleSelect
              value={categoryId}
              onValueChange={setCategoryId}
              options={
                meta
                  ?.categories.filter(c => c.workspaceId === workspaceId)
                  .map(c => ({ value: c.id, label: c.name })) || []
              }
              placeholder="选择分类"
              disabled={
                !meta ||
                meta.categories.filter(c => c.workspaceId === workspaceId)
                  .length === 0
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* 静态环境提示（未配置/页面类型等）保留行内展示 */}
      {!status && statusText && (
        <p
          className="text-center text-xs text-muted-foreground"
        >
          {statusText}
        </p>
      )}

      {/* 操作反馈 toast：与设置页一致 */}
      {status && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md border bg-background px-4 py-2.5 text-sm shadow-lg transition-all duration-200 ${
            status.tone === "err"
              ? "border-destructive/50 text-destructive"
              : "text-foreground"
          } ${
            statusVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-1 opacity-0"
          }`}
        >
          {status.message}
        </div>
      )}

      <Button
        className="w-full"
        disabled={!collectable || submitting || !config?.token}
        onClick={handleSubmit}
      >
        {submitting && <Loader2 className="animate-spin" />}
        收录此页面
      </Button>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => chrome.tabs.create({ url: `${config?.baseUrl || ""}/` })}
        >
          首页
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() =>
            chrome.tabs.create({ url: `${config?.baseUrl || ""}/admin` })
          }
        >
          后台
        </Button>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/70">
        站点：{config?.baseUrl}
      </p>
    </div>
  )
}

createRoot(document.getElementById("app")!).render(<Popup />)
