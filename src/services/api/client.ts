import { getApiBaseUrl } from "@/config/env"
import { getStoredSession } from "@/lib/storage"
import type { ApiErrorBody } from "@/types/contracts"

type HttpMethod = "GET" | "POST"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string>
  retries?: number
}

type ApiErrorMetadata = {
  retryAfterSeconds?: number
}

export class ApiClientError extends Error {
  public readonly status: number
  public readonly details: string[]
  public readonly path: string
  public readonly metadata: ApiErrorMetadata

  constructor({
    status,
    message,
    details,
    path,
    metadata,
  }: {
    status: number
    message: string
    details?: string[]
    path?: string
    metadata?: ApiErrorMetadata
  }) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.details = details ?? []
    this.path = path ?? ""
    this.metadata = metadata ?? {}
  }
}

function buildUrl(path: string, query?: Record<string, string>) {
  const url = new URL(`${getApiBaseUrl()}${path}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

async function safeParseJson(response: Response) {
  const text = await response.text()

  if (text.length === 0) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function getRetryAfterSeconds(response: Response) {
  const retryAfterHeader = response.headers.get("Retry-After")
  if (!retryAfterHeader) {
    return undefined
  }

  const parsedValue = Number(retryAfterHeader)
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return undefined
  }

  return Math.floor(parsedValue)
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const method = options.method ?? "GET"
  const retriesAllowed = options.retries ?? 1
  let remainingRetries = retriesAllowed

  while (true) {
    let response: Response
    try {
      const session = getStoredSession()
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (session?.token) {
        headers.Authorization = `Bearer ${session.token}`
      }

      response = await fetch(buildUrl(path, options.query), {
        method,
        headers,
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
      })
    } catch {
      throw new ApiClientError({
        status: 0,
        message:
          "Could not reach the server. Verify your connection and backend URL configuration.",
      })
    }

    const parsedPayload = await safeParseJson(response)
    if (!response.ok) {
      // Retry on 429 when allowed
      if (response.status === 429 && remainingRetries > 0) {
        const waitSec = getRetryAfterSeconds(response) ?? 1
        await new Promise((r) => setTimeout(r, waitSec * 1000))
        remainingRetries -= 1
        continue
      }

      const errorBody = parsedPayload as ApiErrorBody | null
      throw new ApiClientError({
        status: response.status,
        message: errorBody?.message ?? "Request failed unexpectedly.",
        details: errorBody?.details,
        path: errorBody?.path,
        metadata: {
          retryAfterSeconds: getRetryAfterSeconds(response),
        },
      })
    }

    return parsedPayload as TResponse
  }
}
