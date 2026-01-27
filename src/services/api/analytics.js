import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * GA 이벤트 통계 조회
 * @param {string} date - 조회할 날짜 (YYYY-MM-DD)
 */
export async function getGAEvents(date) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/analytics/ga-events?date=${date}`),
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`)
  }

  return handleResponse(response)
}
