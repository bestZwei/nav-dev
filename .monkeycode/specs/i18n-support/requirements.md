# Requirements Document: i18n 国际化支持

## Introduction

为 Conan Nav（Next.js 15 网址导航系统）提供中英文双语国际化能力，覆盖前台公共页面与后台管理界面。语言切换基于 Cookie 实现（URL 保持干净，无 /en、/zh 路径前缀），管理员可在系统设置中配置站点全局默认语言。

## Glossary

- **语言环境 (Locale)**: 一次会话中界面文案使用的语言，取值为 `zh`（简体中文）或 `en`（英文）。
- **语言偏好 Cookie**: 存储访客个人语言选择的 Cookie（`NEXT_LOCALE`），优先级最高。
- **全局默认语言**: 管理员在系统设置中配置的站点级默认语言，作用于未设置语言偏好的访客。
- **界面文案 (UI Strings)**: 代码中硬编码的界面文字（按钮、标题、提示语等），区别于数据库中的业务内容。
- **业务内容 (Content Data)**: 管理员录入的网站名称、描述、分类名称等数据，随录入原样展示，不参与翻译。

## Requirements

### Requirement 1: 语言环境解析

**User Story:** AS 访客，我希望系统自动为我呈现合适的语言，以便无需手动操作即可阅读界面。

#### Acceptance Criteria

1. WHEN 请求到达服务端，THE 系统 SHALL 按以下优先级解析语言环境：语言偏好 Cookie > 全局默认语言设置 > 兜底语言 `zh`。
2. WHEN 语言偏好 Cookie 的值不是受支持的语言（`zh` 或 `en`），THE 系统 SHALL 忽略该值并按全局默认语言 > 兜底语言 `zh` 的顺序解析。
3. WHILE 语言环境已解析确定，THE 系统 SHALL 在 `<html lang>` 属性中输出对应语言标签（`zh-CN` 或 `en`）。

### Requirement 2: 访客语言切换

**User Story:** AS 访客，我希望在前台一键切换中英文，以便按我的阅读习惯浏览。

#### Acceptance Criteria

1. WHEN 访客点击前台语言切换控件并选择目标语言，THE 系统 SHALL 将该语言写入语言偏好 Cookie 并在当前页面立即生效，无需刷新。
2. WHEN 持有语言偏好 Cookie 的访客再次访问站点任意页面，THE 系统 SHALL 按其 Cookie 偏好渲染界面。
3. WHEN 访客切换语言，THE 系统 SHALL 保持当前所在页面与路由地址不变。

### Requirement 3: 管理员全局默认语言配置

**User Story:** AS 管理员，我希望在后台系统设置中配置站点默认语言，以便控制未设置偏好的访客看到的语言。

#### Acceptance Criteria

1. WHEN 管理员在系统设置中保存默认语言，THE 系统 SHALL 持久化该配置并立即应用于后续无 Cookie 偏好访客的请求。
2. IF 访客已持有语言偏好 Cookie，WHEN 管理员修改全局默认语言，THE 系统 SHALL 继续按访客 Cookie 偏好渲染，覆盖全局默认值。
3. WHEN 首次初始化系统且管理员从未配置默认语言，THE 系统 SHALL 使用 `zh` 作为默认值。

### Requirement 4: 前台界面文案国际化

**User Story:** AS 访客，我希望前台所有界面文案跟随语言环境切换，以便获得完整的母语浏览体验。

#### Acceptance Criteria

1. WHILE 语言环境为 `zh`，THE 系统 SHALL 以中文呈现前台公共页面（首页、分类页、搜索页、404 页）的全部界面文案。
2. WHILE 语言环境为 `en`，THE 系统 SHALL 以英文呈现前台公共页面的全部界面文案。
3. WHEN 任一界面文案在当前语言包中缺失，THE 系统 SHALL 回退显示兜底语言（`zh`）的对应文案。
4. WHEN 业务内容（网站名称、描述、分类名称、诗词）来自数据库或第三方接口，THE 系统 SHALL 原样展示录入内容，不做机器翻译。

### Requirement 5: 后台管理界面文案国际化

**User Story:** AS 管理员，我希望后台管理界面同样支持中英文切换，以便非中文用户也能顺畅管理站点。

#### Acceptance Criteria

1. WHILE 语言环境为 `zh`，THE 系统 SHALL 以中文呈现后台全部页面（登录、仪表盘、网站/分类/数据管理、系统设置）的界面文案。
2. WHILE 语言环境为 `en`，THE 系统 SHALL 以英文呈现后台全部页面的界面文案。
3. WHEN 后台发生操作反馈（toast 提示、表单校验、确认对话框），THE 系统 SHALL 按当前语言环境输出对应文案。
4. WHEN 管理员在后台切换语言，THE 系统 SHALL 与前台共用同一语言偏好 Cookie，保持前后台语言一致。

### Requirement 6: 文档元数据本地化

**User Story:** AS 访客/搜索引擎，我希望页面元数据跟随语言环境，以便搜索结果摘要呈现正确语言。

#### Acceptance Criteria

1. WHEN 页面元数据（title/description）含界面文案部分，THE 系统 SHALL 按当前语言环境输出对应语言的文案。
2. WHEN 系统设置中存在管理员自定义的站点名称与描述，THE 系统 SHALL 优先使用管理员配置值，界面文案兜底部分按语言环境输出。

### Requirement 7: 语言包工程化

**User Story:** AS 开发者，我希望语言包结构清晰、类型安全，以便持续维护和扩展新语言。

#### Acceptance Criteria

1. THE 系统 SHALL 为每种受支持语言维护独立的消息文件，并按前台/后台命名空间组织。
2. WHEN 消息文件中引用的 key 在代码中使用，THE 系统 SHALL 在构建阶段提供类型校验（缺失 key 可被检测）。
3. WHEN 需要新增第三种语言，THE 系统 SHALL 仅通过新增一个消息文件与语言注册项完成扩展，无需修改业务组件。
