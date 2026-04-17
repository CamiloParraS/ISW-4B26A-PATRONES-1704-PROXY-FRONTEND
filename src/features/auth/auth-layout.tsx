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
        <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(15,23,42,0.05),transparent_24%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:36px_36px] opacity-15" />
            <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
                <section className="flex flex-col justify-between gap-10 rounded-[2rem] border border-border bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 lg:min-h-[720px]">
                    <div className="flex flex-col gap-8">
                        <Link
                            to={ROUTES.login}
                            className="inline-flex w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase"
                        >
                            SlopGPT
                        </Link>
                        <div className="flex max-w-2xl flex-col gap-4">
                            <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
                                AI workspace
                            </p>
                            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                                {title}
                            </h1>
                            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                                {subtitle}
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-3xl border border-border/80 bg-background/55 p-4">
                                <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                                    Chat-first
                                </p>
                                <p className="mt-2 text-sm text-foreground/90">
                                    Conversaciones limpias, respuestas grandes y menos ruido visual.
                                </p>
                            </div>
                            <div className="rounded-3xl border border-border/80 bg-background/55 p-4">
                                <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                                    Usage split
                                </p>
                                <p className="mt-2 text-sm text-foreground/90">
                                    El uso y la cuota viven en una vista separada, como en una app real.
                                </p>
                            </div>
                            <div className="rounded-3xl border border-border/80 bg-background/55 p-4">
                                <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                                    Fast access
                                </p>
                                <p className="mt-2 text-sm text-foreground/90">
                                    Acceso rápido, sin pasos innecesarios y con una jerarquía clara.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-[1.75rem] border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                        Diseñado para parecer una herramienta de chat de IA real: foco en prompt, respuesta y contexto.
                    </div>
                </section>

                <section className="flex items-center">
                    <div className="w-full rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
                        {children}
                        <p className="mt-6 text-xs text-muted-foreground">
                            {alternateAction.text}{" "}
                            <Link
                                className="font-semibold text-foreground underline underline-offset-4"
                                to={alternateAction.to}
                            >
                                {alternateAction.linkText}
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}
