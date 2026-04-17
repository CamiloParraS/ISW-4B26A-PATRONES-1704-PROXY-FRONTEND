import { cn } from "@/lib/utils"

export function Textarea({
    className,
    ...props
}: React.ComponentProps<"textarea">) {
    return (
        <textarea
            className={cn(
                "min-h-32 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
                className
            )}
            {...props}
        />
    )
}
