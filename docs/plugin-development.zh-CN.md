# 插件开发指南

本系统提供两种插件形态，按需求选择：

| | 上传插件（声明式） | 内置插件（代码级） |
|---|---|---|
| 适用场景 | 外部服务集成、入口按钮、活动页嵌入 | 深度功能（表单、审核流、数据库读写） |
| 开发方式 | 只写一个 `manifest.json`，后台上传 | TypeScript + React，随仓库发布 |
| 能力边界 | 按钮 / 链接 / iframe / Markdown 四种注入形态 + webhook | 完整（可新增 server action、数据字段） |
| 安全模型 | 零代码执行，manifest 经 zod 校验 | 代码审查后合入 |

两类插件在管理后台（`/admin/plugins`）统一启停；插件禁用时前台入口隐藏、后端能力拒绝，业务数据保留。

---

## 一、上传插件（声明式 manifest）

上传插件是纯声明数据：系统按 manifest 描述渲染 UI、按声明转发 webhook，**不执行上传内容中的任何代码**。

### 1. manifest 格式

```json
{
  "id": "my-promo",
  "name": "推广助手",
  "description": "在页头展示活动入口",
  "version": "1.0.0",
  "author": "your-name",
  "icon": "https://example.com/icon.png",
  "slots": {
    "header": {
      "type": "iframe",
      "label": "活动中心",
      "target": "https://example.com/promo",
      "width": 880,
      "height": 640
    },
    "footer": {
      "type": "link",
      "label": "关于我们",
      "target": "https://example.com/about"
    }
  },
  "webhooks": {
    "siteSubmitted": "https://example.com/hooks/site-submitted"
  },
  "configFields": [
    {
      "key": "apiToken",
      "labelKey": "服务令牌",
      "type": "string",
      "defaultValue": ""
    }
  ]
}
```

### 2. 字段约束

| 字段 | 约束 |
|------|------|
| `id` | 小写字母/数字/连字符，2-64 字符；与内置插件 ID 冲突时拒绝上传 |
| `name` | 1-64 字符 |
| `version` | 1-32 字符 |
| `description` / `author` | 可选，256 / 64 字符内 |
| `icon` | 可选，http(s) URL |
| `slots` | 可选；至少声明一个 slot 或 webhook，否则校验失败 |
| `webhooks` | 可选；键为事件名，值必须为 http(s) URL |
| `configFields` | 可选，最多 20 项；`key` 为字母开头的标识符 |
| 文件大小 | 整个 manifest 不超过 64KB |

### 3. 注入槽位（slots）

每个槽位支持四种形态：

- **`button`**：页头图标按钮，点击新窗口打开 `target`
- **`link`**：文字链接（多用于 footer），新窗口打开 `target`
- **`iframe`**：点击图标弹出受控弹窗内嵌 `target` 页面。iframe 强制 `sandbox="allow-scripts allow-forms allow-popups"`（排除 `allow-same-origin`，插件页面无法访问宿主页 Cookie/DOM）；`height` 可选 200-1280
- **`markdown`**：渲染 `content` 中的 Markdown（最多 8KB），仅 footer 槽位支持

`button` / `link` 必须提供 `target`，且 `label` 与 `icon` 至少一个。

### 4. Webhook 事件

manifest 中 `webhooks` 的键必须取自核心支持的事件清单，拼写错误会在上传校验时被拒绝：

| 事件 | 触发时机 | payload 字段 |
|------|----------|--------------|
| `siteSubmitted` | 访客投稿成功（site-submission 插件） | name, url, description |
| `sitePublished` | 站点以发布状态创建，或发布状态从下架变为公开 | siteId, name, url, description |
| `siteUnpublished` | 站点从公开切换为下架 | siteId, name, url, description |
| `siteDeleted` | 站点被删除 | siteId, name, url, description |

系统向声明的端点 POST JSON（以 `sitePublished` 为例）：

```json
{
  "event": "sitePublished",
  "pluginId": "my-plugin",
  "payload": {
    "siteId": "clx...",
    "name": "站点名称",
    "url": "https://example.com",
    "description": "站点描述"
  }
}
```

超时 5 秒；请求失败只记录日志，不影响主流程。注意：事件为同步等待，插件端点应快速返回（先落库/入队，异步处理业务）。

### 5. 配置项（configFields）

- `type`: `"number" | "string" | "boolean"`
- `labelKey`：配置项显示文案（上传插件直接写明文，不走 i18n）
- `defaultValue`：站长未配置时的取值；number 支持 `min` / `max` 边界

配置值随插件独立持久化，插件禁用期间也可修改，启用后即生效。

### 6. 上传与生命周期

1. 管理后台 → 插件管理 → 「选择 manifest.json」上传
2. 校验失败会逐字段提示原因；校验通过后插件以**禁用**状态入列
3. 打开开关启用（前台下一次渲染即生效）；上传插件可随时删除（业务数据保留），内置插件只能启停

---

## 二、内置插件（代码级）

深度功能以内置插件形式随仓库发布。以 `plugins/site-submission`（网站收录）为参考实现。

### 1. 目录结构

```
plugins/<your-plugin>/
  index.ts          # 插件定义（唯一入口）
  constants.ts      # PLUGIN_ID、配置字段声明、webhook 事件名
  actions.ts        # "use server"：插件提供的 server actions
  header-slot.tsx   # 可选："use client"，前台 header 注入组件
```

