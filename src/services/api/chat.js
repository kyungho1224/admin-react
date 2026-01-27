import { getServiceUrl, ServicePort } from '../apiClient'
import { getAuthHeaders } from './apiUtils'

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
