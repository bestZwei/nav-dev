import { useState } from "react"
import { createRoot } from "react-dom/client"
import { Eye, EyeOff } from "lucide-react"

import "./options.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchExtensionMeta } from "../lib/nav"
import { getExtConfig, setExtConfig } from "../lib/storage"

function Options() {
  const [baseUrl, setBaseUrl] = useState("")
  const [token, setToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [initialized, setInitialized] = useState(false)
  // 操作反馈：顶部居中浮出的 toast 弹窗（自动消失），替代行内文案
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "err" } | null>(
    null
  )
  const [toastVisible, setToastVisible] = useState(false)
  function showToast(message: string, tone: "ok" | "err" = "ok") {
    setToast({ message, tone })
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  if (!initialized) {
    setInitialized(true)
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark")
    }
    getExtConfig().then(cfg => {
      setBaseUrl(cfg.baseUrl)
      setToken(cfg.token)
    })
  }

  async function persist(): Promise<boolean> {
    const normalized = baseUrl.trim().replace(/\/+$/, "")
    try {
      new URL(normalized)
    } catch {
      showToast("站点地址格式不正确", "err")
      return false
    }
    await setExtConfig({
      baseUrl: normalized,
      token: token.trim(),
    })
    return true
  }

  async function handleSave() {
    if (await persist()) {
      showToast("已保存")
    }
  }

  async function handleTest() {
    if (!(await persist())) return
    setTesting(true)
    const result = await fetchExtensionMeta()
    setTesting(false)
    if (result.ok) {
      showToast(`连接成功：${result.data.workspaces.length} 个工作区`)
    } else {
      const messages: Record<string, string> = {
        UNAUTHORIZED: "令牌无效或插件未启用",
        NOT_CONFIGURED: "请填写站点地址与令牌",
        NETWORK_ERROR: "无法连接导航站",
      }
      showToast(messages[result.error] || `连接失败：${result.error}`, "err")
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Waypoint 插件设置</h1>
        <p className="text-sm text-muted-foreground">
          配置导航站地址与访问令牌，即可在弹窗中直接收录网页到指定工作区与分类。
        </p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="base-url">站点地址</Label>
          <Input
            id="base-url"
            type="url"
            placeholder="http://localhost:3000"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            例如：https://nav.example.com（末尾无需斜杠）
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">访问令牌</Label>
          <div className="flex gap-2">
            <Input
              id="token"
              type={showToken ? "text" : "password"}
              className="font-mono"
              value={token}
              onChange={e => setToken(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setShowToken(v => !v)}
              title={showToken ? "隐藏令牌" : "显示令牌"}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            在导航站「插件管理 → 浏览器扩展」中启用插件并生成令牌，粘贴到这里。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>保存</Button>
          <Button variant="outline" disabled={testing} onClick={handleTest}>
            {testing ? "测试中…" : "测试连接"}
          </Button>
        </div>
      </div>
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md border bg-background px-4 py-2.5 text-sm shadow-lg transition-all duration-200 ${
            toast.tone === "err"
              ? "border-destructive/50 text-destructive"
              : "text-foreground"
          } ${
            toastVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-1 opacity-0"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

createRoot(document.getElementById("app")!).render(<Options />)
