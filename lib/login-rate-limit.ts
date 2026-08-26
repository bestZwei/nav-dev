// 登录接口速率限制（暴力破解防护）
//
// 双维度固定窗口计数器，进程内存实现：
// - IP 维度：单 IP 失败 10 次/15 分钟 → 锁定（挡扫号）
// - 账号维度：单账号失败 5 次/15 分钟 → 锁定（定向爆破防护）
//
// 锁定退避：15min → 30min → 45min → 60min（封顶）。
// 轮次在"锁定到期后紧接着又失败"时递增；静默超过冷却期（1 小时）后归零。
// 登录成功即清零账号计数。重启进程计数清空（可接受：窗口仅 15 分钟）。
// 单实例部署下内存方案已足够；如未来多实例，可换 Redis 等共享存储。

const WINDOW_MS = 15 * 60 * 1000
const COOLDOWN_MS = 60 * 60 * 1000
const MAX_FAILURES_PER_IP = 10
const MAX_FAILURES_PER_ACCOUNT = 5
const MAX_LOCK_MULTIPLE = 4

type AttemptRecord = {
  failures: number
  windowStart: number
  lockedUntil?: number
  consecutiveLocks: number
  lastEventAt: number
}

function now(): number {
  return Date.now()
}

const ipAttempts = new Map<string, AttemptRecord>()
const accountAttempts = new Map<string, AttemptRecord>()

// 防内存膨胀：键数量上限（登录接口的合理规模远低于此）
const MAX_KEYS = 10_000
function evictIfNeeded(map: Map<string, AttemptRecord>) {
  if (map.size <= MAX_KEYS) return
  for (const [key, record] of map) {
    const locked = Boolean(record.lockedUntil && record.lockedUntil > now())
    if (!locked && now() - record.lastEventAt > COOLDOWN_MS) {
      map.delete(key)
    }
  }
}

function getRecord(map: Map<string, AttemptRecord>, key: string): AttemptRecord {
  let record = map.get(key)
  if (!record) {
    record = {
      failures: 0,
      windowStart: now(),
      consecutiveLocks: 0,
      lastEventAt: now(),
    }
    map.set(key, record)
    return record
  }

  // 锁定中：保留状态
  if (record.lockedUntil && record.lockedUntil > now()) {
    record.lastEventAt = now()
    return record
  }

  // 冷却期已过：完全重置（含退避轮次，给正常用户干净的重新开始）
  if (now() - record.lastEventAt > COOLDOWN_MS) {
    record.failures = 0
    record.windowStart = now()
    record.consecutiveLocks = 0
    delete record.lockedUntil
    record.lastEventAt = now()
    return record
  }

  // 计数窗口过期（但冷却期内）：重置计数、保留退避轮次——
  // 锁定到期后立刻又来失败的攻击者应吃到更长的下一轮锁定
  if (now() - record.windowStart >= WINDOW_MS) {
    record.failures = 0
    record.windowStart = now()
    delete record.lockedUntil
  }
  record.lastEventAt = now()
  return record
}

function isLocked(record: AttemptRecord): boolean {
  return Boolean(record.lockedUntil && record.lockedUntil > now())
}

export type LoginRateLimitResult = {
  allowed: boolean
  retryAfterSeconds?: number
}

function lockIfNeeded(
  map: Map<string, AttemptRecord>,
  key: string,
  maxFailures: number
): number | null {
  const record = getRecord(map, key)
  record.failures += 1
  if (record.failures >= maxFailures) {
    record.consecutiveLocks = Math.min(record.consecutiveLocks + 1, MAX_LOCK_MULTIPLE)
    const duration = Math.min(WINDOW_MS * record.consecutiveLocks, 60 * 60 * 1000)
    record.lockedUntil = now() + duration
    record.failures = 0
    record.windowStart = now()
    return Math.ceil(duration / 1000)
  }
  return null
}

/**
 * 登录前检查：IP 或账号任一命中锁定则拒绝
 */
export function checkLoginRateLimit(ip: string, email: string): LoginRateLimitResult {
  evictIfNeeded(ipAttempts)
  evictIfNeeded(accountAttempts)

  const ipRecord = getRecord(ipAttempts, ip)
  if (isLocked(ipRecord)) {
    return { allowed: false, retryAfterSeconds: Math.ceil((ipRecord.lockedUntil! - now()) / 1000) }
  }

  const accountRecord = getRecord(accountAttempts, email.toLowerCase())
  if (isLocked(accountRecord)) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((accountRecord.lockedUntil! - now()) / 1000),
    }
  }

  return { allowed: true }
}

/**
 * 登录失败后记录：任一维度达阈值即进入锁定，返回锁定时长（秒）
 */
export function recordLoginFailure(ip: string, email: string): number | null {
  const ipLock = lockIfNeeded(ipAttempts, ip, MAX_FAILURES_PER_IP)
  const accountLock = lockIfNeeded(accountAttempts, email.toLowerCase(), MAX_FAILURES_PER_ACCOUNT)
  return accountLock ?? ipLock
}

/**
 * 登录成功后清零账号维度计数（IP 维度保留，防止同 IP 换账号继续扫）
 */
export function recordLoginSuccess(email: string): void {
  accountAttempts.delete(email.toLowerCase())
}

/** 仅供测试：清空全部状态 */
export function resetRateLimitStateForTest(): void {
  ipAttempts.clear()
  accountAttempts.clear()
}

/** 仅供测试：时间旅行（模拟锁定到期/冷却期流逝） */
export function __timeTravel(ms: number): void {
  const shift = (record: AttemptRecord) => {
    record.windowStart -= ms
    record.lastEventAt -= ms
    if (record.lockedUntil) record.lockedUntil -= ms
  }
  for (const record of ipAttempts.values()) shift(record)
  for (const record of accountAttempts.values()) shift(record)
}