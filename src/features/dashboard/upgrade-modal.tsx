import { useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Spinner } from "@/components/ui/spinner"
import type { Plan } from "@/types/contracts"

type UpgradePaymentForm = {
    cardholderName: string
    cardLast4: string
}

const initialPaymentForm: UpgradePaymentForm = {
    cardholderName: "",
    cardLast4: "",
}

export function UpgradeModal({
    open,
    currentPlan,
    isUpgrading,
    errorMessage,
    onClose,
    onConfirm,
}: {
    open: boolean
    currentPlan: Plan
    isUpgrading: boolean
    errorMessage: string | null
    onClose: () => void
    onConfirm: () => Promise<void>
}) {
    const [paymentForm, setPaymentForm] = useState(initialPaymentForm)
    const [simulationStep, setSimulationStep] = useState<"idle" | "processing">("idle")
    const [formError, setFormError] = useState<string | null>(null)

    const canUpgrade = currentPlan === "FREE"

    async function handleConfirm() {
        setFormError(null)

        if (!canUpgrade) {
            setFormError("Tu plan actual no requiere una actualización mediante este flujo.")
            return
        }

        if (paymentForm.cardholderName.trim().length === 0) {
            setFormError("El nombre del titular es obligatorio para la simulación.")
            return
        }

        if (!/^\d{4}$/.test(paymentForm.cardLast4.trim())) {
            setFormError("Ingresa exactamente 4 dígitos de la tarjeta para el campo de simulación.")
            return
        }

        setSimulationStep("processing")
        await new Promise((resolve) => {
            window.setTimeout(resolve, 1000)
        })

        await onConfirm()
        setSimulationStep("idle")
    }

    return (
        <Modal
            open={open}
            title="Actualizar plan"
            description="Pago simulado para desbloquear límites mensuales de tokens más altos."
            onClose={onClose}
            footer={
                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!canUpgrade || isUpgrading || simulationStep === "processing"}
                    >
                        {isUpgrading || simulationStep === "processing" ? (
                            <>
                                <Spinner data-icon="inline-start" />
                                Procesando...
                            </>
                        ) : (
                            "Actualizar a PRO"
                        )}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="cardholderName"
                            className="text-xs font-semibold tracking-wide uppercase"
                        >
                            Nombre del titular
                        </label>
                        <Input
                            id="cardholderName"
                            value={paymentForm.cardholderName}
                            onChange={(event) =>
                                setPaymentForm((current) => ({
                                    ...current,
                                    cardholderName: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="cardLast4" className="text-xs font-semibold tracking-wide uppercase">
                            Últimos 4 dígitos de la tarjeta
                        </label>
                        <Input
                            id="cardLast4"
                            value={paymentForm.cardLast4}
                            inputMode="numeric"
                            maxLength={4}
                            onChange={(event) =>
                                setPaymentForm((current) => ({
                                    ...current,
                                    cardLast4: event.target.value.replace(/\D/g, "").slice(0, 4),
                                }))
                            }
                        />
                    </div>
                </div>
                <p className="border border-border bg-muted p-3 text-xs text-muted-foreground">
                    Esta es una simulación de pago en el frontend. El plan solo se actualiza después de
                    que el backend confirme el endpoint de actualización.
                </p>
                {formError ? <Alert tone="error" message={formError} /> : null}
                {errorMessage ? <Alert tone="error" message={errorMessage} /> : null}
            </div>
        </Modal>
    )
}
