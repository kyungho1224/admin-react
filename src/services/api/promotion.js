import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 프로모션 코드 활성 여부 조회 (is_promotion_on)
 */
export async function getPromotionStatus() {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/promotion/status'),
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        `HTTP error! status: ${response.status}`
    )
  }

  return handleResponse(response)
}

/**
 * 프로모션 코드 활성 여부 업데이트 (is_promotion_on)
 * @param {boolean} is_promotion_on - True=온, False=오프
 */
export async function updatePromotionStatus(is_promotion_on) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/promotion/status'),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_promotion_on }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        `HTTP error! status: ${response.status}`
    )
  }

  return handleResponse(response)
}
