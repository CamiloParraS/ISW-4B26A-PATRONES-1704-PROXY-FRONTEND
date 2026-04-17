import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DailyUsageDto } from "@/types/contracts"

function formatDayLabel(date: string) {
    const parsedDate = new Date(`${date}T00:00:00`)
    return parsedDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
    })
}

export function UsageHistoryChart({
    isLoading,
    history,
}: {
    isLoading: boolean
    history: DailyUsageDto[]
}) {
    const maxTokens = Math.max(...history.map((entry) => entry.tokensUsed), 1)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Last 7 days</CardTitle>
                <CardDescription>Daily token consumption from backend history.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-7 items-end gap-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <Skeleton key={index} className="h-28 w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="flex h-48 items-end gap-2 border border-border p-3">
                        {history.map((entry) => {
                            const barHeight = Math.max(4, Math.round((entry.tokensUsed / maxTokens) * 100))
                            return (
                                <div key={entry.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                    <span className="text-[0.65rem] text-muted-foreground">{entry.tokensUsed}</span>
                                    <div
                                        className="w-full bg-primary"
                                        style={{ height: `${barHeight}%` }}
                                        role="img"
                                        aria-label={`${entry.tokensUsed} tokens used on ${entry.date}`}
                                    />
                                    <span className="text-center text-[0.6rem] text-muted-foreground">
                                        {formatDayLabel(entry.date)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
