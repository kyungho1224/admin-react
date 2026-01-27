import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 온보딩 - 모드 선택 통계 조회
 * @param {string} startDate - 시작 일자 (YYYY-MM-DD)
 * @param {string} endDate - 종료 일자 (YYYY-MM-DD)
 */
export async function getModeSelectionStats(startDate, endDate) {
  const queryParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  }).toString()

  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/onboarding/mode-selection-stats?${queryParams}`),
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
      '모드 선택 통계 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 온보딩 - 퀵스타트 이탈 통계 조회
 * @param {string} startDate - 시작 일자 (YYYY-MM-DD)
 * @param {string} endDate - 종료 일자 (YYYY-MM-DD)
 */
export async function getQuickStartDropoff(startDate, endDate) {
  const queryParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  }).toString()

  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/onboarding/quick-start-dropoff?${queryParams}`),
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
      '퀵스타트 이탈 통계 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 온보딩 - AI 모드 이탈 통계 조회
 * @param {string} startDate - 시작 일자 (YYYY-MM-DD)
 * @param {string} endDate - 종료 일자 (YYYY-MM-DD)
 */
export async function getAiModeDropoff(startDate, endDate) {
  const queryParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  }).toString()

  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/onboarding/ai-mode-dropoff?${queryParams}`),
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
      'AI 모드 이탈 통계 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 온보딩 - 카테고리별 조회 통계
 * @param {string} startDate - 시작 일자 (YYYY-MM-DD)
 * @param {string} endDate - 종료 일자 (YYYY-MM-DD)
 */
export async function getCategoryViewStats(startDate, endDate) {
  const queryParams = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  }).toString()

  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/onboarding/category-view-stats?${queryParams}`),
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
      '카테고리별 조회 통계 실패'
    )
  }

  return handleResponse(response)
}
