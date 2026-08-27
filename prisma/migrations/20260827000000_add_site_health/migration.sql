-- AlterTable: 站点测活（健康检测）字段
ALTER TABLE "Site" ADD COLUMN "health_status" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "Site" ADD COLUMN "last_http_status" INTEGER;
ALTER TABLE "Site" ADD COLUMN "latency_ms" INTEGER;
ALTER TABLE "Site" ADD COLUMN "last_checked_at" TIMESTAMP(3);
