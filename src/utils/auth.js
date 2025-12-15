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
 * 로컬 스토리지에 사용자 정보 저장
 */
export function saveUserToStorage(user) {
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('authenticated', 'true')
}

/**
 * 로컬 스토리지에서 사용자 정보 제거
 */
export function removeUserFromStorage() {
  localStorage.removeItem('user')
  localStorage.removeItem('authenticated')
}

/**
 * 인증 상태 확인
 */
export function isAuthenticated() {
  return localStorage.getItem('authenticated') === 'true' && getUserFromStorage() !== null
}



