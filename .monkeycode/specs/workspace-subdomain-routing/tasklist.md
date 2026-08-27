# Task List: 工作区与子域名路由

## 1. 数据层

- [x] 1.1 Prisma schema：新增 Workspace / Domain 模型；Category 增加 workspaceId + (workspaceId, slug) 复合唯一
- [x] 1.2 手写迁移 SQL（建表、默认工作区、存量挂载、约束替换）
- [x] 1.3 InMemoryDatabase（内存模式）：Workspace/Domain 存储与方法、Category workspaceId 支持、默认工作区初始化
- [x] 1.4 prisma/seed.ts 增加默认工作区

## 2. 核心库与中间件

- [x] 2.1 lib/workspace.ts：normalizeHost / getCurrentWorkspace（React cache）/ getAdminWorkspace（Cookie）
- [x] 2.2 middleware.ts：matcher 扩大、Host 提取注入 x-workspace-host、开发模式 __workspace 参数注入

## 3. Server Actions（lib/actions.ts）

- [x] 3.1 前台查询按工作区过滤：getCategories / getAllCategories / getSites / getCategoryBySlug / searchSites
- [x] 3.2 后台查询按 admin cookie 过滤：getCategoriesWithPagination / getSitesWithPagination / getCategoriesForFilter / getSiteIdsForHealthCheck
- [x] 3.3 createCategory 归属后台工作区；slug 查重改工作区内
- [x] 3.4 新增 Workspace CRUD / 域名绑定 / 设默认 Actions
- [x] 3.5 exportData 支持 workspace / full 两种模式；importData 识别全量格式并按工作区导入；importBookmarks 归属当前工作区

## 4. 前台

- [x] 4.1 app/layout.tsx generateMetadata 按工作区覆盖标题/描述/Favicon
- [x] 4.2 api/settings/route.ts 返回工作区覆盖后的展示项
- [x] 4.3 sitemap.ts / robots.ts 按当前 Host 与工作区输出
- [x] 4.4 前台页面 siteName/siteLogo 传工作区覆盖值

## 5. 管理后台

- [x] 5.1 /admin/workspaces 管理页（列表、创建/编辑、域名管理、发布开关、设默认）
- [x] 5.2 顶栏工作区切换器（admin_workspace_id Cookie）
- [x] 5.3 侧边栏 / 顶栏标题加入工作区入口

## 6. i18n 与收尾

- [x] 6.1 messages 五语言词条补充
- [x] 6.2 Prisma client 生成、构建验证、功能自测
- [x] 6.3 启动预览供用户验收
