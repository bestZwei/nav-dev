# Waypoint 收录助手

Conan Nav 配套的浏览器扩展（Chrome MV3）：在任意页面一键收录网址到导航站的指定工作区与分类，无需跳转站点操作。

## 功能

- 弹窗一键收录当前页面：自动读取页面标题与描述（og:description / meta description）
- 选择收录目标工作区与分类，收录直接发布
- 「完整 URL / 仅域名」一键切换，默认行为可在设置中配置
- 右键菜单「收录此站点」：打开预填好的确认弹窗（自动带入标题/链接），可修改工作区、分类与描述后直接发布
- 首页 / 后台快捷入口；深浅色跟随系统

## 构建

```bash
pnpm install --ignore-workspace
pnpm build   # tsc 类型检查 + vite 构建，产物在 dist/
```

可选：`node scripts/generate-icons.mjs` 重新由 `public/icons/waypoint.svg` 生成全套尺寸图标。

调试预览：`node node_modules/vite/bin/vite.js preview --port 4173` 后访问
`/preview.html`（内置浏览器可直接打开，chrome API 与收录接口已模拟）。

## 安装

1. Chrome 打开 chrome://extensions，开启「开发者模式」
2. 「加载已解压的扩展程序」选择本目录的 dist/

## 配置

1. 导航站后台「插件管理」启用「浏览器扩展」插件，点击「生成令牌」并复制
2. 扩展选项页填入站点地址与令牌，可用「测试连接」验证
3. 弹窗中选择工作区与分类后即可直接收录

令牌鉴权的收录 API 为 /api/extension（GET 元数据 / POST 收录），
仅在浏览器扩展插件启用且令牌匹配时放行。
