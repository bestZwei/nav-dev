// Chrome 书签解析器快速验证（替代 jsdom 实现后的一致性检查）
import { parseChromeBookmarks, generateChromeBookmarks } from "../lib/bookmarks"

let failed = 0
function check(name: string, cond: boolean, extra = "") {
  if (!cond) failed++
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? ` (${extra})` : ""}`)
}

// 1. 真实 Chrome 导出格式样例（含嵌套/实体/icon）
const sample = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
        <DT><A HREF="https://github.com" ICON="data:image/png;base64,xxx">GitHub</A>
        <DT><H3>云服务</H3>
        <DL><p>
            <DT><A HREF="https://www.cloudflare.com/index?a=1&amp;b=2">Cloudflare &amp; CDN</DT></A>
        </DL><p>
        <DT><A HREF="https://stackoverflow.com">Stack &lt;Overflow&gt;</A>
    </DL><p>
    <DT><H3>其他</H3>
    <DL><p>
        <DT><A HREF="https://example.com/中文路径">示例网站</A>
    </DL><p>
</DL><p>
`

const parsed = parseChromeBookmarks(sample)
check("嵌套扁平化为独立分类（书签栏/云服务/其他）", parsed.categories.length === 3, JSON.stringify(parsed.categories.map(c => c.name)))
const cloud = parsed.categories.find(c => c.name === "云服务")
check("嵌套子文件夹独立成类", Boolean(cloud))
check("href 实体解码", cloud?.sites[0]?.url === "https://www.cloudflare.com/index?a=1&b=2", cloud?.sites[0]?.url)
check("链接文本实体解码", cloud?.sites[0]?.name === "Cloudflare & CDN", cloud?.sites[0]?.name)
check("ICON 属性提取", parsed.categories[0]?.sites[0]?.icon === "data:image/png;base64,xxx")
const so = parsed.categories[0]?.sites.find(s => s.name.includes("Overflow"))
check("文本含转义尖括号", so?.name === "Stack <Overflow>", so?.name)
const other = parsed.categories.find(c => c.name === "其他")
check("中文分类与 URL", other?.sites[0]?.name === "示例网站" && other?.sites[0]?.url === "https://example.com/中文路径")
check("分类内书签数量（书签栏=2）", parsed.categories[0]?.sites.length === 2)

// 2. 空文件夹 / 无书签根
check("空内容", parseChromeBookmarks("").categories.length === 0)
check("无书签的根 DL", parseChromeBookmarks("<DL><p></DL><p>").categories.length === 0)

// 3. 回写生成 → 再解析（round-trip）
const generated = generateChromeBookmarks(parsed.categories)
const reparsed = parseChromeBookmarks(generated)
check(
  "round-trip 分类一致",
  reparsed.categories.length === parsed.categories.length &&
    reparsed.categories.every((c, i) => c.name === parsed.categories[i].name && c.sites.length === parsed.categories[i].sites.length)
)
const rtCloud = reparsed.categories.find(c => c.name === "云服务")
check("round-trip 实体还原", rtCloud?.sites[0]?.url === "https://www.cloudflare.com/index?a=1&b=2", rtCloud?.sites[0]?.url)

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
