// normalizeHost 快速验证（tsx 直接运行）
import { normalizeHost, isValidWorkspaceSlug } from "../lib/workspace"

const hostCases: Array<[unknown, string | null]> = [
  ["ai.nav.com", "ai.nav.com"],
  ["AI.NAV.COM", "ai.nav.com"],
  ["https://ai.nav.com", "ai.nav.com"],
  ["http://ai.nav.com:3000", "ai.nav.com"],
  ["ai.nav.com:8080", "ai.nav.com"],
  ["user@ai.nav.com", "ai.nav.com"],
  ["ai.nav.com/path?q=1", "ai.nav.com"],
  ["game.nav.com", "game.nav.com"],
  ["nav.com", "nav.com"],
  ["localhost:3000", "localhost"],
  ["", null],
  [null, null],
  [undefined, null],
  ["javascript:alert(1)", null],
  ["not a host!", null],
  ["中文域名.公司", null],
  [".nav.com", ".nav.com"],
]

let failed = 0
for (const [input, expected] of hostCases) {
  const got = normalizeHost(input)
  const ok = got === expected
  if (!ok) failed++
  console.log(`${ok ? "PASS" : "FAIL"} normalizeHost(${JSON.stringify(input)}) = ${JSON.stringify(got)} (expect ${JSON.stringify(expected)})`)
}

const slugCases: Array<[unknown, boolean]> = [
  ["ai", true],
  ["game-hub", true],
  ["a1-b2", true],
  ["AIGC", false],
  ["-ai", false],
  ["ai-", false],
  ["", false],
  [123, false],
  ["a".repeat(51), false],
]
for (const [input, expected] of slugCases) {
  const got = isValidWorkspaceSlug(input)
  const ok = got === expected
  if (!ok) failed++
  console.log(`${ok ? "PASS" : "FAIL"} isValidWorkspaceSlug(${JSON.stringify(input)}) = ${got} (expect ${expected})`)
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`)
process.exit(failed === 0 ? 0 : 1)
