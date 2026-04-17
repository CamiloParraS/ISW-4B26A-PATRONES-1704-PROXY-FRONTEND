import type { AuthSession, GenerateResponseDto, Plan } from "@/types/contracts"

const SESSION_KEY = "slopgpt.session"
const LAST_RESPONSE_KEY = "slopgpt.last-response"
const MINUTE_USAGE_KEY = "slopgpt.minute-usage"

export type MinuteUsageSnapshot = {
  requestsUsedInCurrentMinute: number
  requestsRemainingInCurrentMinute: number
  resetAtEpochMs: number
}

function readJson<T>(key: string): T | null {
  const rawValue = localStorage.getItem(key)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getStoredSession() {
  return readJson<AuthSession>(SESSION_KEY)
}

export function setStoredSession(session: AuthSession) {
  writeJson(SESSION_KEY, session)
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getStoredLastResponse() {
  return readJson<GenerateResponseDto>(LAST_RESPONSE_KEY)
}

export function setStoredLastResponse(response: GenerateResponseDto) {
  writeJson(LAST_RESPONSE_KEY, response)
}

export function clearStoredLastResponse() {
  localStorage.removeItem(LAST_RESPONSE_KEY)
}

export function getStoredMinuteUsage() {
  return readJson<MinuteUsageSnapshot>(MINUTE_USAGE_KEY)
}

export function setStoredMinuteUsage(snapshot: MinuteUsageSnapshot) {
  writeJson(MINUTE_USAGE_KEY, snapshot)
}

export function clearStoredMinuteUsage() {
  localStorage.removeItem(MINUTE_USAGE_KEY)
}

const QUOTA_SNAPSHOT_KEY = "slopgpt.quota-snapshot"

export type QuotaSnapshot = {
  userId: string
  currentPlan: Plan
  monthlyTokensUsed: number
  monthlyTokensRemaining: number
  monthlyResetDate: string
  savedAtEpochMs: number
}

export function getStoredQuotaSnapshot() {
  return readJson<QuotaSnapshot>(QUOTA_SNAPSHOT_KEY)
}

export function setStoredQuotaSnapshot(
  snapshot: Omit<QuotaSnapshot, "savedAtEpochMs">,
  options?: { force?: boolean }
) {
  const prev = getStoredQuotaSnapshot()

  const shouldWrite =
    options?.force === true ||
    !prev ||
    prev.currentPlan !== snapshot.currentPlan ||
    prev.monthlyResetDate !== snapshot.monthlyResetDate

  if (!shouldWrite) {
    return
  }

  writeJson(QUOTA_SNAPSHOT_KEY, { ...snapshot, savedAtEpochMs: Date.now() })
}

export function clearStoredQuotaSnapshot() {
  localStorage.removeItem(QUOTA_SNAPSHOT_KEY)
}
