type RegisterValues = {
  userId: string
  email: string
  username: string
  encryptedPassword: string
}

type LoginValues = {
  identifier: string
  encryptedPassword: string
}

export type AuthFieldErrors<TValues> = Partial<Record<keyof TValues, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister(values: RegisterValues) {
  const errors: AuthFieldErrors<RegisterValues> = {}

  if (values.userId.trim().length === 0) {
    errors.userId = "El ID de usuario es obligatorio."
  }

  if (values.email.trim().length === 0) {
    errors.email = "El correo es obligatorio."
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Ingresa un formato de correo válido."
  }

  if (values.username.trim().length < 3) {
    errors.username = "El nombre de usuario debe tener al menos 3 caracteres."
  }

  if (values.encryptedPassword.trim().length === 0) {
    errors.encryptedPassword = "La contraseña cifrada es obligatoria."
  }

  return errors
}

export function validateLogin(values: LoginValues) {
  const errors: AuthFieldErrors<LoginValues> = {}

  if (values.identifier.trim().length === 0) {
    errors.identifier = "El identificador es obligatorio."
  }

  if (values.encryptedPassword.trim().length === 0) {
    errors.encryptedPassword = "La contraseña cifrada es obligatoria."
  }

  return errors
}

export function hasFieldErrors<TValues>(errors: AuthFieldErrors<TValues>) {
  return Object.values(errors).some(Boolean)
}
