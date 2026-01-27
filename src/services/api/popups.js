import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 팝업 조회 (화면별)
 * @param {string} screen - 화면 키 (예: 'ranking', 'home' 등)
 */
export async function getPopupsByScreen(screen) {
  const response = await fetch(getServiceUrl(ServicePort.NOTIFICATION, `/v3/popups?screen=${screen}`), {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  return handleResponse(response)
}

/**
 * 팝업 생성
 * @param {Object} popupData - 팝업 생성 데이터
 */
export async function createPopup(popupData) {
  const response = await fetch(getServiceUrl(ServicePort.NOTIFICATION, '/v3/popups'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(popupData),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  return handleResponse(response)
}

/**
 * 팝업 수정
 * @param {number} popupId - 팝업 ID
 * @param {Object} updateData - 수정할 데이터
 * @param {string} [updateData.popup_type] - 팝업 타입 (SINGLE/MULTI)
 * @param {boolean} [updateData.is_active] - 운영 여부
 * @param {string} [updateData.start_at] - 노출 시작일 (ISO 문자열)
 * @param {string} [updateData.end_at] - 노출 종료일 (ISO 문자열)
 * @param {string} [updateData.screen_key] - 노출 화면 키
 * @param {number} [updateData.priority] - 우선순위
 * @param {boolean} [updateData.placement_is_active] - 배치 활성 여부
 * @param {Array} [updateData.slides] - 슬라이드 목록 (전체 교체)
 */
export async function updatePopup(popupId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/popups/${popupId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`)
  }

  return handleResponse(response)
}

/**
 * 팝업 삭제(비활성화)
 * @param {number} popupId - 팝업 ID
 * @param {string|null} screenKey - 화면 키 (지정 시 해당 화면에서만 제거, 미지정 시 완전 비활성화)
 */
export async function deletePopup(popupId, screenKey = null) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/popups/${popupId}`)
  const queryParams = screenKey ? `?screen=${encodeURIComponent(screenKey)}` : ''
  
  const response = await fetch(`${url}${queryParams}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`)
  }

  return handleResponse(response)
}
