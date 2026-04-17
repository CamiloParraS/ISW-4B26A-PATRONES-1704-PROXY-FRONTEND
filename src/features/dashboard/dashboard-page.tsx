import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/routes"
import { useAuth } from "@/features/auth/auth-context"
import { validatePrompt } from "@/features/auth/validation"
import { useCountdown } from "@/hooks/use-countdown"
import {
    clearStoredLastResponse,
    clearStoredMinuteUsage,
    getStoredLastResponse,
    getStoredMinuteUsage,
    setStoredLastResponse,
    setStoredMinuteUsage,
    getStoredQuotaSnapshot,
    setStoredQuotaSnapshot,
} from "@/lib/storage"
import { getNextMinuteBoundaryEpochMs } from "@/lib/time"
import { generatePrompt } from "@/services/ai-service"
import { ApiClientError } from "@/services/api/client"
import { upgradePlan } from "@/services/quota-service"
import type {
    GenerateResponseDto,
    QuotaStatusResponseDto,
} from "@/types/contracts"

import { PlanBadge } from "./plan-badge"
import { PromptComposer } from "./prompt-composer"
import { ResponsePanel } from "./response-panel"
import { UpgradeModal } from "./upgrade-modal"

type PromptFormState = {
    prompt: string
}

type PromptFieldErrors = Partial<Record<keyof PromptFormState, string>>

const initialPromptState: PromptFormState = {
    prompt: "",
}

function getFriendlyDashboardError(error: unknown) {
    if (error instanceof ApiClientError) {
        if (error.status === 400) {
            return "Carga de solicitud inválida. Revisa el prompt y vuelve a intentarlo."
        }

        if (error.status === 402) {
            return "El cupo mensual se agotó. Actualiza el plan o espera al próximo reinicio mensual."
        }

        if (error.status === 409) {
            return "El backend encontró un conflicto al procesar la solicitud."
        }

        if (error.status === 429) {
            return "Alcanzaste el límite por minuto. Espera antes de volver a intentarlo."
        }

        if (error.status === 500) {
            return "El backend tuvo un problema inesperado. Inténtalo de nuevo en un momento."
        }

        return error.message
    }

    return "Algo salió mal al comunicarnos con el backend."
}

function validatePromptFields(values: PromptFormState) {
    return validatePrompt(values)
}

function hasAnyError(errors: PromptFieldErrors) {
    return Object.values(errors).some(Boolean)
}

function resolveInitialMinuteResetAt() {
    const storedMinuteUsage = getStoredMinuteUsage()

    if (!storedMinuteUsage || storedMinuteUsage.resetAtEpochMs <= Date.now()) {
        return getNextMinuteBoundaryEpochMs()
    }

    return storedMinuteUsage.resetAtEpochMs
}

