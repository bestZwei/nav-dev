-- 页面动效总开关：开启后全站具备丝滑动画效果，关闭后所有动效被禁用
ALTER TABLE "SystemSettings" ADD COLUMN IF NOT EXISTS "enable_animations" BOOLEAN NOT NULL DEFAULT true;
