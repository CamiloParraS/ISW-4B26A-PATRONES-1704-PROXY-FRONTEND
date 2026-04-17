import { useEffect, useId } from "react"

import { Button } from "@/components/ui/button"

type ModalProps = {
    open: boolean
    title: string
    description?: string
    onClose: () => void
    children: React.ReactNode
    footer?: React.ReactNode
}

export function Modal({
    open,
    title,
    description,
    onClose,
    children,
    footer,
}: ModalProps) {
    const descriptionId = useId()

    useEffect(() => {
        if (!open) {
            return undefined
        }

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", onEscape)
        return () => {
            window.removeEventListener("keydown", onEscape)
        }
    }, [open, onClose])

    if (!open) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
            <div
                className="w-full max-w-lg border border-border bg-card text-card-foreground"
                role="dialog"
                aria-modal="true"
                aria-describedby={description ? descriptionId : undefined}
            >
                <header className="flex items-start justify-between gap-4 border-b border-border p-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-base font-semibold tracking-wide uppercase">{title}</h2>
                        {description ? (
                            <p id={descriptionId} className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    <Button variant="outline" size="xs" onClick={onClose}>
                        Close
                    </Button>
                </header>
                <div className="p-4">{children}</div>
                {footer ? <footer className="border-t border-border p-4">{footer}</footer> : null}
            </div>
        </div>
    )
}
