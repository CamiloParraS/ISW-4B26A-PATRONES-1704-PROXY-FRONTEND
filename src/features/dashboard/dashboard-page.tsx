import { LogOut, RefreshCcw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { useCountdown } from "@/hooks/use-countdown"
import {
    clearStoredLastResponse,
    clearStoredMinuteUsage,
    getStoredLastResponse,
    getStoredMinuteUsage,
    setStoredLastResponse,
    setStoredMinuteUsage,
} from "@/lib/storage"
import { getNextMinuteBoundaryEpochMs } from "@/lib/time"
import { generatePrompt } from "@/services/ai-service"
import { ApiClientError } from "@/services/api/client"
import { getQuotaHistory, getQuotaStatus, upgradePlan } from "@/services/quota-service"
import type {
    GenerateResponseDto,
    QuotaHistoryResponseDto,
    QuotaStatusResponseDto,
} from "@/types/contracts"

import { estimateConsumedTokens, estimatePromptTokens } from "./token-estimator"
import { MinuteUsageCard } from "./minute-usage-card"
import { PlanBadge } from "./plan-badge"
import { PromptComposer } from "./prompt-composer"
import { QuotaIndicatorCard } from "./quota-indicator-card"
import { ResponsePanel } from "./response-panel"
import { UpgradeModal } from "./upgrade-modal"
import { UsageHistoryChart } from "./usage-history-chart"

type PromptFormState = {
    prompt: string
    maxOutputTokens: string
}

type PromptFieldErrors = Partial<Record<keyof PromptFormState, string>>

const initialPromptState: PromptFormState = {
    prompt: "",
    maxOutputTokens: "120",
}

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

function getFriendlyDashboardError(error: unknown) {
    if (error instanceof ApiClientError) {
        if (error.status === 400) {
            return "Carga de solicitud inválida. Revisa el prompt y los valores de tokens de salida."
        }

        if (error.status === 500) {
            return "El backend tuvo un problema inesperado. Inténtalo de nuevo en un momento."
        }

        return error.message
    }

    return "Algo salió mal al comunicarnos con el backend."
}

function validatePromptFields(values: PromptFormState) {
    const errors: PromptFieldErrors = {}

    if (values.prompt.trim().length === 0) {
        errors.prompt = "El prompt es obligatorio y no puede estar vacío."
    }

    const maxOutputTokens = Number(values.maxOutputTokens)
    if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1) {
        errors.maxOutputTokens = "Los tokens máximos de salida deben ser un número entero de al menos 1."
    }

    return errors
}

