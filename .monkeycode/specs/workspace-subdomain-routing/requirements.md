# Requirements Document: 工作区与子域名路由（Workspace & Subdomain Routing）

> 状态：已确认核心决策（2026-08-27）
>
> 已确认决策：
> - OPEN-1 → 精确绑定：后台手动为主机名绑定工作区，匹配以数据库为准
> - OPEN-2 → 完全隔离：每个分类仅归属一个工作区（一对多）
> - OPEN-3 → 仅展示项：工作区只覆盖标题、描述、Logo、Favicon；其余设置全局共享
> - OPEN-4 → 顶栏切换器：后台按工作区上下文过滤数据
> - OPEN-5 → 单管理员：权限模型维持现状
> - OPEN-6 → 按工作区区分：访问统计、网址提交、sitemap 均区分工作区

## Introduction

为导航站引入「工作区（Workspace）」概念：工作区是独立的内容空间，拥有自己的标题、描述、分类和网址，并可绑定一个或多个域名。系统根据请求的 Host 匹配工作区并渲染对应内容；未匹配任何工作区时回退到默认工作区。

## Glossary

- **Workspace（工作区）**: 独立的导航内容空间，包含展示配置（标题/描述/Logo/Favicon）与内容数据（分类、网址）。
- **Domain Binding（域名绑定）**: 工作区与主机名（如 `zh.example.com`）的映射关系。
- **Default Workspace（默认工作区）**: 请求未匹配任何域名绑定时使用的工作区；存量数据迁移后的归属。
- **Host（主机名）**: HTTP 请求的 Host 头去掉端口后的值。

## Requirements

### Requirement 1: 工作区管理

**User Story:** AS 管理员, I want 在后台创建和管理多个工作区, so that 每个工作区可以承载独立的导航内容。

#### Acceptance Criteria

1. The system SHALL 支持创建、编辑、删除工作区（名称、slug、描述、发布状态）。
2. The system SHALL 保证每个工作区有唯一的 slug。
3. The system SHALL 保证系统中恰好存在一个默认工作区（isDefault=true）。
4. WHEN 管理员删除默认工作区, the system SHALL 拒绝该操作并提示错误。
5. WHEN 管理员将另一工作区设为默认, the system SHALL 自动取消原默认工作区的默认标记。
6. 工作区列表与切换器 SHALL 按创建顺序排列（工作区无业务排序概念）。

### Requirement 2: 域名绑定与匹配

**User Story:** AS 管理员, I want 为工作区绑定域名, so that 访问不同子域名时展示不同工作区的内容。

#### Acceptance Criteria

1. The system SHALL 支持为工作区绑定一个或多个完整主机名（如 `zh.example.com`）。
2. The system SHALL 保证一个主机名至多绑定到一个工作区。
3. WHEN 请求到达, the system SHALL 取 Host 头（去端口、转小写）匹配工作区。
4. IF Host 未匹配任何绑定域名, the system SHALL 渲染默认工作区。
5. WHEN 管理员修改域名绑定, the system SHALL 在保存后立即生效（无需重启）。
6. The system SHALL 支持绑定任意主机名（含子域名与裸域名），一个主机名至多绑定一个工作区。
7. The system SHALL 匹配时优先读取 `x-forwarded-host` 请求头，其次读取 `host` 请求头，均去除端口并转为小写。

### Requirement 3: 内容按工作区隔离

**User Story:** AS 访客, I want 在 zh.example.com 只看到中文站的分类和网址, so that 获得聚焦的导航体验。

#### Acceptance Criteria

1. The system SHALL 将每个分类归属到唯一的工作区（Category.workspaceId）。
2. The system SHALL 在前台仅展示当前工作区下已发布的分类与网址。
3. WHEN 访客访问分类页 `/category/[slug]`, the system SHALL 仅在当前工作区范围内解析 slug，未命中时返回 404。
4. WHEN 访客使用搜索, the system SHALL 仅搜索当前工作区的内容。
5. The system SHALL 将分类 slug 的唯一性约束从全局调整为「同一工作区内唯一」，不同工作区可存在同名 slug 的分类。
6. The system SHALL 将网址归属链路定为 Site → Category → Workspace，查询按 Category.workspaceId 过滤。

