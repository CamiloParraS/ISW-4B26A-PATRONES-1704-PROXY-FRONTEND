type RegisterValues = {
  email: string
  username: string
  password: string
}

type LoginValues = {
  identifier: string
  password: string
}

export type AuthFieldErrors<TValues> = Partial<Record<keyof TValues, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegister(values: RegisterValues) {
  const errors: AuthFieldErrors<RegisterValues> = {}

  if (values.email.trim().length === 0) {
    errors.email = "El correo es obligatorio."
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Ingresa un formato de correo válido."
  }

  if (values.username.trim().length < 3) {
    errors.username = "El nombre de usuario debe tener al menos 3 caracteres."
  }

  if (values.password.trim().length === 0) {
    errors.password = "La contraseña es obligatoria."
  }

  return errors
}

export function validateLogin(values: LoginValues) {
  const errors: AuthFieldErrors<LoginValues> = {}

  if (values.identifier.trim().length === 0) {
    errors.identifier = "El identificador es obligatorio."
  }

  if (values.password.trim().length === 0) {
    errors.password = "La contraseña es obligatoria."
  }

  return errors
}

type PromptValues = {
  prompt: string
}

export function validatePrompt(values: PromptValues) {
  const errors: AuthFieldErrors<PromptValues> = {}

  if (values.prompt.trim().length === 0) {
    errors.prompt = "El prompt es obligatorio y no puede estar vacío."
  }

  return errors
}
export function hasFieldErrors<TValues>(errors: AuthFieldErrors<TValues>) {
  return Object.values(errors).some(Boolean)
}
