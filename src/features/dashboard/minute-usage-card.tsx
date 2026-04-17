import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { formatCountdown } from "@/lib/time"

export function MinuteUsageCard({
    requestsUsed,
    requestsRemaining,
    planLimitLabel,
    resetCountdownSeconds,
    blockedCountdownSeconds,
}: {
    requestsUsed: number
    requestsRemaining: number | string
    planLimitLabel: string
    resetCountdownSeconds: number
    blockedCountdownSeconds: number
}) {
    const isBlocked = blockedCountdownSeconds > 0

    return (
        <Card>
            <CardHeader>
                <CardTitle>Solicitudes por minuto</CardTitle>
                <CardDescription>
                    La ventana se reinicia en {formatCountdown(resetCountdownSeconds)}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
                <div className="grid grid-cols-2 gap-3 border border-border p-3">
                    <p className="text-muted-foreground">Usadas</p>
                    <p className="text-right font-semibold">{requestsUsed}</p>
                    <p className="text-muted-foreground">Restantes</p>
                    <p className="text-right font-semibold">{requestsRemaining}</p>
                    <p className="text-muted-foreground">Límite del plan</p>
                    <p className="text-right font-semibold">{planLimitLabel}</p>
                </div>
                {isBlocked ? (
                    <p className="border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                        Se alcanzó el límite de velocidad. Puedes enviar otra vez en {formatCountdown(blockedCountdownSeconds)}.
                    </p>
                ) : (
                    <p className="border border-border bg-muted p-2 text-xs text-muted-foreground">
                        Las solicitudes están disponibles en la ventana actual de un minuto.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
