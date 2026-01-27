import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 배너 전체 조회 (관리자용 - 비활성화 포함)
 */
export async function getBanners() {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/main-banners/all'),
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
      '배너 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 배너 등록
 * @param {Object} bannerData - 배너 생성 데이터
 */
export async function createBanner(bannerData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/main-banners'),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bannerData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '배너 등록 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 배너 수정
 * @param {number} recordId - 배너 ID
 * @param {Object} updateData - 수정할 데이터
 */
export async function updateBanner(recordId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/main-banners/${recordId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '배너 수정 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 배너 활성화
 * @param {number} recordId - 배너 ID
 */
export async function activateBanner(recordId) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/main-banners/${recordId}`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '배너 활성화 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 배너 비활성화 (삭제)
 * @param {number} recordId - 배너 ID
 */
export async function deactivateBanner(recordId) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/main-banners/${recordId}`),
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '배너 비활성화 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 배너 순서 변경
 * @param {number} recordId - 배너 ID
 * @param {number} sortOrder - 변경할 순서 값
 */
export async function changeBannerOrder(recordId, sortOrder) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/main-banners/${recordId}/sort-order`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sort_order: sortOrder }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '배너 순서 변경 실패'
    )
  }

  return handleResponse(response)
}
