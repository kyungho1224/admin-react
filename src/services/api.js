const API_BASE_URL = 'https://dev.baseapi.funpik.net:9007'

/**
 * API 응답 구조 처리
 */
async function handleResponse(response) {
  const data = await response.json()
  if (data.result && data.result.code === 200) {
    return data.result.body
  }
  throw new Error(data.result?.message || 'API 요청 실패')
}

/**
 * 팝업 조회 (화면별)
 * @param {string} screen - 화면 키 (예: 'ranking', 'home' 등)
 */
export async function getPopupsByScreen(screen) {
  const response = await fetch(`${API_BASE_URL}/v3/popups?screen=${screen}`)
  return handleResponse(response)
}

/**
 * 팝업 생성
 * @param {Object} popupData - 팝업 생성 데이터
 */
export async function createPopup(popupData) {
  const response = await fetch(`${API_BASE_URL}/v3/popups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(popupData),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  
  return handleResponse(response)
}

