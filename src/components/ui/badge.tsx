import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2 py-1 text-[0.7rem] font-semibold tracking-wide uppercase",
    {
        variants: {
            variant: {
                neutral: "border-border bg-muted text-foreground",
                free: "border-sky-200 bg-sky-50 text-sky-800",
                pro: "border-emerald-200 bg-emerald-50 text-emerald-800",
                enterprise: "border-amber-200 bg-amber-50 text-amber-900",
                danger: "border-destructive/30 bg-destructive/5 text-destructive",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
)

export function Badge({
    className,
    variant,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
