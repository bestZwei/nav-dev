// 开发预览：在普通网页环境模拟 chrome 扩展 API 与站点接口，
// 让内置浏览器可以直接渲染弹窗 UI 并交互验证（不影响扩展产物本身）

const store: Record<string, unknown> = {
  baseUrl: "http://localhost:3000",
  token: "preview-token",
  keepDomainOnly: false,
}

function log(message: string) {
  const el = document.getElementById("preview-log")
  if (!el) return
  const line = document.createElement("div")
  line.textContent = message
  el.prepend(line)
}

const json = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })

const chromeStub = {
  storage: {
    sync: {
      get: async (defaults: Record<string, unknown>) => ({
        ...defaults,
        ...store,
      }),
      set: async (patch: Record<string, unknown>) => {
        Object.assign(store, patch)
        log(`storage.set ${JSON.stringify(patch)}`)
      },
    },
  },
  tabs: {
    query: async () => [
      {
        id: 1,
        url: "https://github.com/microsoft/vscode",
        title: "Visual Studio Code - Official Repository",
      },
    ],
    create: async ({ url }: { url: string }) => log(`新标签页：${url}`),
  },
  scripting: {
    executeScript: async () => [
      {
        result:
          "VS Code 是微软官方开源代码编辑器，内置语法高亮、智能补全与 Git 集成。",
      },
    ],
  },
  runtime: {
    openOptionsPage: async () => log("打开设置页"),
  },
}

;(window as unknown as { chrome: unknown }).chrome = chromeStub

const realFetch = window.fetch.bind(window)
window.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url
  if (url.includes("/api/extension")) {
    const method = init?.method || "GET"
    if (method === "POST") {
      log(`已捕获收录请求：${String(init?.body)}`)
      return json({ siteId: "preview-site-1" })
    }
    return json({
      workspaces: [
        { id: "ws-default", name: "默认工作区", slug: "default", isDefault: true },
        { id: "ws-ai", name: "AI 工作区", slug: "ai", isDefault: false },
      ],
      categories: [
        { id: "cat-tools", name: "常用工具", workspaceId: "ws-default" },
        { id: "cat-dev", name: "开发者工具", workspaceId: "ws-default" },
        { id: "cat-chat", name: "AI 对话助手", workspaceId: "ws-ai" },
        { id: "cat-image", name: "AI 绘画图像", workspaceId: "ws-ai" },
      ],
    })
  }
  return realFetch(input, init)
}

log("预览环境就绪：chrome API 与 /api/extension 已模拟")

import("../popup/popup")
