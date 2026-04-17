import { Bot, LogOut, Sparkles } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { validatePrompt } from "@/features/auth/validation"
import { estimatePromptTokens } from "@/features/dashboard/token-estimator"
import { useCountdown } from "@/hooks/use-countdown"
import {
    clearStoredLastResponse,
    clearStoredMinuteUsage,
    clearStoredQuotaSnapshot,
    getStoredLastResponse,
    getStoredMinuteUsage,
    getStoredQuotaSnapshot,
    setStoredLastResponse,
    setStoredMinuteUsage,
    setStoredQuotaSnapshot,
} from "@/lib/storage"
import { getNextMinuteBoundaryEpochMs } from "@/lib/time"
import { cn } from "@/lib/utils"
import { generatePrompt } from "@/services/ai-service"
import { ApiClientError } from "@/services/api/client"
import { upgradePlan } from "@/services/quota-service"
import type {
    GenerateResponseDto,
    QuotaStatusResponseDto,
} from "@/types/contracts"

import { DashboardTabs } from "./dashboard-tabs"
import { PlanBadge } from "./plan-badge"
import { PromptComposer } from "./prompt-composer"
import { UpgradeModal } from "./upgrade-modal"

type PromptFormState = {
    prompt: string
}

type PromptFieldErrors = Partial<Record<keyof PromptFormState, string>>

type ChatMessage = {
    id: string
    role: "user" | "assistant"
    content: string
    tokenCount?: number
    processingTimeMs?: number
    promptTokens?: number
    consumedTokens?: number
    state?: "pending" | "error"
}

const initialPromptState: PromptFormState = {
    prompt: "",
}

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function cleanGeneratedText(value: string) {
    return value.replace(/^\s*Prompt fragment:\s*/i, "").trimStart()
}

function createWelcomeMessage(): ChatMessage {
    return {
        id: createId("assistant"),
        role: "assistant",
        content: "Empieza con un prompt y responderé aquí como en un chat real.",
    }
}

function createAssistantMessageFromResponse(
    response: GenerateResponseDto
): ChatMessage {
    return {
        id: createId("assistant"),
        role: "assistant",
        content: cleanGeneratedText(response.generatedText),
        processingTimeMs: response.processingTimeMs,
        promptTokens: response.promptTokens,
        consumedTokens: response.consumedTokens,
    }
}

function createUserMessage(content: string, tokenCount: number): ChatMessage {
    return {
        id: createId("user"),
        role: "user",
        content,
        tokenCount,
    }
}

