import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 어학원 목록 조회
 */
export async function getLanguageAcademies() {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/language-academies'),
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
      '어학원 목록 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 어학원 등록
 * @param {object} academyData - 어학원 데이터
 */
export async function createLanguageAcademy(academyData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/language-academies'),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(academyData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
      errorData.result?.message ||
      errorData.message ||
      '어학원 등록 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 어학원 수정
 * @param {number} academyId - 어학원 ID
 * @param {object} academyData - 수정할 어학원 데이터
 */
export async function updateLanguageAcademy(academyId, academyData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/language-academies/${academyId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(academyData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
      errorData.result?.message ||
      errorData.message ||
      '어학원 수정 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 어학원별 코스 목록 조회
 * @param {number} academyId - 어학원 ID
 */
export async function getLanguageCourses(academyId) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/language-academies/${academyId}/courses`),
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
      '코스 목록 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 코스 등록
 * @param {object} courseData - 코스 데이터
 */
export async function createLanguageCourse(courseData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/language-courses'),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
      errorData.result?.message ||
      errorData.message ||
      '코스 등록 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 코스 수정
 * @param {number} courseId - 코스 ID
 * @param {object} courseData - 수정할 코스 데이터
 */
export async function updateLanguageCourse(courseId, courseData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/language-courses/${courseId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail ||
      errorData.result?.message ||
      errorData.message ||
      '코스 수정 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 어학연수 결제 내역 조회
 * @param {Object} filters - 필터 옵션
 * @param {number} filters.academy_id - 어학원 ID (선택)
 * @param {number} filters.course_id - 코스 ID (선택)
 * @param {string} filters.payment_status - 결제 상태 (PENDING/DONE/FAILED/CANCELED) (선택)
 * @param {string} filters.start_date - 시작 날짜 (YYYY-MM-DD) (선택)
 * @param {string} filters.end_date - 종료 날짜 (YYYY-MM-DD) (선택)
 * @param {number} filters.user_id - 사용자 ID (선택)
 */
export async function getAcademyPayments(filters = {}) {
  const params = new URLSearchParams()
  
  if (filters.academy_id) params.append('academy_id', filters.academy_id)
  if (filters.course_id) params.append('course_id', filters.course_id)
  if (filters.payment_status) params.append('payment_status', filters.payment_status)
  if (filters.start_date) params.append('start_date', filters.start_date)
  if (filters.end_date) params.append('end_date', filters.end_date)
  if (filters.user_id) params.append('user_id', filters.user_id)
  
  const response = await fetch(
    getServiceUrl(ServicePort.MONETIZATION, `/v3/academy-payments?${params.toString()}`),
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
      '결제 내역 조회 실패'
    )
  }
  
  return handleResponse(response)
}
