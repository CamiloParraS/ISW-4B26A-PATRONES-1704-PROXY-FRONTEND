import { Link, useNavigate } from "react-router-dom"
import { useMemo, useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/config/routes"
import { AuthLayout } from "@/features/auth/auth-layout"
import {
    hasFieldErrors,
    validateRegister,
    type AuthFieldErrors,
} from "@/features/auth/validation"
import { ApiClientError } from "@/services/api/client"
import { registerUser } from "@/services/auth-service"

type RegisterFormState = {
    userId: string
    email: string
    username: string
    encryptedPassword: string
}

const initialValues: RegisterFormState = {
    userId: "",
    email: "",
    username: "",
    encryptedPassword: "",
}

function getRegistrationErrorMessage(error: unknown) {
    if (error instanceof ApiClientError) {
        if (error.status === 409) {
            return "Ya existe una cuenta con este ID de usuario, nombre de usuario o correo."
        }

        if (error.status === 400) {
            return error.message
        }

        if (error.status >= 500) {
            return "El servidor no está disponible en este momento. Inténtalo de nuevo en breve."
        }
    }

    return "El registro falló. Verifica tus datos e inténtalo de nuevo."
}

export function RegisterPage() {
    const navigate = useNavigate()
    const [values, setValues] = useState(initialValues)
    const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors<RegisterFormState>>(
        {}
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const canSubmit = useMemo(() => {
        return !isSubmitting
    }, [isSubmitting])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setErrorMessage(null)

        const nextFieldErrors = validateRegister(values)
        setFieldErrors(nextFieldErrors)

        if (hasFieldErrors(nextFieldErrors) || isSubmitting) {
            return
        }

        try {
            setIsSubmitting(true)
            await registerUser({
                userId: values.userId.trim(),
                email: values.email.trim(),
                username: values.username.trim(),
                encryptedPassword: values.encryptedPassword.trim(),
            })

            navigate(ROUTES.login, {
                replace: true,
                state: {
                    registrationSuccess: true,
                },
            })
        } catch (error) {
            setErrorMessage(getRegistrationErrorMessage(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthLayout
            title="Crear cuenta"
            subtitle="Regístrate con la contraseña cifrada recibida desde tu flujo de autenticación del backend."
            alternateAction={{
                text: "¿Ya estás registrado?",
                linkText: "Inicia sesión",
                to: ROUTES.login,
            }}
        >
            {errorMessage ? (
                <Alert tone="error" title="Error de registro" message={errorMessage} />
            ) : null}
            <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
                <div className="flex flex-col gap-1">
                    <label htmlFor="userId" className="text-xs font-semibold tracking-wide uppercase">
                        ID de usuario
                    </label>
                    <Input
                        id="userId"
                        value={values.userId}
                        onChange={(event) =>
                            setValues((currentValues) => ({
                                ...currentValues,
                                userId: event.target.value,
                            }))
                        }
                        aria-invalid={Boolean(fieldErrors.userId)}
                        autoComplete="username"
                    />
                    {fieldErrors.userId ? (
                        <p className="text-xs text-destructive">{fieldErrors.userId}</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="email" className="text-xs font-semibold tracking-wide uppercase">
                        Correo
                    </label>
                    <Input
                        id="email"
                        value={values.email}
                        type="email"
                        onChange={(event) =>
                            setValues((currentValues) => ({
                                ...currentValues,
                                email: event.target.value,
                            }))
                        }
                        aria-invalid={Boolean(fieldErrors.email)}
                        autoComplete="email"
                    />
                    {fieldErrors.email ? (
                        <p className="text-xs text-destructive">{fieldErrors.email}</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="username"
                        className="text-xs font-semibold tracking-wide uppercase"
                    >
                        Nombre de usuario
                    </label>
                    <Input
                        id="username"
                        value={values.username}
                        onChange={(event) =>
                            setValues((currentValues) => ({
                                ...currentValues,
                                username: event.target.value,
                            }))
                        }
                        aria-invalid={Boolean(fieldErrors.username)}
                    />
                    {fieldErrors.username ? (
                        <p className="text-xs text-destructive">{fieldErrors.username}</p>
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
                        autoComplete="new-password"
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
                            Creando cuenta...
                        </>
                    ) : (
                        "Registrarse"
                    )}
                </Button>
            </form>
            <Link className="text-xs text-muted-foreground underline" to={ROUTES.login}>
                Volver al inicio de sesión
            </Link>
        </AuthLayout>
    )
}
