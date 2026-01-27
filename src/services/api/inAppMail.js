import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 인앱 메일 발송
 * @param {Object} mailData - 인앱 메일 데이터
 * @param {string} mailData.notification_type - 알림 타입 (SYSTEM_GIFT, ANNOUNCEMENT)
 * @param {string} mailData.notification_target - 수신 대상 (ALL, GROUP)
 * @param {Object} mailData.labels - 제목 (다국어 JSON)
 * @param {Object} mailData.contents - 내용 (다국어 JSON)
 * @param {string} mailData.link_type - 링크 타입 (IN_APP, EXTERNAL, OVERLAY)
 * @param {string} mailData.link_target - 링크 대상
 * @param {Array<number>} mailData.strategy_ids - 전략 ID 목록
 * @param {Array<number>} mailData.group_ids - 그룹 ID 목록
 * @param {boolean} mailData.ads_reward_flag - 광고 보상 플래그
 * @param {string} mailData.expired_at - 만료일 (ISO 8601 형식)
 */
export async function createInAppMail(mailData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/in-app-mail')
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(mailData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '인앱 메일 발송 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[InAppMail API] 요청 실패:', {
      url,
      mailData,
      error: error.message,
    })
    throw error
  }
}

/**
 * 인앱 메일 조회
 * @param {number} notificationId - 알림 ID
 */
export async function getInAppMail(notificationId) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/in-app-mail/${notificationId}`)
  
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
        '인앱 메일 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[InAppMail API] 조회 실패:', {
      url,
      notificationId,
      error: error.message,
    })
    throw error
  }
}

/**
 * 인앱 메일 목록 조회
 * @param {number} limit - 조회 개수
 * @param {number} offset - 오프셋
 */
export async function getInAppMailList(limit = 100, offset = 0) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/in-app-mail?limit=${limit}&offset=${offset}`)
  
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
        '인앱 메일 목록 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[InAppMail API] 목록 조회 실패:', {
      url,
      limit,
      offset,
      error: error.message,
    })
    throw error
  }
}
