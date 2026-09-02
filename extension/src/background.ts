import {
  fetchExtensionMeta,
  isHttpUrl,
  openCollectTab,
  submitDirect,
} from "./lib/nav"
import { getExtConfig, setExtConfig } from "./lib/storage"

const MENU_ROOT = "waypoint-root"
const MENU_COLLECT = "waypoint-collect"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_ROOT, title: "Waypoint 收录助手" })
  chrome.contextMenus.create({
    id: MENU_COLLECT,
    parentId: MENU_ROOT,
    title: "收录此站点",
    contexts: ["page", "link"],
  })
})

// 结果反馈：扩展图标角标 ✓ / !，2 秒后清除
async function flashBadge(ok: boolean) {
  await chrome.action.setBadgeBackgroundColor({
    color: ok ? "#16a34a" : "#dc2626",
  })
  await chrome.action.setBadgeText({ text: ok ? "✓" : "!" })
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000)
}

// 尽力读取页面描述（activeTab 已随菜单点击授权，失败静默降级）
async function readPageDescription(tabId?: number): Promise<string> {
  if (!tabId) return ""
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const meta =
          document.querySelector<HTMLMetaElement>("meta[property='og:description']") ||
          document.querySelector<HTMLMetaElement>("meta[name='description']")
        return meta?.content?.trim() || ""
      },
    })
    return ((result?.result as string) || "").slice(0, 200)
  } catch {
    return ""
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 统一目标：右键在链接上收录链接，否则收录当前页面
  const url = info.linkUrl || tab?.url || ""
  const title =
    (info.linkUrl ? info.selectionText || info.linkUrl : tab?.title) || url
  if (!isHttpUrl(url)) return

  const config = await getExtConfig()

  // 已配置令牌：走扩展直连收录 API，目标沿用上次选择（缺省回退默认工作区）
  if (config.baseUrl && config.token) {
    let workspaceId = config.lastWorkspaceId || ""
    let categoryId = config.lastCategoryId || ""
    if (!workspaceId || !categoryId) {
      const meta = await fetchExtensionMeta()
      if (!meta.ok) {
        await flashBadge(false)
        return
      }
      const ws = meta.data.workspaces.find(w => w.isDefault) || meta.data.workspaces[0]
      workspaceId = ws?.id || ""
      categoryId = meta.data.categories.find(c => c.workspaceId === workspaceId)?.id || ""
    }
    if (!workspaceId || !categoryId) {
      await flashBadge(false)
      return
    }

    const description = await readPageDescription(tab?.id)
    const result = await submitDirect({
      name: title.slice(0, 50),
      url,
      description,
      workspaceId,
      categoryId,
    })
    await flashBadge(result.ok)

    // 成功后记住目标，作为下次右键收录的默认
    if (result.ok) {
      await setExtConfig({ lastWorkspaceId: workspaceId, lastCategoryId: categoryId })
    }
    return
  }

  // 未配置令牌：回退深链，引导到站点投稿弹窗完成配置与收录
  await openCollectTab({ url, title })
})
