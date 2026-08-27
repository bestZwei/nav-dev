-- SystemSettings 新增诗词功能总开关（默认开启，保持既有行为）
ALTER TABLE "SystemSettings" ADD COLUMN "enable_poetry" BOOLEAN NOT NULL DEFAULT true;
