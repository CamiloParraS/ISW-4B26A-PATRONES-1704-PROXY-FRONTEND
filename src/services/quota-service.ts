import { API_ENDPOINTS } from "@/services/api/endpoints"
import { apiRequest } from "@/services/api/client"
import type {
  QuotaHistoryResponseDto,
  QuotaStatusResponseDto,
  UpgradeResponseDto,
} from "@/types/contracts"

export function getQuotaStatus(userId: string) {
  return apiRequest<QuotaStatusResponseDto>(API_ENDPOINTS.quota.status, {
    query: { userId },
  })
}

export function getQuotaHistory(userId: string) {
  return apiRequest<QuotaHistoryResponseDto>(API_ENDPOINTS.quota.history, {
    query: { userId },
  })
}

export function upgradePlan(userId: string) {
  return apiRequest<UpgradeResponseDto>(API_ENDPOINTS.quota.upgrade, {
    method: "POST",
    body: { userId },
  })
}
