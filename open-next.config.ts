import type { OpenNextConfig } from "@opennextjs/cloudflare";

// 缓存使用 dummy 实现：站点为动态渲染（Cookie 语言解析），
// 无需 KV incremental cache 与自引用 service binding（WORKER_SELF_REFERENCE）
const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
