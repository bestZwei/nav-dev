-- 自定义代码注入：全局头部/尾部注入代码（管理员配置，全站 SSR 直出）
ALTER TABLE "SystemSettings" ADD COLUMN "custom_head_code" TEXT;
ALTER TABLE "SystemSettings" ADD COLUMN "custom_body_code" TEXT;
