# Implementation Plan - 插件系统（Plugin System）

Feature Name: plugin-system
Updated: 2026-08-28

前提：PR #9（About 页、拼音搜索、移除核心投稿功能）已合并至 main。本任务清单在其基础上实施插件系统，将网站收录功能以内置插件形式恢复。

## Tasks

- [x] 1. 数据层
  - [x] 1.1 prisma/schema.prisma：SystemSettings 新增 `enabledPlugins`、`pluginConfigs`（Json）；新增 `Plugin` 模型（manifest/enabled/configs）；Site 恢复 `submitterContact`、`submitterIp`（注释标明归属 site-submission 插件）
  - [x] 1.2 新增迁移 `prisma/migrations/20260829000000_plugin_system/migration.sql`
  - [x] 1.3 lib/prisma.ts 内存 mock 层同步：类型、默认值、plugin 表适配、site.create / update / findMany 对新字段的支持
- [x] 2. 插件框架 lib/plugins
  - [x] 2.1 types.ts：PluginDefinition / PluginConfigField / MergedPlugin / Manifest 类型
  - [x] 2.2 manifest-schema.ts：上传插件 manifest 的 zod 校验（ID 格式、内置 ID 冲突、URL 协议白名单、大小限制）
  - [x] 2.3 server.ts：getMergedPlugins（双源合并）/ isPluginEnabled / assertPluginEnabled / getPluginConfig / setPluginEnabled / updatePluginConfig / uploadPluginManifest / deleteUploadedPlugin（server actions）
  - [x] 2.4 registry.ts：内置插件清单（登记 site-submission，dev 断言 ID 唯一）
  - [x] 2.5 client.tsx：PluginHeaderSlot / PluginFooterSlot 注入点（"use client"）+ ManifestPluginRenderer（button / link / iframe / markdown 四形态，iframe 沙箱）
- [x] 3. site-submission 插件
  - [x] 3.1 plugins/site-submission/：constants.ts、actions.ts（自历史版本迁移 submitSite，改用插件守卫与插件配置读取限额；投稿成功触发 webhooks.siteSubmitted）
  - [x] 3.2 header-slot.tsx（自 components/layout/site-submission-dialog.tsx 历史 263 行版本迁移并适配）
  - [x] 3.3 index.ts：插件定义（元数据 + configFields + headerSlot + serverActionIds）
- [x] 4. 核心接入
  - [x] 4.1 client-settings.ts：PublicSettings 增加 enabledPlugins 下发通道；api/settings 路由透出
  - [x] 4.2 components/layout/header.tsx：原收录按钮位置替换为 PluginHeaderSlot
  - [x] 4.3 app/admin/(dash)/sites/page.tsx：恢复「来源」列与提交者筛选，按插件启用状态条件渲染
  - [x] 4.4 lib/actions.ts：getSites 返回字段恢复 submitter 字段
- [x] 5. 管理后台
  - [x] 5.1 app/admin/(dash)/plugins/page.tsx：合并视图插件卡片列表 + 启用开关 + 配置项表单 + 上传插件区 + 上传插件删除
  - [x] 5.2 admin-sidebar.tsx 新增「插件管理」导航项；admin-header.tsx 页面标题映射
- [x] 6. i18n
  - [x] 6.1 messages/{zh,en,ja,ko,fr,de}.json：plugins 命名空间文案；恢复投稿流程文案
- [x] 7. 验证
  - [x] 7.1 tsc/next build 通过
  - [ ] 7.2 手动验收清单（启停即时生效、禁用后无入口、数据保留、manifest 上传校验与沙箱渲染）
