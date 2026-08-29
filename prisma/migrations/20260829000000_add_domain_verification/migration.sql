-- 工作区域名反向探测：记录最近一次探测结果（渲染工作区正确性）
ALTER TABLE "Domain" ADD COLUMN "last_verified_status" TEXT;
ALTER TABLE "Domain" ADD COLUMN "last_verified_at" TIMESTAMP(3);
