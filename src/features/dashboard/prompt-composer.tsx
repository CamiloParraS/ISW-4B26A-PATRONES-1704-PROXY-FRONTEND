import { Sparkles } from "lucide-react"

import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

type PromptComposerValues = {
  prompt: string
}

type PromptComposerErrors = {
  prompt?: string
}

export function PromptComposer({
  values,
  errors,
  isSubmitting,
  tokenEstimate,
  disabled,
  helperMessage,
  onFieldChange,
  onSubmit,
}: {
  values: PromptComposerValues
  errors: PromptComposerErrors
  isSubmitting: boolean
  tokenEstimate: number
  disabled: boolean
  helperMessage: string | null
  onFieldChange: (name: keyof PromptComposerValues, value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        {helperMessage ? (
          <Alert tone="warning" title="Envío pausado" message={helperMessage} />
        ) : null}
        <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="prompt"
              className="p-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
            >
              Mensaje
            </label>
            <Textarea
              id="prompt"
              value={values.prompt}
              onChange={(event) => onFieldChange("prompt", event.target.value)}
              aria-invalid={Boolean(errors.prompt)}
              placeholder="Escribe tu pregunta, instrucción o idea para el modelo"
              className="min-h-40"
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                const ta = event.target as HTMLTextAreaElement
                if (event.ctrlKey) {
                  // Ctrl+Enter -> insert newline at caret
                  event.preventDefault()
                  const start = ta.selectionStart ?? values.prompt.length
                  const end = ta.selectionEnd ?? values.prompt.length
                  const newValue =
                    values.prompt.slice(0, start) +
                    "\n" +
                    values.prompt.slice(end)
                  onFieldChange("prompt", newValue)
                  // restore caret after the inserted newline
                  setTimeout(() => {
                    try {
                      ta.selectionStart = ta.selectionEnd = start + 1
                    } catch {
                      /* ignore */
                    }
                  }, 0)
                } else {
                  // Enter -> send message (submit form)
                  event.preventDefault()
                  const form = ta.form as HTMLFormElement | null
                  if (form) {
                    const maybeRequestSubmit = (
                      form as HTMLFormElement & { requestSubmit?: unknown }
                    ).requestSubmit
                    if (typeof maybeRequestSubmit === "function") {
                      ;(maybeRequestSubmit as () => void)()
                    } else {
                      form.dispatchEvent(
                        new Event("submit", { bubbles: true, cancelable: true })
                      )
                    }
                  }
                }
              }}
            />
            {errors.prompt ? (
              <p className="text-xs text-destructive">{errors.prompt}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Tokens estimados
              </p>
            </div>
            <Badge variant="neutral" className="text-sm">
              {tokenEstimate} tokens
            </Badge>
            <Button
              type="submit"
              className="h-11 w-full text-sm sm:w-auto sm:min-w-40"
              disabled={disabled || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Enviando mensaje...
                </>
              ) : (
                <>
                  <Sparkles data-icon="inline-start" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
