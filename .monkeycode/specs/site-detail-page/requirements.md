# Requirements Document: 站点详情弹窗（二级跳转介绍）

Feature Name: site-detail-page
Created: 2026-08-25
Updated: 2026-08-25
Status: Confirmed（关键决策已确认，待最终评审）

## Introduction

为导航站增加"站点详情"扩展功能：开启后，前台点击站点卡片弹出详情弹窗，展示该站点的 Markdown 图文介绍（含截图、使用方法等），访客再从弹窗内"访问网站"按钮跳转目标网站。管理员可在后台全局开启/关闭该功能，并可编辑每个站点的详情内容。功能关闭时，一切保持现状（直接外链跳转）。

## Glossary

- **站点详情弹窗（Site Detail Dialog）**: 前台点击站点卡片后弹出的模态弹窗，展示单个站点的图文介绍内容。
- **直接外链跳转（现状行为）**: 点击站点卡片在新窗口打开目标网站 URL。
- **全局开关（enableSiteDetail）**: SystemSettings 中的配置项，控制详情弹窗功能整体启停。
- **站点详情内容（detailContent）**: 站点的 Markdown 富文本介绍，可包含文字说明与使用方法。
- **截图（Screenshots）**: 站点详情配图，支持多张，来源为外部图片 URL 或数据库上传。
- **数据库截图上传**: 将图片文件以 base64 形式存入 PostgreSQL 的上传方式。
- **上传能力检测**: 系统对当前运行环境是否支持数据库截图上传的探测机制。

## Confirmed Decisions

1. 详情展示形式采用**弹窗（Dialog）**，不使用独立 `/site/{id}` 路由。
2. 详情内容采用 **Markdown 富文本**编辑（含 XSS 安全渲染）。
3. 截图支持 **URL 引用 + 数据库上传**双方式；环境能力检测判定数据库上传可用性，检测失败时管理界面仅保留 URL 方式。
4. 弹窗内"访问网站"点击**计入**现有 Visit 访问统计。

## Requirements

### Requirement 1: 详情弹窗功能全局开关

**User Story:** AS 管理员, I want 在后台开启或关闭站点详情弹窗功能, so that 我可以按需启用该扩展能力。

#### Acceptance Criteria

1. The system SHALL 在 SystemSettings 中提供 `enableSiteDetail` 配置项，默认值为关闭（false）。
2. WHILE `enableSiteDetail` 为关闭, the system SHALL 保持现状行为：前台点击站点卡片在新窗口直接打开目标网站 URL，管理后台隐藏详情内容相关编辑入口。
3. WHILE `enableSiteDetail` 为开启, the system SHALL 使填写了详情内容的站点在点击卡片后打开详情弹窗，并使管理后台展示详情内容编辑入口。
4. WHEN 管理员在后台修改开关状态并保存, the system SHALL 立即生效于后续的前台页面加载，无需重新部署。
5. The system SHALL 在管理后台设置页展示该开关，附带功能说明文案（6 种语言）。

### Requirement 2: 前台站点详情弹窗

**User Story:** AS 访客, I want 点击站点卡片先看到该站点的介绍、截图和使用方法, so that 我在跳转前能了解这个工具是否满足我的需求。

#### Acceptance Criteria

