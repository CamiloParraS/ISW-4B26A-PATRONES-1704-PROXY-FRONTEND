export type Plan = "FREE" | "PRO" | "ENTERPRISE"

export type GenerateRequestDto = {
  userId: string
  prompt: string
  maxOutputTokens?: number
}

export type GenerateResponseDto = {
  userId: string
  generatedText: string
  processingTimeMs: number
  currentPlan: Plan
  consumedTokens: number
  promptTokens: number
  outputTokensEstimate: number
  monthlyTokensUsed: number
  monthlyTokensRemaining: number
  monthlyResetDate: string
  requestsUsedInCurrentMinute: number
  requestsRemainingInCurrentMinute: number
}

export type QuotaStatusResponseDto = {
  userId: string
  currentPlan: Plan
  monthlyTokensUsed: number
  monthlyTokensRemaining: number
  monthlyResetDate: string
}

export type DailyUsageDto = {
  date: string
  tokensUsed: number
}

export type QuotaHistoryResponseDto = {
  userId: string
  last7Days: DailyUsageDto[]
}

export type UpgradeRequestDto = {
  userId: string
}

export type UpgradeResponseDto = {
  userId: string
  fromPlan: Plan
  toPlan: Plan
  upgradedAt: string
}

export type RegisterRequestDto = {
  email: string
  username: string
  password: string
}

export type RegisterResponseDto = {
  userId: string
  email: string
  username: string
  currentPlan: Plan
  createdAt: string
}

export type LoginRequestDto = {
  identifier: string
  password: string
}

export type LoginResponseDto = {
  userId: string
  email: string
  username: string
  currentPlan: Plan
  loggedInAt: string
  token: string
}

export type ApiErrorBody = {
  message: string
  timestamp: string
  path: string
  details: string[]
}

export type AuthSession = {
  userId: string
  email: string
  username: string
  currentPlan: Plan
  token?: string
}
