import { isHttpUrl, openCollectTab } from "./lib/nav"

const MENU_ROOT = "conan-nav-root"
const MENU_PAGE = "conan-nav-page"
const MENU_LINK = "conan-nav-link"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_ROOT, title: "Waypoint 收录助手" })
  chrome.contextMenus.create({
    id: MENU_PAGE,
    parentId: MENU_ROOT,
    title: "收录此页面",
    contexts: ["page"],
  })
  chrome.contextMenus.create({
    id: MENU_LINK,
    parentId: MENU_ROOT,
    title: "收录此链接",
    contexts: ["link"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_PAGE && tab?.url && tab?.title) {
    if (isHttpUrl(tab.url)) {
      await openCollectTab({ url: tab.url, title: tab.title })
    }
    return
  }
  if (info.menuItemId === MENU_LINK && info.linkUrl) {
    if (isHttpUrl(info.linkUrl)) {
      await openCollectTab({
        url: info.linkUrl,
        title: info.selectionText || info.linkUrl,
      })
    }
  }
})
