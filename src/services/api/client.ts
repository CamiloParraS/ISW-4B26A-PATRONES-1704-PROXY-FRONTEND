import { getApiBaseUrl } from "@/config/env"
import type { ApiErrorBody } from "@/types/contracts"

type HttpMethod = "GET" | "POST"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, string>
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

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
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
