import { spawnSync } from "node:child_process";

// Cloudflare OpenNext 打包钩子：在 next build 之后生成 .open-next/ 产物，
// 供部署命令（wrangler deploy -> opennextjs-cloudflare deploy）使用。
//
// opennextjs-cloudflare build 内部会再次执行 `npm run build`，
// 通过环境变量标记嵌套调用，避免 postbuild 无限递归。
if (process.env.OPEN_NEXT_NESTED_BUILD === "1") {
  process.exit(0);
}

// 提供 SKIP_OPEN_NEXT_BUILD=1 跳过打包（如仅需 Next.js 产物的环境）
if (process.env.SKIP_OPEN_NEXT_BUILD === "1") {
  console.log("SKIP_OPEN_NEXT_BUILD=1, skipping OpenNext bundle");
  process.exit(0);
}

console.log("Building OpenNext bundle for Cloudflare Workers...");

const result = spawnSync("npx", ["opennextjs-cloudflare", "build"], {
  stdio: "inherit",
  env: { ...process.env, OPEN_NEXT_NESTED_BUILD: "1" },
});

process.exit(result.status ?? 1);
