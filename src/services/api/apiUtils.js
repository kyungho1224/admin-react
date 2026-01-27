/**
 * API 응답 구조 처리
 */
export async function handleResponse(response) {
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
export function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
}
