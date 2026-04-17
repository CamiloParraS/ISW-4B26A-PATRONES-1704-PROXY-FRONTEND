import { API_ENDPOINTS } from "@/services/api/endpoints"
import { apiRequest } from "@/services/api/client"
import type { GenerateRequestDto, GenerateResponseDto } from "@/types/contracts"

export function generatePrompt(payload: GenerateRequestDto) {
  return apiRequest<GenerateResponseDto>(API_ENDPOINTS.ai.generate, {
    method: "POST",
    body: payload,
  })
}
