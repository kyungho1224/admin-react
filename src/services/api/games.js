import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

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
