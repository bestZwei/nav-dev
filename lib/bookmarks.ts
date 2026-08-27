// Chrome书签解析的扁平化结果
export interface ParsedBookmark {
  categories: Array<{
    name: string
    sites: Array<{
      name: string
      url: string
      icon?: string
    }>
  }>
}

/**
 * 解析Chrome书签HTML文件
 * 支持多层嵌套文件夹，自动扁平化为独立分类
 *
 * 实现为轻量正则解析器（Netscape Bookmark File 格式规整，
 * 无需引入 jsdom 这类重量级 DOM 实现，显著缩减 Serverless 打包体积）
 */
export function parseChromeBookmarks(html: string): ParsedBookmark {
  const result: ParsedBookmark = { categories: [] }
  // 文件夹路径栈：栈顶即书签归属的分类
  const folderStack: string[] = []
  // 最近一个未遇到 <DL> 的 H3 文件夹名（Chrome 格式中 H3 紧跟其子 DL）
  let pendingFolder: string | null = null

  const tokenRe = /<DT>\s*<H3[^>]*>([\s\S]*?)<\/H3>|<DT>\s*<A\s([^>]*)>([\s\S]*?)<\/A>|<DL[^>]*>|<\/DL/gi

  const pushSite = (name: string, url: string, icon?: string) => {
    if (folderStack.length === 0) return
    const categoryName = folderStack[folderStack.length - 1]
    let category = result.categories.find(c => c.name === categoryName)
    if (!category) {
      category = { name: categoryName, sites: [] }
      result.categories.push(category)
    }
    category.sites.push({ name, url, icon })
  }

  let match: RegExpExecArray | null
  while ((match = tokenRe.exec(html)) !== null) {
    if (match[1] !== undefined) {
      // 文件夹标题 <DT><H3>名称</H3>
      pendingFolder = decodeHtmlEntities(match[1]).trim() || '未命名分类'
    } else if (match[3] !== undefined) {
      // 书签链接 <DT><A HREF="..." ICON="...">名称</A>
      const attrs = match[2] || ''
      const href = extractAttribute(attrs, 'href')
      // textContent 语义：剥离内部杂散标签（容错畸形 HTML）
      const siteName = decodeHtmlEntities(match[3].replace(/<[^>]*>/g, '')).trim() || '未命名网站'
      if (href) {
        const icon = extractAttribute(attrs, 'icon')
        pushSite(siteName, decodeHtmlEntities(href), icon ? decodeHtmlEntities(icon) : undefined)
      }
    } else if (/^<DL/i.test(match[0])) {
      // 进入子文件夹层级
      if (pendingFolder !== null) {
        folderStack.push(pendingFolder)
        pendingFolder = null
      }
    } else {
      // 离开文件夹层级
      folderStack.pop()
    }
  }

  return result
}

// 从属性串中提取指定属性值（双引号/单引号/未加引号三种形式）
function extractAttribute(attrs: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  const m = attrs.match(re)
  if (!m) return undefined
  return m[1] ?? m[2] ?? m[3]
}

// 常用命名实体 + 数字实体解码（与 Chrome 导出格式覆盖面一致）
function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  }
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (whole, name: string) => {
      const mapped = named[name.toLowerCase()]
      return mapped ?? whole
    })
}

function safeFromCodePoint(code: number): string {
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

/**
 * 生成Chrome书签HTML格式
 */
export function generateChromeBookmarks(
  categories: Array<{
    name: string
    sites: Array<{
      name: string
      url: string
      icon?: string
    }>
  }>
): string {
  const timestamp = Math.floor(Date.now() / 1000)

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`

  categories.forEach((category) => {
    html += `    <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${escapeHtml(category.name)}</H3>
    <DL><p>
`
    category.sites.forEach((site) => {
      const iconAttr = site.icon ? ` ICON="${escapeHtml(site.icon)}"` : ''
      html += `        <DT><A HREF="${escapeHtml(site.url)}" ADD_DATE="${timestamp}"${iconAttr}>${escapeHtml(site.name)}</A>\n`
    })

    html += `    </DL><p>\n`
  })

  html += `</DL><p>\n`

  return html
}

/**
 * HTML转义函数
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
