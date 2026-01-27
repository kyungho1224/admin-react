import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 로그인
 * @param {string} username - 사용자 아이디
 * @param {string} password - 원본 비밀번호 (백엔드에서 해싱)
 */
export async function login(username, password) {
  // 백엔드에서 해싱하므로 원본 비밀번호 전송
  const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/auth/login')
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password, // 원본 비밀번호 전송
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Login API] 에러 응답:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })
      // HTTPException의 경우 detail 필드 사용
      throw new Error(errorData.detail || errorData.result?.message || errorData.message || '로그인 실패')
    }

    return handleResponse(response)
  } catch (error) {
    console.error('[Login API] 요청 실패:', {
      url,
      username,
      error: error.message,
      stack: error.stack,
    })
    throw error
  }
}

/**
 * 토큰 갱신
 */
export async function refreshToken() {
  const response = await fetch(getServiceUrl(ServicePort.NOTIFICATION, '/v3/auth/refresh'), {
    method: 'POST',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || '토큰 갱신 실패')
  }

  return handleResponse(response)
}

/**
 * 토큰 검증
 */
export async function verifyToken() {
  const response = await fetch(getServiceUrl(ServicePort.NOTIFICATION, '/v3/auth/verify'), {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || '토큰 검증 실패')
  }

  return handleResponse(response)
}

/**
 * 회원가입
 * @param {string} username - 사용자 아이디
 * @param {string} password - 원본 비밀번호 (백엔드에서 해싱)
 */
export async function signup(username, password) {
  // 백엔드에서 해싱하므로 원본 비밀번호 전송
  const response = await fetch(getServiceUrl(ServicePort.NOTIFICATION, '/v3/auth/signup'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password, // 원본 비밀번호 전송
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // HTTPException의 경우 detail 필드 사용
    throw new Error(errorData.detail || errorData.result?.message || errorData.message || '회원가입 실패')
  }

  return handleResponse(response)
}
