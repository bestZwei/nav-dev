"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CategoryIconBadge, POPULAR_CATEGORY_ICONS } from "@/components/category-icon"
import { Search, Upload, Link as LinkIcon, Trash2, Check, Sparkles, Image as ImageIcon, Plus } from "lucide-react"

interface CategoryIconPickerProps {
  value?: string | null
  onChange: (iconName: string | null) => void
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [activeGroup, setActiveGroup] = useState<string>("全部")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const groups = ["全部", "智能科技", "研发编程", "创意设计", "办公效率", "知识教育", "社交网络", "生活娱乐", "常用收藏"]

  const filteredIcons = POPULAR_CATEGORY_ICONS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.group.toLowerCase().includes(search.toLowerCase())

    const matchesGroup = activeGroup === "全部" || item.group === activeGroup

    return matchesSearch && matchesGroup
  })

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName)
    setOpen(false)
  }

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim())
      setOpen(false)
      setCustomUrl("")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("请选择有效的图片文件")
      return
    }

    // Limit size to 500KB
    if (file.size > 500 * 1024) {
      alert("图片大小不能超过 500KB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onChange(dataUrl)
        setOpen(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    onChange(null)
    setOpen(false)
  }

  const selectedItem = POPULAR_CATEGORY_ICONS.find((i) => i.name === value)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-3 flex items-center gap-2.5 justify-start min-w-[180px] border-dashed hover:border-primary/50 transition-colors"
            >
              {value ? (
                <CategoryIconBadge icon={value} size="sm" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground/50 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
              )}
              <span className="text-xs truncate font-medium">
                {value ? (selectedItem ? `${selectedItem.label} (${selectedItem.name})` : "自定义图标") : "未设置（点击添加图标）"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="start">
            <Tabs defaultValue="preset" className="w-full">
              <div className="p-2 border-b">
                <TabsList className="grid grid-cols-3 w-full h-8">
                  <TabsTrigger value="preset" className="text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                    精选图标
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs">
                    <LinkIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    图片链接
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs">
                    <Upload className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    本地上传
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: 常用 Lucide 图标库（分类别、多色彩丰富呈现） */}
              <TabsContent value="preset" className="p-2.5 space-y-2.5 m-0 focus-visible:outline-none">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜索图标名称或类型..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {/* 分组过滤器 */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
                  {groups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setActiveGroup(group)}
                      className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                        activeGroup === group
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <ScrollArea className="h-[210px] pr-2">
                  <div className="grid grid-cols-4 gap-2 p-1">
                    {filteredIcons.map((item) => {
                      const isSelected = value === item.name
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSelectIcon(item.name)}
                          title={`${item.label} (${item.name}) - ${item.group}`}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all hover:scale-105 active:scale-95 group relative border ${
                            isSelected
                              ? "ring-2 ring-primary border-primary bg-accent shadow-xs"
                              : "border-border/60 hover:border-primary/40 bg-card hover:bg-accent/40"
                          }`}
                        >
                          <div className="mb-1.5 transition-transform group-hover:scale-110">
                            <CategoryIconBadge icon={item.name} size="md" />
                          </div>
                          <span className="text-[11px] font-medium truncate max-w-full leading-tight text-foreground/90">
                            {item.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground/70 truncate max-w-full font-mono scale-95">
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {filteredIcons.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      未找到相关图标
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Tab 2: 网络图片 URL */}
              <TabsContent value="url" className="p-3 space-y-3 m-0 focus-visible:outline-none">
                <div className="space-y-1.5">
                  <Label className="text-xs">图片 URL 地址</Label>
                  <Input
                    placeholder="https://example.com/icon.png"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    支持 SVG, PNG, WebP 或 JPG 格式图标链接
                  </p>
                </div>
                {customUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border">
                    <span className="text-xs text-muted-foreground">预览:</span>
                    <CategoryIconBadge icon={customUrl} size="md" className="h-9 w-9" />
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyCustomUrl}
                  disabled={!customUrl.trim()}
                  className="w-full h-8 text-xs"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  应用此链接
                </Button>
              </TabsContent>

              {/* Tab 3: 本地上传 */}
              <TabsContent value="upload" className="p-3 space-y-3 m-0 focus-visible:outline-none">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-accent/40 transition-colors flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium">点击选择本地图标图片</span>
                  <span className="text-[10px] text-muted-foreground">支持 PNG, SVG, JPG (小于 500KB)</span>
                </div>
              </TabsContent>

              {/* Footer: 清除图标 */}
              {value && (
                <div className="p-2 border-t bg-muted/20 flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                    已设置: {value.startsWith("data:") ? "本地图片" : value}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    清除图标
                  </Button>
                </div>
              )}
            </Tabs>
          </PopoverContent>
        </Popover>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
            title="移除图标"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            不使用图标
          </Button>
        )}
      </div>
    </div>
  )
}
