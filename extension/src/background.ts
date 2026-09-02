import { isHttpUrl } from "./lib/nav"

const MENU_COLLECT = "waypoint-collect"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_COLLECT,
    title: "收录此站点",
    contexts: ["page", "link"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 统一目标：右键在链接上收录链接，否则收录当前页面
  const url = info.linkUrl || tab?.url || ""
  const title =
    (info.linkUrl ? info.selectionText || info.linkUrl : tab?.title) || url
  if (!isHttpUrl(url)) return

  // 尽力读取页面描述（activeTab 已随菜单点击授权，失败静默降级）
  let description = ""
  try {
    if (tab?.id && !info.linkUrl) {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const meta =
            document.querySelector<HTMLMetaElement>("meta[property='og:description']") ||
            document.querySelector<HTMLMetaElement>("meta[name='description']")
          return meta?.content?.trim() || ""
        },
      })
      description = ((result?.result as string) || "").slice(0, 200)
    }
  } catch {
    /* 无法注入时静默降级 */
  }

  // 目标暂存 session：弹窗打开后读取并清除（一次性）
  await chrome.storage.session.set({
    pendingCollect: { url, title: title.slice(0, 200), description },
  })

  // 原位打开扩展自带弹窗（Chrome 127+），与点击扩展图标完全一致；
  // 旧版本回退为独立小窗
  if (chrome.action.openPopup) {
    try {
      await chrome.action.openPopup()
      return
    } catch {
      /* 打开失败时走回退 */
    }
  }
  const params = new URLSearchParams({ ext_url: url })
  if (title) params.set("ext_title", title.slice(0, 200))
  if (description) params.set("ext_desc", description)
  await chrome.windows.create({
    url: chrome.runtime.getURL(`src/popup/popup.html?${params.toString()}`),
    type: "popup",
    width: 380,
    height: 640,
  })
})