### Requirement 4: 展示配置按工作区生效

**User Story:** AS 访客, I want 每个子域名站点有独立的标题、描述和图标, so that 各站点有独立的品牌识别。

#### Acceptance Criteria

1. WHEN 访客访问某工作区, the system SHALL 按工作区覆盖项输出页面标题、描述、Favicon（generateMetadata）。
2. IF 工作区未设置某覆盖项, the system SHALL 回退到全局 SystemSettings 对应值。
3. The system SHALL 将工作区覆盖项限定为：标题（siteName）、描述（siteDescription）、Logo、Favicon；其余全局设置对所有工作区生效。
4. The system SHALL 将展示项的唯一编辑入口设为后台「系统设置」页：页面按当前选中工作区读写展示项（默认工作区读写全局 SystemSettings，非默认工作区读写覆盖字段），工作区管理表单仅维护结构信息（名称、slug、描述、发布开关、域名）。
5. The system SHALL 在系统设置页展示当前生效的工作区上下文提示。

### Requirement 5: 管理后台工作区上下文

**User Story:** AS 管理员, I want 在后台切换工作区上下文, so that 可以分别维护各工作区的分类和网址。

#### Acceptance Criteria

1. The system SHALL 在管理后台提供工作区切换器。
2. WHEN 管理员选中某工作区, the system SHALL 使分类管理、网址管理页面仅操作该工作区的数据。
3. 新建分类/网址 SHALL 归属当前选中的工作区。
4. The system SHALL 提供工作区管理页面（创建、编辑、删除、域名绑定、设为默认）。
5. 后台切换器状态 SHALL 在会话内保持（刷新后仍停留在所选工作区）。

### Requirement 6: 存量数据迁移

**User Story:** AS 运维者, I want 升级后现有站点行为保持不变, so that 升级无感知。

#### Acceptance Criteria

1. WHEN 执行数据库迁移, the system SHALL 创建默认工作区并将存量分类/网址归属其中。
2. 未配置任何域名绑定时, 所有请求 SHALL 走默认工作区，行为与升级前一致。

### Requirement 7: 管理员体系

1. The system SHALL 维持单管理员模型，所有管理员可管理全部工作区（含默认工作区）。

### Requirement 8: 周边模块按工作区区分

**User Story:** AS 管理员, I want 统计、提交与 SEO 输出区分工作区, so that 各子站数据互不混淆。

#### Acceptance Criteria

1. The system SHALL 在访问统计（Visit）中记录工作区归属（经 Site → Category → Workspace 推导或冗余字段）。
2. WHEN 访客在非默认工作区提交网址, the system SHALL 将该提交记录归入当前工作区（待审核，不跨区展示）。
3. WHEN 搜索引擎抓取 `sitemap.xml`, the system SHALL 仅输出当前域名对应工作区的分类页 URL。
4. 书签导出与数据导入导出 SHALL 支持两种模式：按当前工作区导出（默认）与全量备份（含工作区结构）。

### Requirement 9: 开发与调试支持

**User Story:** AS 开发者, I want 在无子域名的本地/预览环境查看任意工作区, so that 开发调试不必依赖 DNS。

#### Acceptance Criteria

1. WHILE 运行于开发模式（NODE_ENV=development）, the system SHALL 识别 `?__workspace=<slug>` 查询参数并将其映射为对应工作区。
2. The system SHALL 提供环境变量开关，允许预览环境启用查询参数模拟。
3. 生产环境 SHALL 忽略该查询参数，仅按域名匹配。

### Requirement 10: 未发布工作区行为

**User Story:** AS 管理员, I want 工作区配置完成前对访客不可见, so that 半成品站点不会暴露。

#### Acceptance Criteria

1. WHEN 请求命中的工作区处于未发布状态（isPublished=false）, the system SHALL 渲染默认工作区。
2. The system SHALL 保证新建工作区默认未发布，由管理员显式发布。
