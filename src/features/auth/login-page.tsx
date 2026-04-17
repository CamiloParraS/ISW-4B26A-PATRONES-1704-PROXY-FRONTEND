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
            return "Credenciales inválidas. Usa tu ID de usuario, correo o nombre de usuario junto con la contraseña cifrada."
        }

        if (error.status >= 500) {
            return "El servidor no está disponible en este momento. Inténtalo de nuevo en breve."
        }
    }

    return "El inicio de sesión falló. Verifica tus credenciales e inténtalo de nuevo."
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
            title="Bienvenido de nuevo"
            subtitle="Inicia sesión con tu identificador y contraseña cifrada para continuar."
            alternateAction={{
                text: "¿Necesitas una cuenta?",
                linkText: "Regístrate",
                to: ROUTES.register,
            }}
        >
            {registrationSuccess ? (
                <Alert
                    tone="success"
                    title="Registro completado"
                    message="Tu cuenta fue creada. Ya puedes iniciar sesión."
                />
            ) : null}
            {errorMessage ? (
                <Alert tone="error" title="Error de inicio de sesión" message={errorMessage} />
            ) : null}
            <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="identifier"
                        className="text-xs font-semibold tracking-wide uppercase"
                    >
                        Identificador (correo, nombre de usuario o ID de usuario)
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
                        Contraseña cifrada
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
                            Iniciando sesión...
                        </>
                    ) : (
                        "Iniciar sesión"
                    )}
                </Button>
            </form>
        </AuthLayout>
    )
}
