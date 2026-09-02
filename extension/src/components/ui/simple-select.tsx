import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SimpleSelectOption {
  value: string
  label: string
}

interface SimpleSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SimpleSelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

const triggerCls =
  "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

// 扩展弹窗不持有持久焦点，Radix Select 的焦点层会把首次点击
// 误判为外部交互导致下拉立即收回；这里用受控列表实现同款
// shadcn 视觉（触发器 + 浮层卡片 + 选中勾选），行为完全可控
export function SimpleSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
}: SimpleSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  // 弹窗高度由文档决定，向下溢出会把整个弹窗拉高；
  // 打开前测量剩余空间，贴近底部时改为向上展开
  const [direction, setDirection] = useState<"down" | "up">("down")

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onEscape)
    }
  }, [open])

  const selected = options.find(o => o.value === value)

  function toggleOpen() {
    const next = !open
    if (next && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDirection(spaceBelow < 208 && rect.top > spaceBelow ? "up" : "down")
    }
    setOpen(next)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={cn(triggerCls, className)}
      >
        <span
          className={cn("truncate", !selected && "text-muted-foreground")}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-50 max-h-48 w-full overflow-auto rounded-md border bg-background p-1 shadow-md",
            direction === "up" ? "bottom-full mb-1" : "mt-1"
          )}
        >
          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              暂无可选项
            </div>
          ) : (
            options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onValueChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                  option.value === value && "bg-accent"
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="absolute right-2 h-4 w-4" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
