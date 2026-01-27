import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 클래스 목록 조회 (어드민)
 * @param {number} limit - 조회 개수
 * @param {number} offset - 오프셋
 */
export async function getClasses(limit = 100, offset = 0) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/classes?limit=${limit}&offset=${offset}`)
  
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
        '클래스 목록 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 클래스 목록 조회 실패:', {
      url,
      error: error.message,
    })
    throw error
  }
}

/**
 * 클래스 생성
 * @param {Object} classData - 클래스 데이터
 */
export async function createClass(classData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/admin/class-reservation/classes')
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(classData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '클래스 생성 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 클래스 생성 실패:', {
      url,
      classData,
      error: error.message,
    })
    throw error
  }
}

/**
 * 클래스 수정
 * @param {number} classId - 클래스 ID
 * @param {Object} classData - 클래스 데이터
 */
export async function updateClass(classId, classData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/classes/${classId}`)
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(classData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '클래스 수정 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 클래스 수정 실패:', {
      url,
      classId,
      classData,
      error: error.message,
    })
    throw error
  }
}

/**
 * 일정 등록
 * @param {number} classId - 클래스 ID
 * @param {Object} scheduleData - 일정 데이터
 */
export async function createSchedule(classId, scheduleData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/classes/${classId}/schedules`)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '일정 등록 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 일정 등록 실패:', {
      url,
      classId,
      scheduleData,
      error: error.message,
    })
    throw error
  }
}

/**
 * 일정 수정
 * @param {number} scheduleId - 일정 ID
 * @param {Object} scheduleData - 일정 데이터
 */
export async function updateSchedule(scheduleId, scheduleData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/schedules/${scheduleId}`)
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(scheduleData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '일정 수정 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 일정 수정 실패:', {
      url,
      scheduleId,
      scheduleData,
      error: error.message,
    })
    throw error
  }
}

/**
 * 클래스별 일정 목록 조회
 * @param {number} classId - 클래스 ID
 */
export async function getClassSchedules(classId) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/classes/${classId}/schedules`)
  
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
        '일정 목록 조회 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 일정 목록 조회 실패:', {
      url,
      classId,
      error: error.message,
    })
    throw error
  }
}

/**
 * 일정 삭제
 * @param {number} scheduleId - 일정 ID
 */
export async function deleteSchedule(scheduleId) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/schedules/${scheduleId}`)
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '일정 삭제 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 일정 삭제 실패:', {
      url,
      scheduleId,
      error: error.message,
    })
    throw error
  }
}

/**
 * 예약 현황 조회
 * @param {Object} filters - 필터 옵션
 * @param {number} filters.class_id - 클래스 ID (선택)
 * @param {string} filters.schedule_date - 날짜 (YYYY-MM-DD) (선택)
 * @param {string} filters.status - 상태 (reserved/completed/cancelled) (선택)
 * @param {number} limit - 조회 개수
 * @param {number} offset - 오프셋
 */
export async function getReservations(filters = {}, limit = 100, offset = 0) {
  const params = new URLSearchParams()
  
  if (filters.class_id) params.append('class_id', filters.class_id)
  if (filters.schedule_date) params.append('schedule_date', filters.schedule_date)
  if (filters.status) params.append('status', filters.status)
  params.append('limit', limit)
  params.append('offset', offset)
  
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/reservations?${params.toString()}`)
  const headers = getAuthHeaders()
  
  // 디버깅: 요청 정보 로그
  console.log('[ClassReservation API] 예약 현황 조회 요청:', {
    url,
    headers,
    hasToken: !!headers.Authorization,
  })
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    
    // 디버깅: 응답 정보 로그
    console.log('[ClassReservation API] 예약 현황 조회 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[ClassReservation API] 예약 현황 조회 에러 응답:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        `예약 현황 조회 실패 (${response.status}: ${response.statusText})`
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 예약 현황 조회 실패:', {
      url,
      filters,
      error: error.message,
    })
    throw error
  }
}

/**
 * 입장 링크 등록/수정
 * @param {number} reservationId - 예약 ID
 * @param {string} entryLink - 입장 링크
 */
export async function updateEntryLink(reservationId, entryLink) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/reservations/${reservationId}/entry-link`)
  
  try {
    // FastAPI Body(..., embed=True) 형식: {"entry_link": "value"}
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ entry_link: entryLink }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '입장 링크 등록 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 입장 링크 등록 실패:', {
      url,
      reservationId,
      entryLink,
      error: error.message,
    })
    throw error
  }
}

/**
 * 피드백 등록
 * @param {number} reservationId - 예약 ID
 * @param {Object} feedbackData - 피드백 데이터
 */
export async function createFeedback(reservationId, feedbackData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/reservations/${reservationId}/feedback`)
  
  try {
    // 백엔드 모델에 맞게 필드명 변환
    const requestData = {
      feedback_content: feedbackData.feedback || feedbackData.feedback_content,
      rating: feedbackData.rating || null,
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '피드백 등록 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 피드백 등록 실패:', {
      url,
      reservationId,
      feedbackData,
      error: error.message,
    })
    throw error
  }
}

/**
 * 예약 취소 (관리자/선생님)
 * @param {number} reservationId - 예약 ID
 * @param {Object} cancellationData - 취소 데이터
 * @param {string} cancellationData.cancellation_reason - 취소 사유
 * @param {string} cancellationData.cancelled_by - 취소 주체 (admin/instructor)
 */
export async function cancelReservationByAdmin(reservationId, cancellationData) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/class-reservation/reservations/${reservationId}/cancel`)
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cancellationData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.detail ||
        errorData.result?.message ||
        errorData.message ||
        '예약 취소 실패'
      )
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[ClassReservation API] 예약 취소 실패:', {
      url,
      reservationId,
      cancellationData,
      error: error.message,
    })
    throw error
  }
}
