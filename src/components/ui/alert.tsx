import type { LucideIcon } from "lucide-react"
import { AlertCircle, CircleCheckBig, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

type AlertTone = "error" | "success" | "warning" | "info"

const toneStyles: Record<AlertTone, { container: string; icon: LucideIcon }> = {
    error: {
        container: "border-destructive/40 bg-destructive/10 text-destructive",
        icon: AlertCircle,
    },
    success: {
        container: "border-emerald-300 bg-emerald-100 text-emerald-800",
        icon: CircleCheckBig,
    },
    warning: {
        container: "border-amber-300 bg-amber-100 text-amber-900",
        icon: TriangleAlert,
    },
    info: {
        container: "border-border bg-muted text-foreground",
        icon: AlertCircle,
    },
}

export function Alert({
    tone = "info",
    title,
    message,
    className,
}: {
    tone?: AlertTone
    title?: string
    message: string
    className?: string
}) {
    const Icon = toneStyles[tone].icon
    return (
        <div className={cn("flex gap-2 border p-3 text-xs", toneStyles[tone].container, className)}>
            <Icon className="mt-0.5 size-4" aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-1">
                {title ? <p className="font-semibold">{title}</p> : null}
                <p>{message}</p>
            </div>
        </div>
    )
}
