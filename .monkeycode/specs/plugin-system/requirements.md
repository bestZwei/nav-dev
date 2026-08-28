# Requirements Document - 插件系统（Plugin System）

Feature Name: plugin-system
Updated: 2026-08-28

## Introduction

为导航系统引入内置插件机制：将可选功能（首个为「网站收录 / 访客投稿」）从核心代码中解耦为可启停的插件单元。站长在管理后台决定启用哪些插件；禁用后前台入口隐藏、后端能力关闭，但存量数据保留。插件系统同时作为后续功能扩展的规范载体，新增功能以插件形式接入，减少对核心代码的修改。

## Glossary

- **插件（Plugin）**：一个自包含的功能模块，包含元数据、前台 UI 注入点、后端能力（server action / API）与配置项，可被站长启用或禁用。
- **插件注册表（Plugin Registry）**：代码中声明的全部可用插件清单及各自元数据，编译期固定。
- **核心（Core）**：与具体插件无关的系统骨架（布局、站点管理、分类管理、设置、i18n 等）。
- **注入点（Injection Slot）**：核心 UI 或流程中预留的挂载位置（如 header 工具区、footer 链接区、管理后台设置页），由启用的插件填充。
- **站长（Admin）**：拥有管理后台权限的用户。
- **访客（Visitor）**：未登录的前台浏览者。
- **投稿（Submission）**：访客通过收录插件提交的网址条目，保存为未发布站点，经站长审核后公开。

## Requirements

### Requirement 1: 插件注册与展示

**User Story:** AS 站长, I want 在管理后台看到所有内置插件及其状态, so that 我能了解站点当前具备哪些可选能力。

#### Acceptance Criteria

1. THE 系统 SHALL 提供「网站收录」内置插件，插件 ID 为 `site-submission`。
2. THE 插件注册表 SHALL 为每个插件声明元数据：ID、显示名称、描述、图标、版本、作者。
3. WHEN 站长打开管理后台的插件管理页，THE 系统 SHALL 展示注册表中全部插件，并标注每个插件的当前启用状态。
4. THE 插件管理页 SHALL 按站长当前语言渲染插件名称与描述。

### Requirement 2: 插件启停控制

**User Story:** AS 站长, I want 启用或禁用任一插件并立即生效, so that 我能按需裁剪站点功能。

#### Acceptance Criteria

1. WHEN 站长切换某插件的启用开关，THE 系统 SHALL 将新状态持久化，并在前台与管理后台的下一次渲染中生效。
2. WHILE 某插件处于禁用状态，THE 前台 SHALL 隐藏该插件注入的全部 UI 入口。
3. WHILE 某插件处于禁用状态，THE 系统 SHALL 拒绝该插件暴露的后端能力（server action 与 API 调用），并返回明确的「功能未启用」响应。
4. IF 站长禁用某插件，THE 系统 SHALL 保留该插件产生的全部存量数据。
5. WHEN 站长重新启用某插件，THE 系统 SHALL 恢复该插件禁用前的完整行为与存量数据展示。
6. WHEN 站长禁用某插件，THE 系统 SHALL 在管理后台对该插件涉及的配置区块与筛选项做对应隐藏或停用处理。
7. WHEN 全新部署或存量系统升级至包含插件系统的版本，THE 系统 SHALL 将所有插件初始化为禁用状态。

### Requirement 3: 网站收录插件（site-submission）功能

**User Story:** AS 访客, I want 向站长投稿网址, so that 优质站点能被收录进导航。

#### Acceptance Criteria

1. WHEN 访客浏览前台且 `site-submission` 插件处于启用状态，THE 前台 header SHALL 展示「网站收录」入口。
2. WHEN 访客通过收录入口提交表单，THE 插件 SHALL 校验站点名称、URL、描述、联系方式（格式与必填规则与现有投稿功能一致），校验通过后保存为未发布的投稿记录。
3. WHEN 访客提交投稿，THE 插件 SHALL 按提交者维度执行每日次数限制，限制阈值由站长在插件配置中设定。
4. IF 当日提交次数达到限制阈值，THE 插件 SHALL 拒绝本次提交并向访客展示明确提示。
5. WHEN 站长在后台站点管理页查看列表，THE 系统 SHALL 展示每条站点的来源（投稿 / 管理员创建）并支持按来源筛选。
6. THE 收录插件的投稿数据 SHALL 复用核心 `Site` 数据模型与后台审核（发布/驳回）流程。

### Requirement 4: 插件扩展规范

**User Story:** AS 贡献者, I want 以插件形式贡献可选功能, so that 功能扩展无需修改核心代码，也无需与其他维护者就「功能去留」达成一致。

#### Acceptance Criteria

1. THE 核心代码 SHALL 通过插件注册表与注入点渲染插件内容，核心模块 SHALL 与任何具体插件解耦。
2. WHEN 新增一个插件，贡献者 SHALL 仅需：在注册表登记元数据、实现插件接口（UI 注入、后端能力、配置项、i18n 文案），核心代码保持不变。
3. THE 插件接口 SHALL 覆盖以下挂载能力：前台 header 注入点、footer 注入点、管理后台设置区块、server action / API 能力声明。
4. WHEN 插件声明了配置项，THE 插件管理页 SHALL 渲染对应配置控件并随启用状态一并持久化。

## 已确认决策

1. 插件化范围：第一期仅「网站收录」一个插件；诗词卡片、访问统计、二级详情弹窗、About 页维持现有开关机制，待架构验证后再评估迁移。
2. 默认状态：全新部署与存量升级后，收录插件均为默认禁用；站长需在插件管理页主动启用（升级说明随版本发布文档给出）。
3. 启停层级：插件仅支持全局启停，按工作区独立启停留作后续演进。
