-- 修正历史迁移与 schema @map 声明的列名漂移：
-- init 迁移建列用了驼峰（"iconUrl"/"mimeType"），而 schema 声明 @map("icon_url")/@map("mime_type")，
-- 导致 migrate deploy 建出的库被 Prisma 判为缺列（P2022）。
-- 幂等设计：列已为蛇形（如 db push / baseline 建的库）时跳过 rename，任何状态可安全执行。

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Site' AND column_name = 'iconUrl'
  ) THEN
    ALTER TABLE "Site" RENAME COLUMN "iconUrl" TO "icon_url";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Screenshot' AND column_name = 'mimeType'
  ) THEN
    ALTER TABLE "Screenshot" RENAME COLUMN "mimeType" TO "mime_type";
  END IF;
END $$;

-- schema 未声明 submitterIp 索引，删除历史迁移误建的两个同名索引
DROP INDEX IF EXISTS "site_submitter_ip_idx";
DROP INDEX IF EXISTS "Site_submitter_ip_idx";
