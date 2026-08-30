-- 插件系统：SystemSettings 挂载插件启停状态与配置；
-- 恢复网站收录插件（site-submission）的投稿者字段（PR #9 移除核心投稿功能时删除，随插件化回归）。
-- 所有 DROP 均带 IF EXISTS，兼容「未合并 PR #9 的库」与「已合并的库」两种基线。
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "submitter_contact" TEXT;
ALTER TABLE "Site" ADD COLUMN IF NOT EXISTS "submitter_ip" TEXT;

ALTER TABLE "SystemSettings" ADD COLUMN "enabled_plugins" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "SystemSettings" ADD COLUMN "plugin_configs" JSONB NOT NULL DEFAULT '{}';

-- 上传插件表：manifest 为校验通过的声明式清单（零代码执行）
CREATE TABLE "Plugin" (
    "id" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configs" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plugin_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "enable_submission";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "submission_max_per_day";

-- 功能开关插件化：访问统计 / 详情弹窗 / 诗词卡片 / 关于页面改由内置插件启停（enabledPlugins）
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "enable_visit_tracking";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "enable_site_detail";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "enable_poetry";
ALTER TABLE "SystemSettings" DROP COLUMN IF EXISTS "enable_about_page";
