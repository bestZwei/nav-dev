import React from "react"
import * as LucideIcons from "lucide-react"

export interface PopularCategoryIconItem {
  name: string
  label: string
  group: string
  color: string // Tailwind color classes for background, text, border
}

// Popular Lucide icons with rich distinct styles and themes
export const POPULAR_CATEGORY_ICONS: PopularCategoryIconItem[] = [
  // AI & 智能
  { name: "Bot", label: "AI 助手", group: "智能科技", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { name: "Sparkles", label: "灵感推荐", group: "智能科技", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Cpu", label: "模型算力", group: "智能科技", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Brain", label: "深度学习", group: "智能科技", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },

  // 开发 & 编程
  { name: "Code", label: "代码开发", group: "研发编程", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Terminal", label: "终端命令行", group: "研发编程", color: "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20" },
  { name: "Database", label: "数据库", group: "研发编程", color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20" },
  { name: "GitBranch", label: "版本控制", group: "研发编程", color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { name: "Laptop", label: "系统硬件", group: "研发编程", color: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { name: "Boxes", label: "组件框架", group: "研发编程", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },

  // 设计 & 创意
  { name: "Palette", label: "UI 设计", group: "创意设计", color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { name: "Layers", label: "设计资源", group: "创意设计", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { name: "Image", label: "图库壁纸", group: "创意设计", color: "text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20" },
  { name: "PenTool", label: "矢量插画", group: "创意设计", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },

  // 效率 & 工具
  { name: "Wrench", label: "实用工具", group: "办公效率", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { name: "Briefcase", label: "办公协同", group: "办公效率", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "Zap", label: "效率提升", group: "办公效率", color: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Cloud", label: "云盘网盘", group: "办公效率", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" },

  // 学习 & 知识
  { name: "GraduationCap", label: "教育学习", group: "知识教育", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "BookOpen", label: "文档资料", group: "知识教育", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Newspaper", label: "资讯媒体", group: "知识教育", color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20" },

  // 社区 & 社交
  { name: "Users", label: "社区论坛", group: "社交网络", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Globe", label: "综合门户", group: "社交网络", color: "text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "Compass", label: "探索发现", group: "社交网络", color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20" },

  // 娱乐 & 生活
  { name: "Gamepad2", label: "游戏娱乐", group: "生活娱乐", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { name: "Video", label: "影音视频", group: "生活娱乐", color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
  { name: "Music", label: "音乐音频", group: "生活娱乐", color: "text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { name: "Coffee", label: "休闲生活", group: "生活娱乐", color: "text-amber-700 dark:text-amber-500 bg-amber-600/10 border-amber-600/20" },
  { name: "ShoppingBag", label: "电商购物", group: "生活娱乐", color: "text-rose-600 dark:text-rose-400 bg-rose-600/10 border-rose-600/20" },

  // 常用 & 收藏
  { name: "Star", label: "精选收藏", group: "常用收藏", color: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Heart", label: "特别关注", group: "常用收藏", color: "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20" },
  { name: "Bookmark", label: "常用导航", group: "常用收藏", color: "text-cyan-600 dark:text-cyan-400 bg-cyan-600/10 border-cyan-600/20" },
  { name: "ShieldCheck", label: "安全隐私", group: "常用收藏", color: "text-green-600 dark:text-green-400 bg-green-600/10 border-green-600/20" },
  { name: "Flame", label: "热门榜单", group: "常用收藏", color: "text-orange-600 dark:text-orange-400 bg-orange-600/10 border-orange-600/20" },
]

interface CategoryIconProps {
  icon?: string | null
  className?: string
  size?: number
}

export function CategoryIcon({ icon, className = "h-4 w-4", size = 16 }: CategoryIconProps) {
  // 如果没有设置分类图标，不显示任何图标（返回 null）
  if (!icon || !icon.trim()) {
    return null
  }

  const trimmedIcon = icon.trim()

  // 检查是否是图片 URL（http, https, data:image, /path）
  if (
    trimmedIcon.startsWith("http://") ||
    trimmedIcon.startsWith("https://") ||
    trimmedIcon.startsWith("data:image/") ||
    trimmedIcon.startsWith("/")
  ) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmedIcon}
        alt="Category icon"
        className={`${className} object-contain inline-block rounded-sm`}
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = "none"
        }}
      />
    )
  }

  // 匹配 Lucide 图标组件
  const IconComponent = (LucideIcons as Record<string, any>)[trimmedIcon]

  if (IconComponent && typeof IconComponent === "function") {
    return <IconComponent className={className} size={size} />
  }

  // 如果找不到对应的组件且不是图片，则不渲染
  return null
}
