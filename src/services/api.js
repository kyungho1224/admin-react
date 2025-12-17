import { getServiceUrl, ServicePort } from './apiClient'

/**
 * API 응답 구조 처리
 */
async function handleResponse(response) {
  const data = await response.json()
  if (data.result && data.result.code === 200) {
    return data.result.body
  }
  // HTTPException의 경우 detail 필드 사용
  throw new Error(data.detail || data.result?.message || 'API 요청 실패')
}

/**
 * 인증 헤더 가져오기
 */
function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
}

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

/**
 * GA 이벤트 통계 조회
 * @param {string} date - 조회할 날짜 (YYYY-MM-DD)
 */
export async function getGAEvents(date) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/analytics/ga-events?date=${date}`),
    {
      method: 'GET',
      headers: getAuthHeaders(),
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
 * 게임 규칙 조회
 */
export async function getGameRules() {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/games/rules'),
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
      '게임 규칙 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 게임 정보 수정
 * @param {number} gameId - 게임 ID
 * @param {Object} updateData - 수정할 데이터
 */
export async function updateGame(gameId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/games/${gameId}`),
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
      '게임 정보 수정 실패'
    )
  }

  return handleResponse(response)
}

