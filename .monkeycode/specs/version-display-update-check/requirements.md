# Requirements Document: 版本号显示与更新检查

## Introduction

本功能为 Conan Nav 导航站提供运行版本的可视化展示与新版本检查能力。项目当前通过 GitHub tag（`v*.*.*`）触发 Docker 镜像构建并发布到 ghcr.io，但版本信息仅存在于镜像标签与 OCI label 中，应用内部与管理界面均无法感知当前运行版本，运维人员也缺乏发现新版本的途径。

本功能将：
1. 在镜像构建阶段把 tag 版本号注入应用（构建参数 + 环境变量），使运行实例携带版本标识；
2. 在管理后台展示当前版本号，并在检测到 GitHub 上存在更新的 Release 时给出升级提示；
3. 提供版本查询 API，便于容器编排与监控平台探活时获取版本。

## Glossary

- **当前版本（Current Version）**: 当前运行实例内置的版本号，来源于构建时的 Git tag，格式为 `vX.Y.Z`（语义化版本）。
- **最新版本（Latest Version）**: GitHub 仓库最新发布的 Release 版本号，通过 GitHub API 查询获得。
- **更新检查（Update Check）**: 将当前版本与最新版本进行语义化版本比较，判断是否存在新版本的过程。
- **OCI Label**: 容器镜像的元数据标签，CI 已写入 `org.opencontainers.image.version`。
- **无数据库模式**: 未配置 `DATABASE_URL` 时以内存数据运行的降级模式。

## Requirements

### Requirement 1: 构建时版本注入

**User Story:** AS 项目维护者, I want 版本号在镜像构建时自动注入应用, so that 每个运行实例都能准确报告自己的版本。

#### Acceptance Criteria

1. WHEN GitHub Actions 因 `v*.*.*` tag 推送触发镜像构建, the CI SHALL 提取 tag 版本号并通过构建参数传递给 Dockerfile。
2. WHEN Docker 镜像构建完成, the 镜像内的应用 SHALL 在运行时通过环境变量读取到与触发 tag 一致的版本号。
3. WHEN 应用在本地开发环境（`npm run dev`）运行且版本环境变量缺失, the 应用 SHALL 以 `dev` 作为版本标识正常启动。
4. WHEN 版本环境变量存在, the 应用 SHALL 在无需数据库连接的情况下提供该版本号（版本能力 SHALL 独立于数据库可用性）。

### Requirement 2: 管理后台版本号显示

**User Story:** AS 管理员, I want 在管理后台看到当前运行版本, so that 我能确认部署的镜像版本与排查问题时提供版本信息。

#### Acceptance Criteria

1. WHILE 管理员已登录管理后台, the 系统 SHALL 在管理界面常驻区域（侧边栏底部）展示当前版本号。
2. WHEN 版本号为 `dev` 标识, the 系统 SHALL 以可区分的样式展示开发版标识。
3. WHEN 管理员查看版本展示区, the 系统 SHALL 提供跳转到项目 GitHub 仓库的链接。

### Requirement 3: 更新检查

**User Story:** AS 管理员, I want 系统自动检查 GitHub 上的最新 Release, so that 我能及时得知有新版本可升级。

#### Acceptance Criteria

1. WHEN 管理员访问管理后台, the 系统 SHALL 在后台自动向 GitHub API 查询最新版本（服务端代理请求，优先最新 Release，仓库无 Release 时回退为 tags 中语义化版本最大者）。
2. WHEN 最新版本高于当前版本, the 系统 SHALL 在管理后台展示新版本提示，包含新版本号与跳转到 Release 页面的链接。
3. WHEN 最新版本低于或等于当前版本, the 系统 SHALL 展示"已是最新"状态。
4. WHEN 当前版本为 `dev` 标识, the 系统 SHALL 跳过版本比较并展示提示信息。
5. WHEN GitHub API 请求失败（网络超时、限流、仓库不可达）, the 系统 SHALL 静默降级为"版本检查不可用"状态且 SHALL 保持管理后台其他功能正常。
6. WHEN 更新检查 API 被调用, the 系统 SHALL 对 GitHub API 请求设置超时（不超过 5 秒）并复用短期缓存结果（缓存有效期不超过 10 分钟），避免每次页面加载都触发外部请求。

### Requirement 4: 版本查询 API

**User Story:** AS 运维人员, I want 通过 HTTP API 获取当前版本号, so that 监控与编排系统能程序化获取版本信息。

#### Acceptance Criteria

1. WHEN 任意客户端请求版本 API, the 系统 SHALL 返回当前版本号、是否为开发版本标识及提交哈希（若构建时提供）。
2. WHEN 数据库不可用, the 版本 API SHALL 依然正常响应版本信息。

### Requirement 5: 国际化支持

**User Story:** AS 非中文用户, I want 版本与更新提示以我使用的语言显示, so that 我能理解版本状态。

#### Acceptance Criteria

1. WHEN 用户切换到任一支持的语言（zh/en/ja/ko/de/fr）, the 系统 SHALL 以对应语言展示版本相关文案（当前版本、已是最新、发现新版本、检查不可用）。

## 已确认决策

1. 版本号仅管理后台展示（侧边栏底部），前台保持简洁。
2. 更新检查固定对比上游仓库 `kenanlabs/nav` 的最新 Release，fork 部署也能获知上游更新。
3. 新版本提示展示新版本号并提供跳转 GitHub Release 页面的链接，不内嵌 Release Notes。