export function DashboardPage() {
    const { session, signOut, updatePlan } = useAuth()
    const navigate = useNavigate()
    const userId = session?.userId ?? null
    const [promptValues, setPromptValues] = useState<PromptFormState>({ prompt: "" })
    const [promptErrors, setPromptErrors] = useState<PromptFieldErrors>({})
    const [isGenerating, setIsGenerating] = useState(false)
    const [dashboardError, setDashboardError] = useState<string | null>(null)
    const [quotaError, setQuotaError] = useState<string | null>(null)
    const [quotaStatus, setQuotaStatus] = useState<QuotaStatusResponseDto | null>(null)
    const [isLoadingQuota, setIsLoadingQuota] = useState(true)
    const [lastResponse, setLastResponse] = useState<GenerateResponseDto | null>(() =>
        getStoredLastResponse()
    )
    const [minuteWindowResetAt, setMinuteWindowResetAt] = useState<number | null>(() =>
        resolveInitialMinuteResetAt()
    )
    const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [upgradeError, setUpgradeError] = useState<string | null>(null)
    const [isUpgrading, setIsUpgrading] = useState(false)

    const blockedCountdown = useCountdown(rateLimitUntil)

    const effectivePlan = quotaStatus?.currentPlan ?? session?.currentPlan ?? "FREE"

    const isQuotaExhausted =
        quotaStatus?.currentPlan !== "ENTERPRISE" &&
        quotaStatus !== null &&
        quotaStatus.monthlyTokensRemaining <= 0

    const helperMessage =
        blockedCountdown > 0
            ? "Se alcanzó el límite de velocidad. Espera al temporizador antes de enviar otro mensaje."
            : isQuotaExhausted
                ? "El cupo mensual se agotó. Actualiza tu plan para seguir generando."
                : null

    useEffect(() => {
        if (!minuteWindowResetAt) {
            return
        }

        const timeoutMs = Math.max(0, minuteWindowResetAt - Date.now())

        const timeoutId = window.setTimeout(() => {
            const nextResetAt = getNextMinuteBoundaryEpochMs()
            setMinuteWindowResetAt(nextResetAt)
            clearStoredMinuteUsage()
        }, timeoutMs)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [minuteWindowResetAt])

    useEffect(() => {
        if (!userId) {
            return
        }

        setQuotaError(null)
        setIsLoadingQuota(true)

        const stored = getStoredQuotaSnapshot()
        if (stored && stored.userId === userId) {
            setQuotaStatus({
                userId: stored.userId,
                currentPlan: stored.currentPlan,
                monthlyTokensUsed: stored.monthlyTokensUsed,
                monthlyTokensRemaining: stored.monthlyTokensRemaining,
                monthlyResetDate: stored.monthlyResetDate,
            })
            updatePlan(stored.currentPlan)
        } else {
            setQuotaStatus(null)
        }

        setIsLoadingQuota(false)
    }, [updatePlan, userId])

    const sendingIsBlocked =
        isGenerating || isQuotaExhausted || blockedCountdown > 0 || !session || isLoadingQuota

    async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setDashboardError(null)

        if (!userId || isGenerating) {
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
                userId,
                prompt: promptValues.prompt.trim(),
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
            setStoredQuotaSnapshot({
                userId: generationResponse.userId,
                currentPlan: generationResponse.currentPlan,
                monthlyTokensUsed: generationResponse.monthlyTokensUsed,
                monthlyTokensRemaining: generationResponse.monthlyTokensRemaining,
                monthlyResetDate: generationResponse.monthlyResetDate,
            })

            const nextResetAt = getNextMinuteBoundaryEpochMs()
            setMinuteWindowResetAt(nextResetAt)
            setStoredMinuteUsage({
                requestsUsedInCurrentMinute: generationResponse.requestsUsedInCurrentMinute,
                requestsRemainingInCurrentMinute:
                    generationResponse.requestsRemainingInCurrentMinute,
                resetAtEpochMs: nextResetAt,
            })
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
        if (!userId) {
            return
        }

        setUpgradeError(null)
        try {
            setIsUpgrading(true)
            const upgradeResponse = await upgradePlan(userId)
            updatePlan(upgradeResponse.toPlan)
            setQuotaStatus((currentStatus) =>
                currentStatus
                    ? {
                        ...currentStatus,
                        currentPlan: upgradeResponse.toPlan,
                    }
                    : currentStatus
            )
            setShowUpgradeModal(false)
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
        <main className="min-h-screen pb-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-4 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-4 rounded-[2rem] border border-border/80 bg-card/70 p-4 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.8)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                                SlopGPT Chat
                            </p>
                            <PlanBadge plan={effectivePlan} />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Conversación de IA
                        </h1>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            Autenticado como <strong>{session?.username}</strong>. Escribe un prompt y revisa la respuesta como en una interfaz de chat real.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => navigate(ROUTES.usage)}>
                            Uso
                        </Button>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut data-icon="inline-start" />
                            Cerrar sesión
                        </Button>
                    </div>
                </header>

                {dashboardError ? (
                    <Alert tone="error" title="Error de generación" message={dashboardError} />
                ) : null}

                {quotaError ? (
                    <Alert
                        tone="warning"
                        title="Estado del plan"
                        message={quotaError}
                    />
                ) : null}

                <div className="flex flex-col gap-6">
                    <ResponsePanel response={lastResponse} />
                    <PromptComposer
                        values={promptValues}
                        errors={promptErrors}
                        isSubmitting={isGenerating}
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
