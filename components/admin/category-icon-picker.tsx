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
import { CategoryIcon, POPULAR_CATEGORY_ICONS } from "@/components/category-icon"
import { Search, Upload, Link as LinkIcon, Trash2, Check, Sparkles, Image as ImageIcon } from "lucide-react"

interface CategoryIconPickerProps {
  value?: string | null
  onChange: (iconName: string | null) => void
}

export function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredIcons = POPULAR_CATEGORY_ICONS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  )

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
              className="h-10 px-3 flex items-center gap-2.5 justify-start min-w-[160px] border-dashed hover:border-primary/50 transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                <CategoryIcon icon={value} className="h-4 w-4" size={16} />
              </div>
              <span className="text-xs truncate font-medium">
                {value ? (selectedItem ? `${selectedItem.label} (${selectedItem.name})` : "自定义图标") : "选择分类图标..."}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-0" align="start">
            <Tabs defaultValue="preset" className="w-full">
              <div className="p-2 border-b">
                <TabsList className="grid grid-cols-3 w-full h-8">
                  <TabsTrigger value="preset" className="text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    精选图标
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs">
                    <LinkIcon className="h-3.5 w-3.5 mr-1" />
                    图片链接
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    本地上传
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: 常用 Lucide 图标库 */}
              <TabsContent value="preset" className="p-2 space-y-2 m-0 focus-visible:outline-none">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜索图标名称或类型..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <ScrollArea className="h-[210px] pr-2">
                  <div className="grid grid-cols-5 gap-1.5 p-1">
                    {filteredIcons.map((item) => {
                      const isSelected = value === item.name
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSelectIcon(item.name)}
                          title={`${item.label} (${item.name})`}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all hover:bg-accent hover:scale-105 active:scale-95 group relative ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                              : "text-muted-foreground hover:text-foreground bg-muted/40"
                          }`}
                        >
                          <CategoryIcon
                            icon={item.name}
                            className={`h-4 w-4 ${isSelected ? "text-primary-foreground" : "text-foreground/80 group-hover:text-foreground"}`}
                            size={16}
                          />
                          <span className="text-[10px] mt-1 truncate max-w-full scale-90 leading-tight">
                            {item.name}
                          </span>
                          {isSelected && (
                            <span className="absolute top-0.5 right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white text-primary text-[8px] font-bold">
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
                    <CategoryIcon icon={customUrl} className="h-6 w-6" size={24} />
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
                  <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                    已选: {value.startsWith("data:") ? "本地图片" : value}
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
            移除
          </Button>
        )}
      </div>
    </div>
  )
}
