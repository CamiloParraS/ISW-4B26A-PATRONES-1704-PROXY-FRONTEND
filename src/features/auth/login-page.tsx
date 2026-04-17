import { useLocation, useNavigate } from "react-router-dom"
import { useMemo, useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/config/routes"
import { useAuth } from "@/features/auth/auth-context"
import { AuthLayout } from "@/features/auth/auth-layout"
import {
    hasFieldErrors,
    validateLogin,
    type AuthFieldErrors,
} from "@/features/auth/validation"
import { ApiClientError } from "@/services/api/client"
import { loginUser } from "@/services/auth-service"

type LoginFormState = {
    identifier: string
    encryptedPassword: string
}

const initialValues: LoginFormState = {
    identifier: "",
    encryptedPassword: "",
}

function getLoginErrorMessage(error: unknown) {
    if (error instanceof ApiClientError) {
        if (error.status === 400) {
            return "Invalid credentials. Use your userId, email, or username plus encrypted password."
        }

        if (error.status >= 500) {
            return "The server is unavailable right now. Please try again shortly."
        }
    }

    return "Login failed. Please verify your credentials and try again."
}

export function LoginPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const { signIn } = useAuth()
    const [values, setValues] = useState(initialValues)
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<LoginFormState>>(
        {}
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const registrationSuccess = Boolean(
        (location.state as { registrationSuccess?: boolean } | null)
            ?.registrationSuccess
    )

    const canSubmit = useMemo(() => {
        return !isSubmitting
    }, [isSubmitting])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        const nextFieldErrors = validateLogin(values)
        setFieldErrors(nextFieldErrors)
        if (hasFieldErrors(nextFieldErrors) || isSubmitting) {
            return
        }

        try {
            setIsSubmitting(true)
            const loginResult = await loginUser({
                identifier: values.identifier.trim(),
                encryptedPassword: values.encryptedPassword.trim(),
            })

            signIn({
                userId: loginResult.userId,
                email: loginResult.email,
                username: loginResult.username,
                currentPlan: loginResult.currentPlan,
            })

            navigate(ROUTES.dashboard, { replace: true })
        } catch (error) {
            setErrorMessage(getLoginErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in with identifier and encrypted password to continue."
            alternateAction={{
                text: "Need an account?",
                linkText: "Register",
                to: ROUTES.register,
            }}
        >
            {registrationSuccess ? (
                <Alert
                    tone="success"
                    title="Registration complete"
                    message="Your account was created. You can sign in now."
                />
            ) : null}
            {errorMessage ? (
                <Alert tone="error" title="Login failed" message={errorMessage} />
            ) : null}
            <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="identifier"
                        className="text-xs font-semibold tracking-wide uppercase"
                    >
                        Identifier (email, username, or user ID)
                    </label>
                    <Input
                        id="identifier"
                        value={values.identifier}
                        onChange={(event) =>
                            setValues((currentValues) => ({
                                ...currentValues,
                                identifier: event.target.value,
                            }))
                        }
                        aria-invalid={Boolean(fieldErrors.identifier)}
                        autoComplete="username"
                    />
                    {fieldErrors.identifier ? (
                        <p className="text-xs text-destructive">{fieldErrors.identifier}</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="encryptedPassword"
                        className="text-xs font-semibold tracking-wide uppercase"
                    >
                        Encrypted Password
                    </label>
                    <Input
                        id="encryptedPassword"
                        value={values.encryptedPassword}
                        onChange={(event) =>
                            setValues((currentValues) => ({
                                ...currentValues,
                                encryptedPassword: event.target.value,
                            }))
                        }
                        aria-invalid={Boolean(fieldErrors.encryptedPassword)}
                        autoComplete="current-password"
                        type="password"
                    />
                    {fieldErrors.encryptedPassword ? (
                        <p className="text-xs text-destructive">{fieldErrors.encryptedPassword}</p>
                    ) : null}
                </div>

                <Button type="submit" disabled={!canSubmit} className="h-10 text-sm">
                    {isSubmitting ? (
                        <>
                            <Spinner data-icon="inline-start" />
                            Signing in...
                        </>
                    ) : (
                        "Login"
                    )}
                </Button>
            </form>
        </AuthLayout>
    )
}
