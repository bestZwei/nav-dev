# Implementation Task List: site-detail-page

Feature: 站点详情弹窗（二级跳转介绍）
Design: design.md (2026-08-25)

## Phase 1: 数据层

- [x] 1.1 Prisma schema 扩展：Site.detailContent/hasDetail、Screenshot 模型、ScreenshotSource 枚举、SystemSettings.enableSiteDetail
- [x] 1.2 执行 prisma db push + prisma generate（数据库已就绪，schema 已同步）

## Phase 2: 后端

- [x] 2.1 next.config.js 增加 serverActions.bodySizeLimit: 10mb
- [x] 2.2 actions.ts：createSite/updateSite 扩展 detailContent + screenshots（替换式事务写入 + hasDetail 计算 + zod 校验）
- [x] 2.3 actions.ts：updateSystemSettings 校验增加 enableSiteDetail；公开接口透传
- [x] 2.4 新增 GET /api/sites/[id]/detail（仅已发布站点）
- [x] 2.5 新增 GET /api/screenshots/[id]（图片二进制 + immutable 缓存 + 发布校验）
- [x] 2.6 新增 GET /api/admin/screenshot-capability（数据库写探测 + 60s 缓存 + cookie 校验）
- [x] 2.7 exportData/importData 包含 detailContent/hasDetail/screenshots

## Phase 3: 前台

- [x] 3.1 安装依赖 react-markdown + remark-gfm
- [x] 3.2 MarkdownContent 共享渲染组件（链接 noopener、图片 lazy、加载失败占位、防 XSS）
- [x] 3.3 SiteDetailProvider Context（服务端初值注入 + fetchPublicSettings 回退）
- [x] 3.4 SiteDetailDialog 组件（按需加载详情、截图画廊 + lightbox、访问按钮 visit 统计）
- [x] 3.5 SiteCard 点击行为分支改造；Site 接口增加 hasDetail
- [x] 3.6 SearchableLayout / 首页 / 分类页接入 enableSiteDetail 初值

## Phase 4: 管理后台

- [x] 4.1 admin/users 设置页增加 enableSiteDetail 开关
- [x] 4.2 site-form-dialog 改造：Tabs 布局、Markdown 编辑/预览、截图管理（URL 添加 + 能力检测上传 + 排序删除 + 前端校验）
- [x] 4.3 admin sites 编辑回填详情数据

## Phase 5: i18n 与验证

- [x] 5.1 6 个 messages 文件增加 siteDetail / admin.siteForm / admin.settings 文案
- [x] 5.2 npx tsc --noEmit + npm run lint + npm run build 全绿
- [x] 5.3 冒烟验证：
  - 公开设置 API 返回 enableSiteDetail（默认 false）
  - 详情 API 对无效 ID / 未发布返回 404，对有效已发布返回完整数据
  - 截图 API 对无效 ID 返回 404
  - 能力检测 API 未登录 401、登录返回完整 capability
  - 访问统计 /api/visit 计数正确（0 → 1）
  - 数据导出包含 detailContent 与 screenshots
  - createSite 事务内完成 Site + Screenshot + hasDetail 计算（revalidatePath 之前已提交）
  - 测试数据已清理