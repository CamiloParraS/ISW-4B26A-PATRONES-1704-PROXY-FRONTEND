import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GenerateResponseDto } from "@/types/contracts"

function cleanGeneratedText(value: string) {
    return value.replace(/^\s*Prompt fragment:\s*/i, "").trimStart()
}

export function ResponsePanel({
    response,
}: {
    response: GenerateResponseDto | null
}) {
    const generatedText = response ? cleanGeneratedText(response.generatedText) : ""

    return (
        <Card className="h-full bg-card/70">
            <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <CardTitle>Respuesta del asistente</CardTitle>
                        <CardDescription>
                            La última respuesta exitosa permanece visible hasta que la reemplaces.
                        </CardDescription>
                    </div>
                    <Badge variant={response ? "pro" : "neutral"}>
                        {response ? "lista" : "vacía"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {response ? (
                    <>
                        <div className="rounded-2xl border border-border/80 bg-muted/60 p-4 text-sm leading-7 whitespace-pre-wrap">
                            {generatedText}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="neutral">Plan {response.currentPlan}</Badge>
                            <Badge variant="neutral">{response.processingTimeMs} ms</Badge>
                            <Badge variant="neutral">{response.consumedTokens} tokens</Badge>
                        </div>
                    </>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border/80 bg-muted/40 p-6 text-sm text-muted-foreground">
                        Aún no has generado una respuesta.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

