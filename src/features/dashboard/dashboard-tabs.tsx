import { NavLink } from "react-router-dom"

import { ROUTES } from "@/config/routes"
import { cn } from "@/lib/utils"

const tabBaseClass =
    "rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"

export function DashboardTabs({ className }: { className?: string }) {
    return (
        <div className={cn("inline-flex rounded-full border border-border bg-background p-1", className)}>
            <NavLink
                end
                to={ROUTES.dashboard}
                className={({ isActive }) =>
                    cn(
                        tabBaseClass,
                        isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                }
            >
                Chat
            </NavLink>
            <NavLink
                to={ROUTES.usage}
                className={({ isActive }) =>
                    cn(
                        tabBaseClass,
                        isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                }
            >
                Data Usage
            </NavLink>
        </div>
    )
}
