import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GenerateResponseDto } from "@/types/contracts"

function MetaItem({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex items-center justify-between border-b border-border py-1 text-xs last:border-b-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    )
}

export function ResponsePanel({
    response,
}: {
    response: GenerateResponseDto | null
}) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Last AI response</CardTitle>
                <CardDescription>
                    The latest successful generation remains visible until replaced.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {response ? (
                    <>
                        <p className="max-h-40 overflow-y-auto border border-border bg-background p-3 text-sm">
                            {response.generatedText}
                        </p>
                        <div className="border border-border p-3">
                            <MetaItem label="Processing (ms)" value={response.processingTimeMs} />
                            <MetaItem label="Prompt tokens" value={response.promptTokens} />
                            <MetaItem
                                label="Output estimate"
                                value={response.outputTokensEstimate}
                            />
                            <MetaItem label="Consumed tokens" value={response.consumedTokens} />
                        </div>
                    </>
                ) : (
                    <p className="border border-border bg-muted p-3 text-sm text-muted-foreground">
                        No successful generations yet.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
