import { useEffect, useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { useCountdown } from "@/hooks/use-countdown"
import {
  getStoredMinuteUsage,
  getStoredQuotaSnapshot,
  setStoredQuotaSnapshot,
} from "@/lib/storage"
import { getNextMinuteBoundaryEpochMs } from "@/lib/time"
import { getQuotaHistory, getQuotaStatus } from "@/services/quota-service"
import type {
  QuotaHistoryResponseDto,
  QuotaStatusResponseDto,
} from "@/types/contracts"

import { DashboardTabs } from "./dashboard-tabs"
import { MinuteUsageCard } from "./minute-usage-card"
import { PlanBadge } from "./plan-badge"
import { QuotaIndicatorCard } from "./quota-indicator-card"
import { UsageHistoryChart } from "./usage-history-chart"

function getRequestLimit(plan: QuotaStatusResponseDto["currentPlan"]) {
  if (plan === "PRO") {
    return 60
  }

  if (plan === "ENTERPRISE") {
    return Number.POSITIVE_INFINITY
  }

  return 10
}

function getPlanLimitLabel(plan: QuotaStatusResponseDto["currentPlan"]) {
  if (plan === "ENTERPRISE") {
    return "Ilimitado"
  }

  return `${getRequestLimit(plan)}/minute`
}

function getFriendlyUsageError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "No se pudo cargar el uso de la cuenta. Inténtalo de nuevo."
}

function computeEmptyLast7Days() {
  const result: { date: string; tokensUsed: number }[] = []
  const today = new Date()

  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    result.push({ date: date.toISOString().slice(0, 10), tokensUsed: 0 })
  }

  return result
}

function resolveInitialMinuteUsage(requestLimit: number) {
  const storedMinuteUsage = getStoredMinuteUsage()

  if (!storedMinuteUsage || storedMinuteUsage.resetAtEpochMs <= Date.now()) {
    return {
      requestsUsed: 0,
      requestsRemaining: Number.isFinite(requestLimit) ? requestLimit : 0,
      minuteWindowResetAt: getNextMinuteBoundaryEpochMs(),
    }
  }

  return {
    requestsUsed: storedMinuteUsage.requestsUsedInCurrentMinute,
    requestsRemaining: storedMinuteUsage.requestsRemainingInCurrentMinute,
    minuteWindowResetAt: storedMinuteUsage.resetAtEpochMs,
  }
}

export function UsagePage() {
  const { session, updatePlan } = useAuth()
  const userId = session?.userId ?? null
  const initialPlan = session?.currentPlan ?? "FREE"
  const initialRequestLimit = getRequestLimit(initialPlan)

  const [quotaStatus, setQuotaStatus] = useState<QuotaStatusResponseDto | null>(
    () => {
      const stored = getStoredQuotaSnapshot()
      if (stored && stored.userId === userId) {
        return {
          userId: stored.userId,
          currentPlan: stored.currentPlan,
          monthlyTokensUsed: stored.monthlyTokensUsed,
          monthlyTokensRemaining: stored.monthlyTokensRemaining,
          monthlyResetDate: stored.monthlyResetDate,
        }
      }

      return null
    }
  )
  const [history, setHistory] = useState<QuotaHistoryResponseDto["last7Days"]>(
    () => computeEmptyLast7Days()
  )
  const [minuteUsage, setMinuteUsage] = useState(() =>
    resolveInitialMinuteUsage(initialRequestLimit)
  )
  const [isLoadingQuota, setIsLoadingQuota] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const effectivePlan =
    quotaStatus?.currentPlan ?? session?.currentPlan ?? "FREE"
  const requestLimit = getRequestLimit(effectivePlan)
  const planLimitLabel = getPlanLimitLabel(effectivePlan)
  const minuteResetCountdown = useCountdown(minuteUsage.minuteWindowResetAt)
  const blockedCountdown =
    Number.isFinite(requestLimit) && minuteUsage.requestsRemaining <= 0
      ? minuteResetCountdown
      : 0

  useEffect(() => {
    if (!userId) {
      return
    }

    let isCancelled = false

    async function loadUsageData() {
      setErrorMessage(null)
      setIsLoadingQuota(true)
      setIsLoadingHistory(true)

      try {
        const [nextQuotaStatus, nextHistory] = await Promise.all([
          getQuotaStatus(userId!),
          getQuotaHistory(userId!),
        ])

        if (isCancelled) {
          return
        }

        setQuotaStatus(nextQuotaStatus)
        updatePlan(nextQuotaStatus.currentPlan)
        setStoredQuotaSnapshot({
          userId: nextQuotaStatus.userId,
          currentPlan: nextQuotaStatus.currentPlan,
          monthlyTokensUsed: nextQuotaStatus.monthlyTokensUsed,
          monthlyTokensRemaining: nextQuotaStatus.monthlyTokensRemaining,
          monthlyResetDate: nextQuotaStatus.monthlyResetDate,
        })
        setHistory(nextHistory.last7Days)

        const storedMinuteUsage = getStoredMinuteUsage()
        if (
          storedMinuteUsage &&
          storedMinuteUsage.resetAtEpochMs > Date.now()
        ) {
          setMinuteUsage({
            requestsUsed: storedMinuteUsage.requestsUsedInCurrentMinute,
            requestsRemaining:
              storedMinuteUsage.requestsRemainingInCurrentMinute,
            minuteWindowResetAt: storedMinuteUsage.resetAtEpochMs,
          })
        } else {
          const nextRequestLimit = getRequestLimit(nextQuotaStatus.currentPlan)
          setMinuteUsage({
            requestsUsed: 0,
            requestsRemaining: Number.isFinite(nextRequestLimit)
              ? nextRequestLimit
              : 0,
            minuteWindowResetAt: getNextMinuteBoundaryEpochMs(),
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(getFriendlyUsageError(error))
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingQuota(false)
          setIsLoadingHistory(false)
        }
      }
    }

    void loadUsageData()

    return () => {
      isCancelled = true
    }
  }, [reloadKey, updatePlan, userId])

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                  Data Usage
                </p>
                <PlanBadge plan={effectivePlan} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DashboardTabs />
              <Button
                variant="outline"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Actualizar datos
              </Button>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <Alert
            tone="warning"
            title="No se pudo cargar el uso"
            message={errorMessage}
          />
        ) : null}

        <Card>
          <CardHeader className="gap-2">
            <CardTitle>Vista general</CardTitle>
            <CardDescription>
              El panel muestra cuota mensual, ritmo por minuto e historial de
              tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted px-3 py-1">
              Usuario: {session?.username}
            </span>
            <span className="rounded-full border border-border bg-muted px-3 py-1">
              Plan: {effectivePlan}
            </span>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col gap-6">
            <QuotaIndicatorCard
              isLoading={isLoadingQuota}
              status={quotaStatus}
              errorMessage={errorMessage}
            />

            <MinuteUsageCard
              requestsUsed={minuteUsage.requestsUsed}
              requestsRemaining={
                Number.isFinite(requestLimit)
                  ? minuteUsage.requestsRemaining
                  : "∞"
              }
              planLimitLabel={planLimitLabel}
              resetCountdownSeconds={minuteResetCountdown}
              blockedCountdownSeconds={blockedCountdown}
            />
          </div>

          <UsageHistoryChart history={history} isLoading={isLoadingHistory} />
        </div>
      </div>
    </main>
  )
}
