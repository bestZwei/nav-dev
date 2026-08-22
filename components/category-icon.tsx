import React from "react"
import * as LucideIcons from "lucide-react"

export interface PopularCategoryIconItem {
  name: string
  label: string
  group: string
}

// Popular Lucide icons grouped by category
export const POPULAR_CATEGORY_ICONS: PopularCategoryIconItem[] = [
  // AI & 智能
  { name: "Bot", label: "AI 助手", group: "智能科技" },
  { name: "Sparkles", label: "灵感推荐", group: "智能科技" },
  { name: "Cpu", label: "模型算力", group: "智能科技" },
  { name: "Brain", label: "深度学习", group: "智能科技" },

  // 开发 & 编程
  { name: "Code", label: "代码开发", group: "研发编程" },
  { name: "Terminal", label: "终端命令行", group: "研发编程" },
  { name: "Database", label: "数据库", group: "研发编程" },
  { name: "GitBranch", label: "版本控制", group: "研发编程" },
  { name: "Laptop", label: "系统硬件", group: "研发编程" },
  { name: "Boxes", label: "组件框架", group: "研发编程" },

  // 设计 & 创意
  { name: "Palette", label: "UI 设计", group: "创意设计" },
  { name: "Layers", label: "设计资源", group: "创意设计" },
  { name: "Image", label: "图库壁纸", group: "创意设计" },
  { name: "PenTool", label: "矢量插画", group: "创意设计" },

  // 效率 & 工具
  { name: "Wrench", label: "实用工具", group: "办公效率" },
  { name: "Briefcase", label: "办公协同", group: "办公效率" },
  { name: "Zap", label: "效率提升", group: "办公效率" },
  { name: "Cloud", label: "云盘网盘", group: "办公效率" },

  // 学习 & 知识
  { name: "GraduationCap", label: "教育学习", group: "知识教育" },
  { name: "BookOpen", label: "文档资料", group: "知识教育" },
  { name: "Newspaper", label: "资讯媒体", group: "知识教育" },

  // 社区 & 社交
  { name: "Users", label: "社区论坛", group: "社交网络" },
  { name: "Globe", label: "综合门户", group: "社交网络" },
  { name: "Compass", label: "探索发现", group: "社交网络" },

  // 娱乐 & 生活
  { name: "Gamepad2", label: "游戏娱乐", group: "生活娱乐" },
  { name: "Video", label: "影音视频", group: "生活娱乐" },
  { name: "Music", label: "音乐音频", group: "生活娱乐" },
  { name: "Coffee", label: "休闲生活", group: "生活娱乐" },
  { name: "ShoppingBag", label: "电商购物", group: "生活娱乐" },

  // 常用 & 收藏
  { name: "Star", label: "精选收藏", group: "常用收藏" },
  { name: "Heart", label: "特别关注", group: "常用收藏" },
  { name: "Bookmark", label: "常用导航", group: "常用收藏" },
  { name: "ShieldCheck", label: "安全隐私", group: "常用收藏" },
  { name: "Flame", label: "热门榜单", group: "常用收藏" },
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
  let IconComponent = (LucideIcons as Record<string, any>)[trimmedIcon]

  // 如果名称大小写不一致，尝试忽略大小写匹配
  if (!IconComponent) {
    const lower = trimmedIcon.toLowerCase()
    const foundKey = Object.keys(LucideIcons).find((k) => k.toLowerCase() === lower)
    if (foundKey) {
      IconComponent = (LucideIcons as Record<string, any>)[foundKey]
    }
  }

  if (IconComponent && (typeof IconComponent === "function" || typeof IconComponent === "object")) {
    const Component = IconComponent as React.ComponentType<{
      className?: string
      size?: number
      style?: React.CSSProperties
    }>
    return <Component className={className} size={size} />
  }

  // 如果找不到对应的组件且不是图片，则不渲染
  return null
}

export type CategoryIconBadgeSize = "sm" | "md" | "lg"

interface CategoryIconBadgeProps {
  icon?: string | null
  size?: CategoryIconBadgeSize
  className?: string
}

// 统一毛玻璃徽章样式：所有展示位置复用，自适应深浅色背景
export function CategoryIconBadge({
  icon,
  size = "md",
  className,
}: CategoryIconBadgeProps) {
  if (!icon || !icon.trim()) return null

  const preset = {
    sm: { box: "h-6 w-6 rounded-md", icon: "h-3.5 w-3.5", px: 14 },
    md: { box: "h-7 w-7 rounded-lg", icon: "h-4 w-4", px: 16 },
    lg: { box: "h-9 w-9 rounded-xl", icon: "h-5 w-5", px: 20 },
  }[size]

  return (
    <div
      className={`flex ${preset.box} items-center justify-center shrink-0 border border-foreground/[0.08] bg-background/40 backdrop-blur-md text-foreground ${className || ""}`}
    >
      <CategoryIcon icon={icon} className={preset.icon} size={preset.px} />
    </div>
  )
}