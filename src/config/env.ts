const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL

export function getApiBaseUrl(): string {
  if (!rawApiBaseUrl || rawApiBaseUrl.trim().length === 0) {
    throw new Error(
      "Missing VITE_API_BASE_URL environment variable. Configure it before running the app."
    )
  }

  return rawApiBaseUrl.replace(/\/+$/, "")
}
