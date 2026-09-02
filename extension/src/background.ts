import {
  isHttpUrl,
} from "./lib/nav"

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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 统一目标：右键在链接上收录链接，否则收录当前页面
  const url = info.linkUrl || tab?.url || ""
  const title =
    (info.linkUrl ? info.selectionText || info.linkUrl : tab?.title) || url
  if (!isHttpUrl(url)) return

  // 统一打开预填好的确认弹窗：用户可修改工作区/分类/名称/描述后提交
  const params = new URLSearchParams({ __collect: "1", ext_url: url })
  if (title) params.set("ext_title", title.slice(0, 200))
  await chrome.windows.create({
    url: chrome.runtime.getURL(`src/popup/popup.html?${params.toString()}`),
    type: "popup",
    width: 380,
    height: 640,
  })
})
