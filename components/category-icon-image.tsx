"use client"

import React from "react"

interface CategoryIconImageProps {
  src: string
  className?: string
  size: number
}

// 分类图标为图片 URL 时的渲染器。
// RSC 中宿主元素不允许事件处理器，加载失败的隐藏逻辑必须放在客户端组件内
export function CategoryIconImage({ src, className, size }: CategoryIconImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Category icon"
      className={`${className} object-contain inline-block rounded-sm`}
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.style.display = "none"
      }}
    />
  )
}
