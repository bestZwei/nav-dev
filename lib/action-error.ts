// Server Action 错误码 → 本地化文案解析（客户端使用）。
// 约定：lib/actions.ts 中可预期的业务失败返回稳定错误码（UPPER_SNAKE，
// 如 "CATEGORY_NOT_IN_WORKSPACE"），由调用方经本函数按当前 locale 映射文案；
// 解析不到映射或历史自由文本消息时原样透传。
// 用法：const tAE = useTranslations("actionErrors")
//       resolveActionError(tAE, result.error, tc("operationFailed"), result.data)
// 说明：next-intl 的 Translator 泛型签名无法结构化匹配字符串入参，
// 这里以 unknown 接收并在函数内做最小能力假设（has + 调用）。
export function resolveActionError(
  t: unknown,
  error: string | null | undefined,
  fallback: string,
  values?: Record<string, unknown>
): string {
  if (!error) return fallback
  if (!/^[A-Z0-9_]+$/.test(error)) return error
  try {
    const translator = t as {
      has?: (key: string) => boolean
      (key: string, values?: Record<string, unknown>): string
    }
    if (translator.has?.(error)) {
      return translator(error, values)
    }
  } catch {
    // 映射缺失等异常一律退回原始错误码
  }
  return error
}
