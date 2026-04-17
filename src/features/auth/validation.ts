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
    errors.userId = "User ID is required."
  }

  if (values.email.trim().length === 0) {
    errors.email = "Email is required."
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email format."
  }

  if (values.username.trim().length < 3) {
    errors.username = "Username must be at least 3 characters."
  }

  if (values.encryptedPassword.trim().length === 0) {
    errors.encryptedPassword = "Encrypted password is required."
  }

  return errors
}

export function validateLogin(values: LoginValues) {
  const errors: AuthFieldErrors<LoginValues> = {}

  if (values.identifier.trim().length === 0) {
    errors.identifier = "Identifier is required."
  }

  if (values.encryptedPassword.trim().length === 0) {
    errors.encryptedPassword = "Encrypted password is required."
  }

  return errors
}

export function hasFieldErrors<TValues>(errors: AuthFieldErrors<TValues>) {
  return Object.values(errors).some(Boolean)
}
