import CryptoJS from 'crypto-js'

/**
 * 비밀번호를 SHA256으로 해싱
 * @param {string} password - 원본 비밀번호
 * @returns {string} 해싱된 비밀번호 (hex)
 */
export function hashPassword(password) {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex)
}

/**
 * JWT 토큰 디코딩 (만료 시간 확인용)
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('토큰 디코딩 실패:', error)
    return null
  }
}

/**
 * 토큰 만료 시간 확인 (초 단위로 남은 시간 반환)
 */
export function getTokenExpirationTime(token) {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return null
  const expirationTime = decoded.exp * 1000 // 밀리초로 변환
  const now = Date.now()
  return Math.max(0, Math.floor((expirationTime - now) / 1000)) // 초 단위
}

/**
 * 로컬 스토리지에서 사용자 정보 가져오기
 */
export function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error('사용자 정보 파싱 실패:', error)
    return null
  }
}

/**
 * 로컬 스토리지에 사용자 정보 및 토큰 저장
 */
export function saveUserToStorage(user, token) {
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('access_token', token)
  localStorage.setItem('authenticated', 'true')
  if (token) {
    const expiresIn = getTokenExpirationTime(token)
    if (expiresIn) {
      localStorage.setItem('token_expires_at', (Date.now() + expiresIn * 1000).toString())
    }
  }
}

/**
 * 로컬 스토리지에서 사용자 정보 및 토큰 제거
 */
export function removeUserFromStorage() {
  localStorage.removeItem('user')
  localStorage.removeItem('access_token')
  localStorage.removeItem('authenticated')
  localStorage.removeItem('token_expires_at')
}

/**
 * 토큰 가져오기
 */
export function getToken() {
  return localStorage.getItem('access_token')
}

/**
 * 토큰 저장
 */
export function saveToken(token) {
  localStorage.setItem('access_token', token)
  const expiresIn = getTokenExpirationTime(token)
  if (expiresIn) {
    localStorage.setItem('token_expires_at', (Date.now() + expiresIn * 1000).toString())
  }
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated() {
  const token = getToken()
  if (!token) return false
  
  const expiresIn = getTokenExpirationTime(token)
  if (expiresIn === null || expiresIn <= 0) {
    removeUserFromStorage()
    return false
  }
  
  return localStorage.getItem('authenticated') === 'true' && getUserFromStorage() !== null
}



