# 需求实施计划：i18n 国际化支持

对应设计文档：`.monkeycode/specs/i18n-support/design.md`

- [x] 1. 搭建 next-intl 基础设施（对应设计 §Components 1、R7）
  - [x] 1.1 安装 next-intl 依赖，`next.config.js` 接入 `createNextIntlPlugin`
  - [x] 1.2 新增 `i18n/request.ts`：实现解析链 Cookie(NEXT_LOCALE) > SystemSettings.defaultLanguage > zh，`getSystemSettings` 异常时捕获回退 zh
  - [x] 1.3 新增 `messages/zh.json` 与 `messages/en.json` 骨架（common 命名空间），新增 `types/i18n.d.ts` 类型增强，确保 key 拼写编译期校验
  - [x] 1.4 改造 `app/layout.tsx`：`<html lang>` 动态输出（zh-CN/en），body 内包裹 `NextIntlClientProvider`

- [x] 2. 数据层新增全局默认语言字段（对应设计 §Components 4、R3）
  - [x] 2.1 `prisma/schema.prisma` SystemSettings 增加 `defaultLanguage String @default("zh")`，执行 `db:push` 迁移
  - [x] 2.2 `lib/prisma.ts`：SystemSettingsItem 接口与 initialSystemSettings 增加 defaultLanguage
  - [x] 2.3 `lib/client-settings.ts`：PublicSettings 与 defaultSettings 增加 defaultLanguage；`app/api/settings/route.ts` 确认响应携带该字段
  - [x] 2.4 `lib/actions.ts`：updateSystemSettings 参数增加 defaultLanguage 并加 zod enum(["zh","en"]) 校验

- [x] 3. 语言切换组件与挂载（对应设计 §Components 3、R2/R5-AC4）
  - [x] 3.1 新增 `components/locale-toggle.tsx`：交互对齐 ThemeToggle（ghost icon button + Tooltip + toast），写 Cookie(max-age 1 年) 后 `router.refresh()`
  - [x] 3.2 挂载到前台 `components/layout/header.tsx` 主题切换旁（含移动端布局适配）
  - [x] 3.3 挂载到后台 `components/admin/admin-header.tsx`

- [x] 4. 前台公共页面文案迁移（对应设计 §Components 5、R4/R6）
  - [x] 4.1 `components/theme-toggle.tsx`、`components/card-density-toggle.tsx`、`components/poetry-toggle.tsx` 迁移至消息 key
  - [x] 4.2 `components/layout/header.tsx`、`site-card.tsx`、`scroll-header.tsx` 及 layout 目录其余组件迁移（搜索 placeholder、分类抽屉、置顶/复制提示、暂无描述等）
  - [x] 4.3 前台页面组件：`app/(public)/page.tsx`、`category/[slug]/page.tsx`、`search/page.tsx`、`app/not-found.tsx`、footer 相关（含 ICP 文案）
  - [x] 4.4 `app/layout.tsx` generateMetadata：description 兜底文案按 locale 输出（管理员自定义值优先）

- [x] 5. 后台管理界面文案迁移（对应设计 §Components 5、R5）
  - [x] 5.1 `components/admin/admin-sidebar.tsx`（菜单项）、`admin-header.tsx`（页面标题映射改 key）
  - [x] 5.2 `app/admin/login/page.tsx` 登录页（无 Cookie 时跟随全局默认）
  - [x] 5.3 `app/admin/dashboard/page.tsx` 与 `components/admin/charts/*`（星期/日期/N 次等单位词用消息插值）
  - [x] 5.4 `app/admin/sites/page.tsx` 与 `site-form-dialog.tsx`、`import-bookmarks-dialog.tsx`（筛选、表格、toast、分页）
  - [x] 5.5 `app/admin/categories/page.tsx` 与 `category-form-dialog.tsx`、`category-icon-picker.tsx`
  - [x] 5.6 `app/admin/data/page.tsx`（导入/导出界面）
  - [x] 5.7 `app/admin/users/page.tsx` 系统设置页：存量文案迁移 + 新增「默认语言」Select 控件（中文/English，保存走现有 action）；`user-edit-dialog.tsx`、`password-change-dialog.tsx`、`admin-avatar.tsx` 迁移

- [x] 6. 检查点 - 构建与质量验证（对应设计 §Test Strategy）
  - 确认所有测试通过,如有疑问请询问用户
  - [x] 6.1 `npm run lint` 通过
  - [x] 6.2 `npm run build` 通过（含消息 key 类型校验）
  - [x] 6.3 校验 `zh.json` 与 `en.json` key 集一致性（脚本比对，缺失 key 补齐）

- [x] 7. 预览部署验证
  - [x] 7.1 启动开发服务器，验证语言解析链、前后台切换、默认语言配置生效（手动验证矩阵）
