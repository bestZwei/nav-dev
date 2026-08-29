/**
 * 日志工具函数
 *
 * error/warn 在生产环境保留输出：安全事件、导入失败、webhook 失败等
 * 关键信息在出问题时必须可追溯；info/log 仅开发环境输出
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (...args: unknown[]) => {
    console.error(...args)
  },

  warn: (...args: unknown[]) => {
    console.warn(...args)
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  }
}
