import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { ROUTES } from "@/config/routes"
import { AuthProvider } from "@/features/auth/auth-context"
import { ProtectedRoute } from "@/features/auth/protected-route"
import { PublicOnlyRoute } from "@/features/auth/public-only-route"
import { DashboardPage } from "@/features/dashboard/chat-page"
import { LoginPage } from "@/features/auth/login-page"
import { RegisterPage } from "@/features/auth/register-page"
import { UsagePage } from "@/features/dashboard/data-usage-page"
import { NotFoundPage } from "@/pages/not-found-page"

export function AppRouter() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route
                        path={ROUTES.login}
                        element={
                            <PublicOnlyRoute>
                                <LoginPage />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.register}
                        element={
                            <PublicOnlyRoute>
                                <RegisterPage />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route
                        path={ROUTES.dashboard}
                        element={
                            <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path={ROUTES.usage}
                        element={
                            <ProtectedRoute>
                                <UsagePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path={ROUTES.notFound} element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to={ROUTES.notFound} replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}
