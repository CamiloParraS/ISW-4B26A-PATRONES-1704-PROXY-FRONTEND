import { API_ENDPOINTS } from "@/services/api/endpoints"
import { apiRequest } from "@/services/api/client"
import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "@/types/contracts"

export function registerUser(payload: RegisterRequestDto) {
  return apiRequest<RegisterResponseDto>(API_ENDPOINTS.users.register, {
    method: "POST",
    body: payload,
  })
}

export function loginUser(payload: LoginRequestDto) {
  return apiRequest<LoginResponseDto>(API_ENDPOINTS.users.login, {
    method: "POST",
    body: payload,
  })
}
