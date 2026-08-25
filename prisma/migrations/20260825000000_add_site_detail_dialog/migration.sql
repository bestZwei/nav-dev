-- 站点详情弹窗扩展功能相关 schema 变更

-- CreateEnum
CREATE TYPE "ScreenshotSource" AS ENUM ('URL', 'UPLOAD');

-- AlterTable: Site 新增详情内容列
ALTER TABLE "Site" ADD COLUMN "detail_content" TEXT;
ALTER TABLE "Site" ADD COLUMN "has_detail" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: SystemSettings 新增详情弹窗总开关
ALTER TABLE "SystemSettings" ADD COLUMN "enable_site_detail" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: 站点截图（支持外部 URL 引用与数据库上传两种来源）
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "source" "ScreenshotSource" NOT NULL,
    "url" TEXT,
    "data" TEXT,
    "mimeType" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Screenshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Screenshot_siteId_idx" ON "Screenshot"("siteId");

-- AddForeignKey
ALTER TABLE "Screenshot" ADD CONSTRAINT "Screenshot_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;