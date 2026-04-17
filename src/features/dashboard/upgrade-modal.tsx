import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Spinner } from "@/components/ui/spinner"
import type { Plan } from "@/types/contracts"

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
    const canUpgrade = currentPlan !== "ENTERPRISE"

    return (
        <Modal
            open={open}
            title="Actualizar plan"
            description="Confirma la actualización del plan para seguir generando texto cuando el cupo mensual se agote."
            onClose={onClose}
            footer={
                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={onConfirm} disabled={!canUpgrade || isUpgrading}>
                        {isUpgrading ? (
                            <>
                                <Spinner data-icon="inline-start" />
                                Actualizando...
                            </>
                        ) : (
                            "Actualizar a PRO"
                        )}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                    Tu plan actual es <strong>{currentPlan}</strong>. El backend devolverá el nuevo estado del plan cuando confirme la actualización.
                </p>
                {currentPlan === "ENTERPRISE" ? (
                    <Alert
                        tone="info"
                        message="El plan ENTERPRISE ya no necesita una actualización desde este flujo."
                    />
                ) : null}
                {errorMessage ? <Alert tone="error" message={errorMessage} /> : null}
            </div>
        </Modal>
    )
}