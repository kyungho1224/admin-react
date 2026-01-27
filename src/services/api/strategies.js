import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 전략 목록 조회
 */
export async function getStrategies() {
  const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/strategies')
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '전략 목록 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[Strategies API] 조회 실패:', {
      url,
      error: error.message,
    })
    throw error
  }
}
