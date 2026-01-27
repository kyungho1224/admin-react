import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 사용자 검색
 * @param {string} keyword - 검색 키워드 (user_id, nickname, email, external_identifier)
 * @param {number} limit - 조회 개수
 * @param {number} offset - 오프셋
 */
export async function searchUsers(keyword = null, limit = 100, offset = 0) {
  const params = new URLSearchParams()
  if (keyword) params.append('keyword', keyword)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())
  
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/users/search?${params.toString()}`)
  
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
        '사용자 검색 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[Users API] 검색 실패:', {
      url,
      keyword,
      error: error.message,
    })
    throw error
  }
}

/**
 * 액티브 유저 통계 - 월별 요약 조회
 * @param {number} year - 년도
 * @param {number} month - 월 (1-12)
 */
export async function getActiveStatsSummary(year, month) {
  const params = new URLSearchParams({
    year: year.toString(),
    month: month.toString(),
  })
  
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/users/active-stats/summary?${params.toString()}`)
  
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
        '월별 요약 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ActiveStats API] 월별 요약 조회 실패:', {
      url,
      year,
      month,
      error: error.message,
    })
    throw error
  }
}

/**
 * 액티브 유저 통계 - 일자별 상세 조회
 * @param {number} year - 년도
 * @param {number} month - 월 (1-12)
 */
export async function getActiveStatsDaily(year, month) {
  const params = new URLSearchParams({
    year: year.toString(),
    month: month.toString(),
  })
  
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/users/active-stats/daily?${params.toString()}`)
  
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
        '일자별 상세 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ActiveStats API] 일자별 상세 조회 실패:', {
      url,
      year,
      month,
      error: error.message,
    })
    throw error
  }
}

/**
 * 다운로드 수 입력
 * @param {string} statDate - 통계 날짜 (YYYY-MM-DD)
 * @param {number} totalCount - 다운로드 수
 */
export async function insertDownloadStats(statDate, totalCount) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/users/download-stats')
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        stat_date: statDate,
        total_count: totalCount,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '다운로드 수 입력 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[DownloadStats API] 입력 실패:', {
      url,
      statDate,
      totalCount,
      error: error.message,
    })
    throw error
  }
}
