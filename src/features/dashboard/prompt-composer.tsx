import { Sparkles } from "lucide-react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type PromptComposerValues = {
    prompt: string
    maxOutputTokens: string
}

type PromptComposerErrors = {
    prompt?: string
    maxOutputTokens?: string
}

export function PromptComposer({
    values,
    errors,
    isSubmitting,
    estimator,
    disabled,
    helperMessage,
    onFieldChange,
    onSubmit,
}: {
    values: PromptComposerValues
    errors: PromptComposerErrors
    isSubmitting: boolean
    estimator: {
        promptTokens: number
        consumedTokens: number
    }
    disabled: boolean
    helperMessage: string | null
    onFieldChange: (name: keyof PromptComposerValues, value: string) => void
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Prompt generation</CardTitle>
                <CardDescription>
                    Token estimation uses the same deterministic backend formula.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {helperMessage ? (
                    <Alert tone="warning" title="Submission paused" message={helperMessage} />
                ) : null}
                <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="prompt" className="text-xs font-semibold tracking-wide uppercase">
                            Prompt
                        </label>
                        <Textarea
                            id="prompt"
                            value={values.prompt}
                            onChange={(event) => onFieldChange("prompt", event.target.value)}
                            aria-invalid={Boolean(errors.prompt)}
                            placeholder="Explain proxy pattern in simple terms"
                        />
                        {errors.prompt ? <p className="text-xs text-destructive">{errors.prompt}</p> : null}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="maxOutputTokens"
                            className="text-xs font-semibold tracking-wide uppercase"
                        >
                            Max output tokens
                        </label>
                        <Input
                            id="maxOutputTokens"
                            value={values.maxOutputTokens}
                            onChange={(event) => onFieldChange("maxOutputTokens", event.target.value)}
                            inputMode="numeric"
                            aria-invalid={Boolean(errors.maxOutputTokens)}
                        />
                        {errors.maxOutputTokens ? (
                            <p className="text-xs text-destructive">{errors.maxOutputTokens}</p>
                        ) : null}
                    </div>

                    <div className="grid gap-2 border border-border bg-muted p-3 text-xs sm:grid-cols-2">
                        <p>
                            Prompt tokens estimate: <strong>{estimator.promptTokens}</strong>
                        </p>
                        <p>
                            Total consumed estimate: <strong>{estimator.consumedTokens}</strong>
                        </p>
                    </div>

                    <Button type="submit" className="h-10 text-sm" disabled={disabled || isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner data-icon="inline-start" />
                                Sending prompt...
                            </>
                        ) : (
                            <>
                                <Sparkles data-icon="inline-start" />
                                Send prompt
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
