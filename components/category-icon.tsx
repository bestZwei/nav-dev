import React from "react"
import * as LucideIcons from "lucide-react"
import { Folder } from "lucide-react"

// Popular Lucide icons that can be selected for categories
export const POPULAR_CATEGORY_ICONS = [
  { name: "Wrench", label: "工具 / 实用", category: "常用" },
  { name: "Code", label: "开发 / 编程", category: "开发" },
  { name: "Palette", label: "设计 / 艺术", category: "设计" },
  { name: "GraduationCap", label: "学习 / 教育", category: "学习" },
  { name: "Bot", label: "AI / 智能", category: "AI" },
  { name: "Cloud", label: "云服务 / 存储", category: "云服务" },
  { name: "Users", label: "社区 / 论坛", category: "社区" },
  { name: "BookOpen", label: "文档 / 知识", category: "文档" },
  { name: "Briefcase", label: "办公 / 生产力", category: "办公" },
  { name: "Gamepad2", label: "娱乐 / 游戏", category: "娱乐" },
  { name: "Globe", label: "网络 / 综合", category: "常用" },
  { name: "Sparkles", label: "灵感 / 推荐", category: "推荐" },
  { name: "Compass", label: "发现 / 探索", category: "常用" },
  { name: "Laptop", label: "科技 / 硬件", category: "开发" },
  { name: "Cpu", label: "芯片 / 算力", category: "开发" },
  { name: "Terminal", label: "终端 / 命令行", category: "开发" },
  { name: "Flame", label: "热门 / 趋势", category: "常用" },
  { name: "Coffee", label: "休闲 / 生活", category: "生活" },
  { name: "Music", label: "音乐 / 音频", category: "娱乐" },
  { name: "Video", label: "视频 / 影音", category: "娱乐" },
  { name: "ShoppingBag", label: "购物 / 电商", category: "生活" },
  { name: "Heart", label: "收藏 / 关注", category: "常用" },
  { name: "Bookmark", label: "书签 / 导航", category: "常用" },
  { name: "Layers", label: "资源 / 架构", category: "设计" },
  { name: "Star", label: "精选 / 优质", category: "常用" },
  { name: "Database", label: "数据库 / 存储", category: "开发" },
  { name: "ShieldCheck", label: "安全 / 隐私", category: "安全" },
  { name: "Zap", label: "效率 / 极速", category: "常用" },
  { name: "Newspaper", label: "资讯 / 新闻", category: "文档" },
  { name: "Folder", label: "分类 / 目录", category: "通用" },
]

interface CategoryIconProps {
  icon?: string | null
  className?: string
  size?: number
}

export function CategoryIcon({ icon, className = "h-4 w-4", size = 16 }: CategoryIconProps) {
  if (!icon) {
    return <Folder className={className} size={size} />
  }

  // Check if icon is an image URL (http, https, data:image, /path)
  if (
    icon.startsWith("http://") ||
    icon.startsWith("https://") ||
    icon.startsWith("data:image/") ||
    icon.startsWith("/")
  ) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt="Category icon"
        className={`${className} object-contain inline-block rounded-sm`}
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
    )
  }

  // Otherwise, match Lucide icon by component name
  const IconComponent = (LucideIcons as Record<string, any>)[icon]

  if (IconComponent && typeof IconComponent === "function") {
    return <IconComponent className={className} size={size} />
  }

  // Default fallback
  return <Folder className={className} size={size} />
}
