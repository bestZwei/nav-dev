-- 自定义代码注入：全局头部/尾部注入代码（管理员配置，全站 SSR 直出）
-- IF NOT EXISTS：PR #11 合并期间此迁移缺失，部分部署经 entrypoint 的
-- db push 兜底已加列且无迁移记录，重放时不因列已存在而失败
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "custom_head_code" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "custom_body_code" TEXT;
