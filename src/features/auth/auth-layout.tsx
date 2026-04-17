import { Link } from "react-router-dom"

import { ROUTES } from "@/config/routes"

export function AuthLayout({
    title,
    subtitle,
    children,
    alternateAction,
}: {
    title: string
    subtitle: string
    children: React.ReactNode
    alternateAction: {
        text: string
        linkText: string
        to: string
    }
}) {
    return (
        <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35" />
            <div className="relative mx-auto flex w-full max-w-lg flex-col gap-6 border border-border bg-card p-6 shadow-sm">
                <header className="flex flex-col gap-3">
                    <Link
                        to={ROUTES.login}
                        className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
                    >
                        SlopGPT
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </header>
                {children}
                <p className="text-xs text-muted-foreground">
                    {alternateAction.text}{" "}
                    <Link className="font-semibold text-foreground underline" to={alternateAction.to}>
                        {alternateAction.linkText}
                    </Link>
                </p>
            </div>
        </main>
    )
}