### 2. 插件定义（index.ts）

```ts
import { Puzzle } from "lucide-react"
import type { PluginDefinition } from "@/lib/plugins/types"
import { MyHeaderSlot } from "./header-slot"
import { PLUGIN_ID, MY_CONFIG_FIELDS } from "./constants"

export const myPlugin: PluginDefinition = {
  id: PLUGIN_ID,
  nameKey: "plugins.myPlugin.name",           // i18n key
  descriptionKey: "plugins.myPlugin.description",
  icon: Puzzle,
  version: "1.0.0",
  defaultEnabled: false,
  configFields: MY_CONFIG_FIELDS,
  headerSlot: MyHeaderSlot,                   // 可选
  footerSlot: MyFooterSlot,                   // 可选
  serverActionIds: ["myAction"],              // 声明后端能力
}
```

### 3. 登记注册表

```ts
// lib/plugins/registry.ts
export const pluginRegistry: PluginDefinition[] = [
  siteSubmissionPlugin,
  myPlugin,   // 新增一行
]
```

核心代码零改动：header/footer 注入点与管理页自动发现新插件。

### 3a. 可用注入点（slots）

| slot 字段 | 位置 | 典型用途 |
|-----------|------|----------|
| `headerSlot` | 前台页头工具区 | 功能入口（收录按钮） |
| `headerToolsSlot` | 前台页头工具区（开关按钮位） | 用户级显隐切换（诗词按钮） |
| `homeSideSlot` | 首页右侧固定侧栏 | 浮动卡片（今日诗词） |
| `footerSlot` | 页脚 | 链接 / Markdown 区块 |

`homeSideSlot` 配合可见性协议使用：

- `useBuiltinPluginEnabled(id)`：查询插件是否启用
- `useHomeSideActive()`：是否存在启用中的 homeSide 插件（核心布局据此预留右侧空间）
- `useHomeSideVisible(enabled)`：用户级显隐（localStorage + 自定义事件），返回 `{ visible, mounted, setUserVisible }`

框架本身不限定每个槽位的插件数量；同一时刻 homeSide 只应有一个插件展示卡片（产品约定）。

### 3b. 已有内置插件清单

| 插件 ID | 功能 | 迁移状态 |
|---------|------|----------|
| `site-submission` | 访客投稿网址，站长审核后展示 | 插件化 |
| `poetry-card` | 首页右上角今日诗词卡片 | 插件化 |
| `visit-tracking` | 站点访问埋点 + 后台访问统计 | 插件化 |
| `site-detail` | 站点卡片二级详情弹窗 | 插件化（数据获取 getSiteDetail 属于核心，弹窗 UI 属于插件） |
| `about-page` | 前台「关于」页面入口（页脚链接 + sitemap） | 插件化（内容仍存 SystemSettings，支持工作区覆盖） |

### 4. 后端能力（actions.ts）

```ts
"use server"

import { assertPluginEnabled, getPluginConfig } from "@/lib/plugins/runtime"
import { PluginDisabledError } from "@/lib/plugins/types"
import { PLUGIN_ID, MY_CONFIG_FIELDS } from "./constants"

export async function myAction(data: { /* ... */ }) {
  try {
    await assertPluginEnabled(PLUGIN_ID)   // 插件守卫：禁用时抛出
  } catch (error) {
    if (error instanceof PluginDisabledError) {
      return { success: false, code: "PLUGIN_DISABLED" }
    }
    throw error
  }

  // 读取站长在插件管理页配置的值（自动回退默认值并做边界钳制）
  const config = await getPluginConfig(PLUGIN_ID, MY_CONFIG_FIELDS)

  // ...业务逻辑
}
```

要点：

- **守卫必须**：插件 action 可被客户端直接构造调用，`assertPluginEnabled` 是禁用态的唯一防线
- **错误码化**：action 返回 `code`，文案由客户端按语言映射（参考 site-submission 的 `errors.*`）
- 服务端必须二次校验客户端输入（zod schema 可被绕过）

### 5. 前台注入（header-slot.tsx）

组件无 props，自治获取数据（参考 `plugins/site-submission/header-slot.tsx`：弹窗打开时才拉分类列表）。

### 6. i18n

六语言 `messages/*.json` 增加命名空间 `plugins.<yourPlugin>`，至少包含：

```json
{
  "plugins": {
    "myPlugin": {
      "name": "插件名",
      "description": "插件描述",
      "config": { "someField": "配置项显示名" }
    }
  }
}
```

### 7. 数据库（仅在必要时）

优先复用核心模型（如 Site）。确需新表时：

- `prisma/schema.prisma` 增加模型
- 新增迁移目录 `prisma/migrations/<ts>_<name>/migration.sql`
- `lib/prisma.ts` 内存 mock 层同步（类型、默认值、create/update 支持）

---

## 三、语义约定

1. **禁用 ≠ 删除**：禁用插件后所有业务数据保留，重新启用即恢复
2. **默认禁用**：新部署与存量升级后所有插件默认禁用，由站长按需开启
3. **全局生效**：插件启停为全站级，暂不支持按工作区独立启停
4. **核心零耦合**：核心页面只认注册表与注入点，删除任一插件目录 + 注册表一行即完成下线
