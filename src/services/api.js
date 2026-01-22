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

/**
 * 게임 데이터 조회
 * @param {string} gameType - 게임 타입 (예: 'conversation-quiz')
 */
export async function getGameData(gameType) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/games/data?game_type=${gameType}`),
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
      '게임 데이터 조회 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 게임 데이터 추가
 * @param {string} gameType - 게임 타입
 * @param {Object} gameData - 게임 데이터
 */
export async function createGameData(gameType, gameData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/games/data?game_type=${gameType}`),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(gameData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '게임 데이터 추가 실패'
    )
  }

  return handleResponse(response)
}

/**
 * 게임 데이터 내보내기
 * @param {string} gameType - 게임 타입
 * @param {Object} exportOptions - 내보내기 옵션 (dateRange, format 등)
 */
export async function exportGameData(gameType, exportOptions) {
  const params = new URLSearchParams({
    game_type: gameType,
    ...exportOptions,
  })
  
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/games/data/export?${params.toString()}`),
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
      '게임 데이터 내보내기 실패'
    )
  }

  return handleResponse(response)
}

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

/**
 * 채팅 목록 조회 (방별)
 * @param {number} roomId - 방 ID
 * @param {string} preferredLang - 선호 언어 (기본값: 'ko')
 * @param {number} beforeId - 이 ID보다 작은 메시지만 조회 (페이지네이션)
 * @param {number} limit - 조회할 메시지 수 (기본값: 50, 최대: 200)
 * @param {string} viewerId - 요청자 userId (선택)
 */
export async function getRoomMessages(roomId, preferredLang = 'ko', beforeId = null, limit = 50, viewerId = null) {
  const params = new URLSearchParams({
    preferredLang,
    limit: limit.toString(),
  })

  if (beforeId) {
    params.append('beforeId', beforeId.toString())
  }

  if (viewerId) {
    params.append('viewerId', viewerId)
  }

  const response = await fetch(
    getServiceUrl(ServicePort.WEBSOCKET, `/messages/room/${roomId}?${params}`),
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
      '채팅 목록 조회 실패'
    )
  }

  // 채팅 API는 result 래퍼 없이 직접 데이터 반환
  return await response.json()
}

/**
 * 채팅 목록 조회 (글로벌)
 * @param {string} preferredLang - 선호 언어 (기본값: 'ko')
 * @param {number} beforeId - 이 ID보다 작은 메시지만 조회 (페이지네이션)
 * @param {number} limit - 조회할 메시지 수 (기본값: 50, 최대: 200)
 * @param {string} viewerId - 요청자 userId (선택)
 */
export async function getGlobalMessages(preferredLang = 'ko', beforeId = null, limit = 50, viewerId = null) {
  const params = new URLSearchParams({
    preferredLang,
    limit: limit.toString(),
  })

  if (beforeId) {
    params.append('beforeId', beforeId.toString())
  }

  if (viewerId) {
    params.append('viewerId', viewerId)
  }

  const response = await fetch(
    getServiceUrl(ServicePort.WEBSOCKET, `/messages?${params}`),
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
      '채팅 목록 조회 실패'
    )
  }

  // 채팅 API는 result 래퍼 없이 직접 데이터 반환
  return await response.json()
}

/**
 * 미디어 업로드
 * @param {File} file - 업로드할 파일
 * @param {number} roomId - 방 ID (필수)
 * @param {string} userId - 사용자 ID (X-User-Id 헤더에 사용)
 * @param {number} messageId - 메시지 ID (선택, 없으면 서버에서 생성)
 */
export async function uploadMedia(file, roomId, userId, messageId = null) {
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.')
  }

  const formData = new FormData()
  formData.append('file', file)

  const params = new URLSearchParams({
    roomId: roomId.toString(),
  })
  
  if (messageId) {
    params.append('messageId', messageId.toString())
  }
  
  // multipart/form-data는 Content-Type을 설정하지 않아야 브라우저가 자동으로 boundary를 설정함
  // X-User-Id 헤더만 사용 (토큰 불필요)
  const headers = {
    'Accept': 'application/json',
    'X-User-Id': userId
  }
  
  console.log('[API] uploadMedia 요청:', {
    roomId,
    messageId,
    userId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  })
  
  const response = await fetch(
    getServiceUrl(ServicePort.WEBSOCKET, `/media/upload?${params}`),
    {
      method: 'POST',
      headers,
      body: formData,
    }
  )

  console.log('[API] uploadMedia 응답 상태:', response.status, response.statusText)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[API] uploadMedia 에러 응답:', errorData)
    
    // 인증 에러인 경우 특별 처리
    if (response.status === 401 || response.status === 403) {
      throw new Error('인증이 실패했습니다. 사용자 ID를 확인해주세요.')
    }
    
    throw new Error(
      errorData.detail ||
      errorData.result?.message ||
      errorData.message ||
      `파일 업로드 실패 (${response.status})`
    )
  }

  const responseData = await response.json()
  console.log('[API] uploadMedia 성공 응답:', responseData)
  
  // Flutter 코드와 동일한 형식으로 응답 검증
  if (!responseData.fileUrl) {
    throw new Error('업로드 응답에 fileUrl이 없습니다.')
  }
  
  return responseData
}

/**
 * 관리자 메시지 생성 (create_message 엔드포인트 사용)
 * @param {number} roomId - 방 ID
 * @param {string} text - 메시지 텍스트
 * @param {string} srcLang - 원본 언어 (기본값: 'ko')
 * @param {string[]} targets - 번역 대상 언어 배열 (선택)
 * @param {number} parentId - 부모 메시지 ID (선택)
 * @param {string} adminId - 관리자 ID (X-User-Id 헤더에 사용)
 * @param {object} media - 미디어 정보 (선택)
 */
export async function createAdminMessage(roomId, text, srcLang = 'ko', targets = null, parentId = null, adminId = null, media = null) {
  const body = {
    roomId,
    text,
    srcLang: srcLang, // create_admin_message는 srcLang 사용
    adminId: adminId || 'admin', // adminId 필수
  }

  if (targets) {
    body.targets = targets
  }

  if (parentId) {
    body.parentId = parentId
  }

  if (media) {
    body.media = media
  }

  console.log('[API] createAdminMessage 요청:', JSON.stringify(body, null, 2))
  console.log('[API] createAdminMessage media 필드:', body.media ? JSON.stringify(body.media, null, 2) : 'null')

  // X-User-Id 헤더에 adminId 사용 (백엔드 get_user_id가 사용)
  const headers = {
    'Content-Type': 'application/json',
  }
  
  if (adminId) {
    headers['X-User-Id'] = adminId
  } else {
    // 토큰이 있으면 사용
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(
    getServiceUrl(ServicePort.WEBSOCKET, '/messages/admin'),
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  )
  
  console.log('[API] createAdminMessage 응답 상태:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[API] createAdminMessage 에러 응답:', errorData)
    throw new Error(
      errorData.detail ||
      errorData.result?.message ||
      errorData.message ||
      '메시지 생성 실패'
    )
  }
  
  const responseData = await response.json()
  console.log('[API] createAdminMessage 성공 응답 (전체):', JSON.stringify(responseData, null, 2))
  console.log('[API] createAdminMessage 응답에 media 포함 여부:', !!responseData.media)
  if (responseData.media) {
    console.log('[API] createAdminMessage 응답 media 상세:', JSON.stringify(responseData.media, null, 2))
  } else {
    console.warn('[API] createAdminMessage 응답에 media가 없습니다!')
  }
  return responseData
}

/**
 * 메시지 삭제
 * @param {number} messageId - 삭제할 메시지 ID
 */
export async function deleteMessage(messageId) {
  const params = new URLSearchParams({
    message_id: messageId.toString(),
  })

  const response = await fetch(
    getServiceUrl(ServicePort.WEBSOCKET, `/messages/remove?${params}`),
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
      '메시지 삭제 실패'
    )
  }

  // 응답이 비어있을 수 있으므로 확인 후 처리
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text()
    if (text.trim()) {
      return JSON.parse(text)
    }
  }
  
  // 빈 응답이거나 JSON이 아닌 경우 성공으로 간주
  return { success: true }
}

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