1. WHILE 全局开关开启且站点已填写详情内容, WHEN 访客点击站点卡片, the system SHALL 打开该站点的详情弹窗（当前页内模态展示，无路由跳转）。
2. The system SHALL 在弹窗中展示：站点图标、名称、所属分类、目标 URL、现有简介描述。
3. The system SHALL 在弹窗中安全渲染 Markdown 详情内容（支持标题、列表、链接、图片、代码块、表格等 GFM 语法），并防范 XSS 注入。
4. The system SHALL 在弹窗中展示站点截图画廊（多张缩略图，点击放大查看，支持键盘 Esc 关闭）。
5. The system SHALL 在弹窗中提供醒目的"访问网站"按钮，点击后在新窗口打开目标 URL 并通过现有 `/api/visit` 记录访问统计。
6. WHEN 访客点击弹窗外部遮罩、关闭按钮或按 Esc 键, the system SHALL 关闭弹窗且不发生页面跳转。
7. The system SHALL 保证弹窗在移动端与桌面端均有良好的响应式布局（移动端适配全屏或底部抽屉）。
8. The system SHALL 提供弹窗所有 UI 文案的 6 语言国际化支持（zh/en/ja/ko/fr/de）。
9. WHILE 全局开关开启且站点未填写详情内容, WHEN 访客点击站点卡片, the system SHALL 在新窗口直接打开目标网站 URL（降级为现状行为）。

### Requirement 3: 管理后台详情内容编辑

**User Story:** AS 管理员, I want 在后台站点编辑表单中维护站点的 Markdown 介绍和截图, so that 我可以控制每个站点弹窗展示的内容。

#### Acceptance Criteria

1. WHILE `enableSiteDetail` 为开启, the system SHALL 在站点编辑表单中展示详情内容编辑区（Markdown 编辑器 + 截图管理）；WHILE 为关闭, the system SHALL 隐藏该编辑区。
2. The Markdown 编辑器 SHALL 支持实时预览或分屏预览，帮助管理员确认渲染效果。
3. WHEN 管理员保存站点编辑, the system SHALL 校验并持久化 Markdown 内容与截图列表，前台弹窗正确展示。
4. IF 管理员清空详情内容（Markdown 为空且截图为空）并保存, the system SHALL 使该站点恢复直接外链跳转行为。
5. WHEN 详情编辑区展示时, the system SHALL 提示"留空则该站点保持直接跳转"的说明文案。

### Requirement 4: 截图管理（URL 引用 + 数据库上传）

**User Story:** AS 管理员, I want 通过 URL 引用或文件上传为站点配置截图, so that 我能灵活地配图而不受单一来源限制。

#### Acceptance Criteria

1. The system SHALL 支持管理员通过输入图片 URL 添加截图（所有环境可用）。
2. WHILE 上传能力检测通过, the system SHALL 支持管理员通过本地文件选择上传截图，图片以 base64 存入 PostgreSQL。
3. WHILE 上传能力检测失败, the system SHALL 在管理界面禁用本地上传入口并展示原因提示，仅保留 URL 添加方式。
4. The system SHALL 支持为单个站点管理多张截图：添加、删除、拖拽或按钮调整顺序。
5. The system SHALL 限制上传文件类型为图片（png/jpg/jpeg/webp/gif/avif）且单张大小不超过 2MB。
6. The system SHALL 通过 API 端点提供数据库截图的读取服务（带缓存头），供前台弹窗展示。
7. IF 某张截图加载失败, the system SHALL 在画廊中展示占位样式，不影响其余内容渲染。
8. WHEN 管理员删除站点或替换截图, the system SHALL 删除或更新对应数据库记录，避免残留孤儿数据。

### Requirement 5: 数据导入导出兼容

**User Story:** AS 管理员, I want 现有的数据导入导出功能包含详情内容与截图, so that 我可以完整迁移站点数据。

#### Acceptance Criteria

1. The system SHALL 在现有数据导出（JSON）中包含每个站点的 detailContent 与 URL 引用类截图数据。
2. The system SHALL 在数据导入时还原 detailContent 与截图列表。
3. 导入的数据库上传类截图数据（如存在）SHALL 一并迁移或明确降级策略（导入时保留 base64 数据）。

## Out of Scope

- 独立的 `/site/{id}` 详情路由与对应 SEO 优化（已确认采用弹窗形式）。
- 详情弹窗的 URL 分享直达（如 `?site=xxx` 参数打开弹窗）。
- 截图的在线裁剪、标注等编辑能力。
- 访客端的详情内容多语言分版本维护（Markdown 内容为管理员填写的单一版本）。