function createPendingAssistantMessage(): ChatMessage {
    return {
        id: createId("assistant"),
        role: "assistant",
        content: "Generating response...",
        state: "pending",
    }
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
    const userId = session?.userId ?? null
    const [promptValues, setPromptValues] =
        useState<PromptFormState>(initialPromptState)
    const [promptErrors, setPromptErrors] = useState<PromptFieldErrors>({})
    const [isGenerating, setIsGenerating] = useState(false)
    const [dashboardError, setDashboardError] = useState<string | null>(null)
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
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const storedResponse = getStoredLastResponse()

        if (storedResponse) {
            return [createAssistantMessageFromResponse(storedResponse)]
        }

        return [createWelcomeMessage()]
    })
    const [minuteWindowResetAt, setMinuteWindowResetAt] = useState<number | null>(
        () => resolveInitialMinuteResetAt()
    )
    const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [upgradeError, setUpgradeError] = useState<string | null>(null)
    const [isUpgrading, setIsUpgrading] = useState(false)

    const transcriptRef = useRef<HTMLDivElement | null>(null)
    const transcriptEndRef = useRef<HTMLDivElement | null>(null)

    const estimatedTokens = useMemo(
        () => estimatePromptTokens(promptValues.prompt),
        [promptValues.prompt]
    )
    const blockedCountdown = useCountdown(rateLimitUntil)
    const minuteResetCountdown = useCountdown(minuteWindowResetAt)

    const effectivePlan =
        quotaStatus?.currentPlan ?? session?.currentPlan ?? "FREE"

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
        const container = transcriptRef.current
        const endMarker = transcriptEndRef.current

        if (!container || !endMarker) {
            return
        }

        endMarker.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [messages, isGenerating])

    useEffect(() => {
        if (!minuteWindowResetAt) {
            return
        }

        const timeoutMs = Math.max(0, minuteWindowResetAt - Date.now())

        const timeoutId = window.setTimeout(() => {
            setMinuteWindowResetAt(getNextMinuteBoundaryEpochMs())
            clearStoredMinuteUsage()
        }, timeoutMs)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [minuteWindowResetAt])

    const sendingIsBlocked =
        isGenerating || isQuotaExhausted || blockedCountdown > 0 || !session

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

        const submittedPrompt = promptValues.prompt.trim()
        const userMessage = createUserMessage(submittedPrompt, estimatedTokens)
        const pendingAssistantMessage = createPendingAssistantMessage()

        setMessages((currentMessages) => [
            ...currentMessages,
            userMessage,
            pendingAssistantMessage,
        ])
        setPromptValues(initialPromptState)

        try {
            setIsGenerating(true)

            const generationResponse = await generatePrompt({
                userId,
                prompt: submittedPrompt,
            })

            setMessages((currentMessages) =>
                currentMessages.map((message) => {
                    if (message.id !== pendingAssistantMessage.id) {
                        return message
                    }

                    return {
                        ...message,
                        content: cleanGeneratedText(generationResponse.generatedText),
                        processingTimeMs: generationResponse.processingTimeMs,
                        promptTokens: generationResponse.promptTokens,
                        consumedTokens: generationResponse.consumedTokens,
                        state: undefined,
                    }
                })
            )
            setStoredLastResponse(generationResponse)
            setDashboardError(null)

            const nextQuotaStatus = {
                userId: generationResponse.userId,
                currentPlan: generationResponse.currentPlan,
                monthlyTokensUsed: generationResponse.monthlyTokensUsed,
                monthlyTokensRemaining: generationResponse.monthlyTokensRemaining,
                monthlyResetDate: generationResponse.monthlyResetDate,
            }

            setQuotaStatus(nextQuotaStatus)
            updatePlan(generationResponse.currentPlan)
            setStoredQuotaSnapshot(nextQuotaStatus)

            const nextResetAt = getNextMinuteBoundaryEpochMs()
            setMinuteWindowResetAt(nextResetAt)
            setStoredMinuteUsage({
                requestsUsedInCurrentMinute:
                    generationResponse.requestsUsedInCurrentMinute,
                requestsRemainingInCurrentMinute:
                    generationResponse.requestsRemainingInCurrentMinute,
                resetAtEpochMs: nextResetAt,
            })
        } catch (error) {
            if (error instanceof ApiClientError) {
                if (error.status === 429) {
                    const retryAfterSeconds = error.metadata.retryAfterSeconds ?? 60
                    setRateLimitUntil(Date.now() + retryAfterSeconds * 1000)
                    setMessages((currentMessages) =>
                        currentMessages.map((message) =>
                            message.id === pendingAssistantMessage.id
                                ? {
                                    ...message,
                                    content:
                                        "Rate limit reached. Please wait for the timer to expire.",
                                    state: "error",
                                }
                                : message
                        )
                    )
                    setDashboardError(
                        "Alcanzaste el límite por minuto. El envío queda pausado hasta que termine el temporizador."
                    )
                    return
                }

                if (error.status === 402) {
                    setShowUpgradeModal(true)
                    setMessages((currentMessages) =>
                        currentMessages.map((message) =>
                            message.id === pendingAssistantMessage.id
                                ? {
                                    ...message,
                                    content:
                                        "Monthly quota exhausted. Open the upgrade flow to continue.",
                                    state: "error",
                                }
                                : message
                        )
                    )
                    setDashboardError(
                        "El cupo mensual se agotó. Se abrió el flujo de actualización para que puedas continuar."
                    )
                    return
                }
            }

            setMessages((currentMessages) =>
                currentMessages.map((message) =>
                    message.id === pendingAssistantMessage.id
                        ? {
                            ...message,
                            content: "No se pudo generar la respuesta. Inténtalo de nuevo.",
                            state: "error",
                        }
                        : message
                )
            )
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
        clearStoredQuotaSnapshot()
    }

    function renderMessage(message: ChatMessage) {
        const isUser = message.role === "user"

        return (
            <div
                key={message.id}
                className={isUser ? "flex justify-end" : "flex justify-start"}
            >
                <article
                    className={cn(
                        "flex max-w-[88%] flex-col gap-3 rounded-[1.75rem] border px-4 py-3 shadow-sm sm:max-w-[74%]",
                        isUser
                            ? "border-primary/20 bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground"
                    )}
                >
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[0.7rem] font-semibold tracking-[0.22em] uppercase opacity-80">
                            {isUser ? "You" : "Assistant"}
                        </p>
                        {!isUser && message.processingTimeMs ? (
                            <p className="text-[0.7rem] opacity-70">
                                {message.processingTimeMs} ms
                            </p>
                        ) : null}
                    </div>
                    <p className="text-sm leading-7 whitespace-pre-wrap">
                        {message.content}
                    </p>
                    {isUser ? (
                        <p className="text-[0.72rem] opacity-80">
                            Estimated tokens: {message.tokenCount}
                        </p>
                    ) : message.consumedTokens ? (
                        <div className="flex flex-wrap gap-2 text-[0.7rem] text-muted-foreground">
                            <span className="rounded-full border border-border bg-muted px-2 py-1">
                                Prompt {message.promptTokens} tokens
                            </span>
                            <span className="rounded-full border border-border bg-muted px-2 py-1">
                                Total {message.consumedTokens} tokens
                            </span>
                        </div>
                    ) : null}
                </article>
            </div>
        )
    }

    return (
        <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col gap-5">
                <header className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
                                    SlopGPT Chat
                                </p>
                                <PlanBadge plan={effectivePlan} />
                                <Badge variant="neutral">{messages.length} messages</Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <DashboardTabs />
                            <Button variant="outline" onClick={handleLogout}>
                                <LogOut data-icon="inline-start" />
                                Cerrar sesión
                            </Button>
                        </div>
                    </div>
                </header>

                {dashboardError ? (
                    <Alert
                        tone="error"
                        title="Error de generación"
                        message={dashboardError}
                    />
                ) : null}

                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                    <div
                        ref={transcriptRef}
                        className="flex-1 overflow-y-auto p-4 sm:p-6"
                    >
                        <div className="flex flex-col gap-4">
                            {messages.map(renderMessage)}
                            {isGenerating ? (
                                <div className="flex justify-start">
                                    <article className="flex max-w-[88%] flex-col gap-3 rounded-[1.75rem] border border-border bg-background px-4 py-3 shadow-sm sm:max-w-[74%]">
                                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                                            <Sparkles className="size-4" aria-hidden="true" />
                                            Generating
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Bot className="size-4" aria-hidden="true" />
                                            Crafting a response now...
                                        </div>
                                    </article>
                                </div>
                            ) : null}
                            <div ref={transcriptEndRef} />
                        </div>
                    </div>

                    <div className="border-t border-border bg-background/80 p-4 sm:p-6">
                        <PromptComposer
                            values={promptValues}
                            errors={promptErrors}
                            isSubmitting={isGenerating}
                            tokenEstimate={estimatedTokens}
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
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <p>
                                Los tokens estimados se recalculan cada vez que cambia el
                                mensaje.
                            </p>
                            <p>Reinicio por minuto en {minuteResetCountdown}s</p>
                        </div>
                    </div>
                </section>
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
