-- 工作区与子域名路由：新增 Workspace / Domain 表，
-- Category 挂载工作区并将 slug 唯一性收敛到工作区内

-- CreateTable
CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "site_name" TEXT,
    "site_description" TEXT,
    "site_logo" TEXT,
    "favicon" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Domain" (
    "id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "workspace_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Domain_host_key" ON "Domain"("host");
CREATE INDEX IF NOT EXISTS "Domain_workspace_id_idx" ON "Domain"("workspace_id");

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 创建默认工作区：展示覆盖项留空，前台回退 SystemSettings，升级后渲染与之前一致
INSERT INTO "Workspace" ("id", "slug", "name", "is_published", "is_default", "order")
VALUES ('ws-default', 'default', '默认工作区', true, true, 0)
ON CONFLICT ("slug") DO NOTHING;

-- Category 增加工作区外键：先可空、回填默认工作区、再收紧为 NOT NULL
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;
UPDATE "Category" SET "workspace_id" = 'ws-default' WHERE "workspace_id" IS NULL;
ALTER TABLE "Category" ALTER COLUMN "workspace_id" SET NOT NULL;

-- slug 唯一性从全局改为工作区内唯一
DROP INDEX IF EXISTS "Category_slug_key";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Category_workspaceid_slug_key" ON "Category"("workspace_id", "slug");
CREATE INDEX IF NOT EXISTS "Category_workspace_id_idx" ON "Category"("workspace_id");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