function hasAnyError(errors: PromptFieldErrors) {
    return Object.values(errors).some(Boolean)
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

export function DashboardPage() {
    const { session, signOut, updatePlan } = useAuth()
    const initialPlan = session?.currentPlan ?? "FREE"
    const initialRequestLimit = getRequestLimit(initialPlan)
    const initialMinuteUsage = resolveInitialMinuteUsage(initialRequestLimit)
    const [promptValues, setPromptValues] = useState<PromptFormState>(initialPromptState)
    const [promptErrors, setPromptErrors] = useState<PromptFieldErrors>({})
    const [isGenerating, setIsGenerating] = useState(false)
    const [dashboardError, setDashboardError] = useState<string | null>(null)
    const [quotaError, setQuotaError] = useState<string | null>(null)
    const [quotaStatus, setQuotaStatus] = useState<QuotaStatusResponseDto | null>(null)
    const [history, setHistory] = useState<QuotaHistoryResponseDto["last7Days"]>([])
    const [isLoadingQuota, setIsLoadingQuota] = useState(true)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [lastResponse, setLastResponse] = useState<GenerateResponseDto | null>(() =>
        getStoredLastResponse()
    )
    const [requestsUsed, setRequestsUsed] = useState(initialMinuteUsage.requestsUsed)
    const [requestsRemaining, setRequestsRemaining] = useState(
        initialMinuteUsage.requestsRemaining
    )
    const [minuteWindowResetAt, setMinuteWindowResetAt] = useState<number | null>(
        initialMinuteUsage.minuteWindowResetAt
    )
    const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [upgradeError, setUpgradeError] = useState<string | null>(null)
    const [isUpgrading, setIsUpgrading] = useState(false)

    const minuteResetCountdown = useCountdown(minuteWindowResetAt)
    const blockedCountdown = useCountdown(rateLimitUntil)

    const effectivePlan = quotaStatus?.currentPlan ?? session?.currentPlan ?? "FREE"
    const requestLimit = getRequestLimit(effectivePlan)
    const planLimitLabel = getPlanLimitLabel(effectivePlan)
    const estimator = useMemo(() => {
        const maxOutputTokens = Number(promptValues.maxOutputTokens)
        const safeOutputTokens = Number.isInteger(maxOutputTokens) && maxOutputTokens >= 1 ? maxOutputTokens : 1

        return {
            promptTokens: estimatePromptTokens(promptValues.prompt),
            consumedTokens: estimateConsumedTokens(promptValues.prompt, safeOutputTokens),
        }
    }, [promptValues.maxOutputTokens, promptValues.prompt])

    const isQuotaExhausted =
        quotaStatus?.currentPlan !== "ENTERPRISE" &&
        quotaStatus !== null &&
        quotaStatus.monthlyTokensRemaining <= 0

    useEffect(() => {
        if (!minuteWindowResetAt) {
            return
        }

        const timeoutMs = Math.max(0, minuteWindowResetAt - Date.now())

        const timeoutId = window.setTimeout(() => {
            setRequestsUsed(0)
            setRequestsRemaining(Number.isFinite(requestLimit) ? requestLimit : 0)
            const nextResetAt = getNextMinuteBoundaryEpochMs()
            setMinuteWindowResetAt(nextResetAt)
            clearStoredMinuteUsage()
        }, timeoutMs)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [minuteWindowResetAt, requestLimit])

    useEffect(() => {
        if (!session) {
            return
        }
        const userId = session.userId

        async function loadUsageData() {
            setQuotaError(null)
            setIsLoadingQuota(true)
            setIsLoadingHistory(true)

            try {
                const [nextQuotaStatus, nextHistory] = await Promise.all([
                    getQuotaStatus(userId),
                    getQuotaHistory(userId),
                ])

                setQuotaStatus(nextQuotaStatus)
                updatePlan(nextQuotaStatus.currentPlan)
                setHistory(nextHistory.last7Days)
            } catch (error) {
                setQuotaError(getFriendlyDashboardError(error))
            } finally {
                setIsLoadingQuota(false)
                setIsLoadingHistory(false)
            }
        }

        void loadUsageData()
    }, [session, updatePlan])

    const sendingIsBlocked =
        isGenerating || isQuotaExhausted || blockedCountdown > 0 || !session

    const helperMessage = useMemo(() => {
        if (blockedCountdown > 0) {
            return "Se alcanzó el límite de velocidad. Espera al temporizador antes de enviar otro prompt."
        }

        if (isQuotaExhausted) {
            return "El cupo mensual se agotó. Actualiza tu plan para seguir generando."
        }

        return null
    }, [blockedCountdown, isQuotaExhausted])

    async function refreshQuotaAndHistory() {
        if (!session) {
            return
        }

        setQuotaError(null)
        setIsLoadingQuota(true)
        setIsLoadingHistory(true)

        try {
            const [nextQuotaStatus, nextHistory] = await Promise.all([
                getQuotaStatus(session.userId),
                getQuotaHistory(session.userId),
            ])
            setQuotaStatus(nextQuotaStatus)
            updatePlan(nextQuotaStatus.currentPlan)
            setHistory(nextHistory.last7Days)
        } catch (error) {
            setQuotaError(getFriendlyDashboardError(error))
        } finally {
            setIsLoadingQuota(false)
            setIsLoadingHistory(false)
        }
    }

    async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setDashboardError(null)

        if (!session || isGenerating) {
            return
        }

        const nextErrors = validatePromptFields(promptValues)
        setPromptErrors(nextErrors)
        if (hasAnyError(nextErrors)) {
            return
        }

        try {
            setIsGenerating(true)

            const generationResponse = await generatePrompt({
                userId: session.userId,
                prompt: promptValues.prompt.trim(),
                maxOutputTokens: Number(promptValues.maxOutputTokens),
            })

            setLastResponse(generationResponse)
            setStoredLastResponse(generationResponse)
            setDashboardError(null)

            setQuotaStatus({
                userId: generationResponse.userId,
                currentPlan: generationResponse.currentPlan,
                monthlyTokensUsed: generationResponse.monthlyTokensUsed,
                monthlyTokensRemaining: generationResponse.monthlyTokensRemaining,
                monthlyResetDate: generationResponse.monthlyResetDate,
            })
            updatePlan(generationResponse.currentPlan)

            const nextResetAt = getNextMinuteBoundaryEpochMs()
            setRequestsUsed(generationResponse.requestsUsedInCurrentMinute)
            setRequestsRemaining(generationResponse.requestsRemainingInCurrentMinute)
            setMinuteWindowResetAt(nextResetAt)
            setStoredMinuteUsage({
                requestsUsedInCurrentMinute: generationResponse.requestsUsedInCurrentMinute,
                requestsRemainingInCurrentMinute:
                    generationResponse.requestsRemainingInCurrentMinute,
                resetAtEpochMs: nextResetAt,
            })

            await refreshQuotaAndHistory()
        } catch (error) {
            if (error instanceof ApiClientError) {
                if (error.status === 429) {
                    const retryAfterSeconds = error.metadata.retryAfterSeconds ?? 60
                    setRateLimitUntil(Date.now() + retryAfterSeconds * 1000)
                    setDashboardError(
                        "Alcanzaste el límite por minuto. El envío queda pausado hasta que termine el temporizador."
                    )
                    return
                }

                if (error.status === 402) {
                    setShowUpgradeModal(true)
                    setDashboardError(
                        "El cupo mensual se agotó. Se abrió el flujo de actualización para que puedas continuar."
                    )
                    return
                }
            }

            setDashboardError(getFriendlyDashboardError(error))
        } finally {
            setIsGenerating(false)
        }
    }

    async function handleUpgradeConfirm() {
        if (!session) {
            return
        }

        setUpgradeError(null)
        try {
            setIsUpgrading(true)
            const upgradeResponse = await upgradePlan(session.userId)
            updatePlan(upgradeResponse.toPlan)
            setShowUpgradeModal(false)
            await refreshQuotaAndHistory()
        } catch (error) {
            setUpgradeError(getFriendlyDashboardError(error))
        } finally {
            setIsUpgrading(false)
        }
    }

    function handleLogout() {
        signOut()
        clearStoredLastResponse()
        clearStoredMinuteUsage()
    }

    return (
        <main className="min-h-screen bg-background pb-10">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                            Superficie de control de SlopGPT
                        </p>
                        <h1 className="text-xl font-semibold">Panel de generación de IA</h1>
                        <p className="text-xs text-muted-foreground">
                            Autenticado como <strong>{session?.username}</strong> ({session?.userId})
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <PlanBadge plan={effectivePlan} />
                        <Button variant="outline" onClick={refreshQuotaAndHistory}>
                            <RefreshCcw data-icon="inline-start" />
                            Actualizar uso
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut data-icon="inline-start" />
                            Cerrar sesión
                        </Button>
                    </div>
                </header>

                {dashboardError ? (
                    <Alert tone="error" title="Comentarios de la solicitud" message={dashboardError} />
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
                    <div className="flex flex-col gap-6">
                        <PromptComposer
                            values={promptValues}
                            errors={promptErrors}
                            isSubmitting={isGenerating}
                            estimator={estimator}
                            disabled={sendingIsBlocked}
                            helperMessage={helperMessage}
                            onSubmit={handleGenerate}
                            onFieldChange={(name, value) => {
                                setPromptValues((currentValues) => ({
                                    ...currentValues,
                                    [name]: value,
                                }))
                            }}
                        />

                        <UsageHistoryChart history={history} isLoading={isLoadingHistory} />
                    </div>

                    <div className="flex flex-col gap-6">
                        <QuotaIndicatorCard
                            isLoading={isLoadingQuota}
                            status={quotaStatus}
                            errorMessage={quotaError}
                        />

                        <MinuteUsageCard
                            requestsUsed={requestsUsed}
                            requestsRemaining={
                                Number.isFinite(requestLimit) ? requestsRemaining : "∞"
                            }
                            planLimitLabel={planLimitLabel}
                            resetCountdownSeconds={minuteResetCountdown}
                            blockedCountdownSeconds={blockedCountdown}
                        />

                        {isQuotaExhausted ? (
                            <Button className="h-10 text-sm" onClick={() => setShowUpgradeModal(true)}>
                                Actualizar plan
                            </Button>
                        ) : null}

                        <ResponsePanel response={lastResponse} />
                    </div>
                </div>
            </div>

            <UpgradeModal
                open={showUpgradeModal}
                currentPlan={effectivePlan}
                isUpgrading={isUpgrading}
                errorMessage={upgradeError}
                onClose={() => setShowUpgradeModal(false)}
                onConfirm={handleUpgradeConfirm}
            />
        </main>
    )
}
