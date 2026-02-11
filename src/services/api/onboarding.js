import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 온보딩 v7 - 일자/스텝/완료여부/유저타입별 유저 수 조회
 * @param {string} [startDate] - 시작 일자 (YYYY-MM-DD), 없으면 전체 조회
 * @param {string} [endDate] - 종료 일자 (YYYY-MM-DD), 없으면 전체 조회
 */
export async function getUserTypeStats(startDate, endDate) {
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)
  const query = params.toString()

  const response = await fetch(
    getServiceUrl(
      ServicePort.NOTIFICATION,
      `/v3/onboarding/user-type-stats${query ? `?${query}` : ''}`
    ),
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '유저 타입 통계 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 온보딩 v7 - 단일 일자 유저 상세 (해당 날짜에 갱신된 유저 중 완료/이탈 스텝)
 * @param {string} date - 조회할 일자 (YYYY-MM-DD)
 */
export async function getUserTypeDetail(date) {
  const response = await fetch(
    getServiceUrl(
      ServicePort.NOTIFICATION,
      `/v3/onboarding/user-type-detail?date=${encodeURIComponent(date)}`
    ),
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '유저 타입 상세 조회 실패'
    )
  }

  return handleResponse(response)
}
