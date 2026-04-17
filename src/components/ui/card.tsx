import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.ComponentProps<"section">) {
    return (
        <section
            className={cn("border border-border bg-card text-card-foreground", className)}
            {...props}
        />
    )
}

export function CardHeader({
    className,
    ...props
}: React.ComponentProps<"header">) {
    return <header className={cn("flex flex-col gap-1 p-4", className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
    return (
        <h2 className={cn("text-sm font-semibold tracking-wide uppercase", className)} {...props} />
    )
}

export function CardDescription({
    className,
    ...props
}: React.ComponentProps<"p">) {
    return <p className={cn("text-xs text-muted-foreground", className)} {...props} />
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={cn("p-4 pt-0", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.ComponentProps<"footer">) {
    return <footer className={cn("border-t border-border p-4", className)} {...props} />
}
