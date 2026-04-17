import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/config/routes"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
            <div className="flex max-w-lg flex-col gap-4 border border-border bg-card p-6 text-card-foreground">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    404
                </p>
                <h1 className="text-2xl font-semibold">Page not found</h1>
                <p className="text-sm text-muted-foreground">
                    The route you requested does not exist.
                </p>
                <div>
                    <Button onClick={() => navigate(ROUTES.dashboard)}>
                        Return to dashboard
                    </Button>
                </div>
            </div>
        </main>
    )
}
