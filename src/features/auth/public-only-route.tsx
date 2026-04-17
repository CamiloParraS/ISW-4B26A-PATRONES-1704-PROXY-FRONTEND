import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { ROUTES } from "@/config/routes"
import { useAuth } from "@/features/auth/auth-context"

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
        return <Navigate to={ROUTES.dashboard} replace />
    }

    return children
}
