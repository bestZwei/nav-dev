// 临时自测脚本：验证 domain-verify 的纯函数行为（不入库、不发请求）
import { isPublicHostLiteral, extractWorkspaceSlug } from "../lib/domain-verify"

const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error("FAIL:", msg)
    process.exit(1)
  }
}

// 私网/异常 host 一律拒绝
for (const bad of [
  "localhost",
  "127.0.0.1",
  "10.0.0.1",
  "192.168.1.1",
  "172.16.0.5",
  "172.31.9.9",
  "169.254.1.1",
  "0.0.0.0",
  "[::1]",
  "fd00::1",
  "fe80::1",
  "a.localhost",
  "x.internal",
]) {
  assert(!isPublicHostLiteral(bad), `should reject: ${bad}`)
}

// 公网 host 放行
for (const ok of ["zh.example.com", "nav.example.com", "8.8.8.8", "example.com"]) {
  assert(isPublicHostLiteral(ok), `should allow: ${ok}`)
}

// meta 标记解析：双引号 / 单引号 / 属性反序 / 大小写 / 干扰标签 / 无标记 / 空 content
assert(
  extractWorkspaceSlug('<html><head><meta name="workspace" content="zh"/></head></html>') === "zh",
  "double quote"
)
assert(extractWorkspaceSlug("<meta content='en' name='workspace'>") === "en", "reversed attrs")
assert(
  extractWorkspaceSlug(
    '<meta charset="utf-8"><meta name="viewport" content="w=1"><meta NAME="workspace" CONTENT="tools">'
  ) === "tools",
  "case insensitive + other metas"
)
assert(extractWorkspaceSlug("<html><body>no marker</body></html>") === null, "no marker")
// 无 content / 空 content 的标记按无效处理，走 noMarker 而非误报 fallback
assert(extractWorkspaceSlug('<meta name="workspace">') === null, "missing content")
assert(extractWorkspaceSlug('<meta name="workspace" content="">') === null, "empty content")

console.log("all domain-verify behavior tests passed")
