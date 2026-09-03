// Next.js 内部信号错误的统一判定（唯一事实源）：
// - DYNAMIC_SERVER_USAGE / 其他 DYNAMIC_* 前缀：RSC 动态渲染信号
// - NEXT_DYNAMIC_NO_SSR_CODE：next/dynamic 在服务端被触发的信号
// 这类“错误”不是真正的异常，action 的 catch 必须原样重新抛出，
// 否则会被吞掉导致页面静态化或返回假失败。
export function isNextDynamicError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const digest = (error as { digest?: string }).digest
  return (
    typeof digest === "string" &&
    (/^DYNAMIC/.test(digest) || digest === "NEXT_DYNAMIC_NO_SSR_CODE")
  )
}
