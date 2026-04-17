import { Alert } from "@/components/ui/alert"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { QuotaStatusResponseDto } from "@/types/contracts"

function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value)
}

export function QuotaIndicatorCard({
    isLoading,
    status,
    errorMessage,
}: {
    isLoading: boolean
    status: QuotaStatusResponseDto | null
    errorMessage: string | null
}) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly quota</CardTitle>
                    <CardDescription>Loading usage...</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!status) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly quota</CardTitle>
                    <CardDescription>Usage data unavailable.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert
                        tone="warning"
                        message={errorMessage ?? "Could not load quota status from backend."}
                    />
                </CardContent>
            </Card>
        )
    }

    if (status.currentPlan === "ENTERPRISE") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly quota</CardTitle>
                    <CardDescription>Unlimited usage on ENTERPRISE plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border border-border bg-muted p-3 text-sm">Unlimited</div>
                </CardContent>
            </Card>
        )
    }

    const totalTokens = status.monthlyTokensUsed + status.monthlyTokensRemaining
    const progressValue = totalTokens === 0 ? 0 : (status.monthlyTokensUsed / totalTokens) * 100

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly quota</CardTitle>
                <CardDescription>Resets on {status.monthlyResetDate}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Progress value={progressValue} />
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <p>
                        Used: <strong>{formatNumber(status.monthlyTokensUsed)}</strong>
                    </p>
                    <p>
                        Remaining: <strong>{formatNumber(status.monthlyTokensRemaining)}</strong>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
