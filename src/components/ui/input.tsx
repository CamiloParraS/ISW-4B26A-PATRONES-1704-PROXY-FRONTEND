import { cn } from "@/lib/utils"

export function Input({ className, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            className={cn(
                "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60",
                className
            )}
            {...props}
        />
    )
}
