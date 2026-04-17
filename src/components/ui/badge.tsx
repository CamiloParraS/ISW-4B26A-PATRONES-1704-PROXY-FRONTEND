import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center border px-2 py-1 text-[0.7rem] font-semibold tracking-wide uppercase",
    {
        variants: {
            variant: {
                neutral: "border-border bg-muted text-foreground",
                free: "border-slate-300 bg-slate-100 text-slate-800",
                pro: "border-emerald-300 bg-emerald-100 text-emerald-800",
                enterprise: "border-amber-300 bg-amber-100 text-amber-800",
                danger: "border-destructive/30 bg-destructive/10 text-destructive",
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
