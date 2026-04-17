/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react"

import {
    clearStoredSession,
    getStoredSession,
    setStoredSession,
} from "@/lib/storage"
import type { AuthSession, Plan } from "@/types/contracts"

type AuthContextValue = {
    session: AuthSession | null
    isAuthenticated: boolean
    signIn: (session: AuthSession) => void
    signOut: () => void
    updatePlan: (nextPlan: Plan) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(() =>
        getStoredSession()
    )

    const contextValue = useMemo<AuthContextValue>(() => {
        return {
            session,
            isAuthenticated: session !== null,
            signIn: (nextSession) => {
                setSession(nextSession)
                setStoredSession(nextSession)
            },
            signOut: () => {
                setSession(null)
                clearStoredSession()
            },
            updatePlan: (nextPlan) => {
                setSession((currentSession) => {
                    if (!currentSession) {
                        return null
                    }

                    if (currentSession.currentPlan === nextPlan) {
                        return currentSession
                    }

                    const updatedSession = {
                        ...currentSession,
                        currentPlan: nextPlan,
                    }
                    setStoredSession(updatedSession)
                    return updatedSession
                })
            },
        }
    }, [session])

    return (
        <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider")
    }

    return context
}
