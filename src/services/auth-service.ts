import { API_ENDPOINTS } from "@/services/api/endpoints"
import { apiRequest } from "@/services/api/client"
import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "@/types/contracts"

type BackendRegisterDto = {
  email: string
  username: string
  password: string
}

export function registerUser(payload: RegisterRequestDto) {
  const body: BackendRegisterDto = {
    email: payload.email,
    username: payload.username,
    password: payload.password,
  }

  return apiRequest<RegisterResponseDto>(API_ENDPOINTS.users.register, {
    method: "POST",
    body,
  })
}

export function loginUser(payload: LoginRequestDto) {
  const body = {
    identifier: payload.identifier,
    password: payload.password,
  }

  return apiRequest<LoginResponseDto>(API_ENDPOINTS.users.login, {
    method: "POST",
    body,
  })
}
