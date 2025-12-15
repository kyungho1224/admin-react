/**
 * API 클라이언트 설정 및 유틸리티
 * 개발/운영 환경 구분 및 포트별 서비스 URL 생성
 */

// 서비스 포트 정의
export const ServicePort = {
  USER: 9001,
  STUDY_PATTERNS: 9002,
  MISSIONS: 9004,
  INVENTORY: 9005,
  MONETIZATION: 9006,
  NOTIFICATION: 9007,
  REWARDING: 9008,
  GENERIC: 9009,
  WEBSOCKET: 9100,
}

// 환경 설정
const DEV_HOST = 'https://dev.baseapi.funpik.net'
const PROD_HOST = 'https://production.baseapi.funpik.net'

/**
 * 현재 환경 확인
 * 환경 변수 우선순위:
 * 1. localStorage의 사용자 선택 환경 (runtime)
 * 2. VITE_USE_PRODUCTION (true/false)
 * 3. VITE_API_ENV (development/production)
 * 4. 기본값: development
 */
function getUseProduction() {
  // localStorage에서 사용자 선택 환경 확인 (런타임 변경 가능)
  try {
    const userSelectedEnv = localStorage.getItem('api_environment')
    if (userSelectedEnv === 'production') return true
    if (userSelectedEnv === 'development') return false
  } catch {
    // localStorage 접근 불가 시 무시
  }

  const useProd = import.meta.env.VITE_USE_PRODUCTION
  const apiEnv = import.meta.env.VITE_API_ENV

  if (useProd === 'true' || useProd === true) return true
  if (useProd === 'false' || useProd === false) return false
  if (apiEnv === 'production') return true
  if (apiEnv === 'development') return false

  // 기본값: development
  return false
}

/**
 * 환경 설정 함수 (런타임 변경)
 * @param {string} env - 'development' | 'production'
 */
export function setApiEnvironment(env) {
  try {
    if (env === 'production' || env === 'development') {
      localStorage.setItem('api_environment', env)
      // 환경 변경 시 페이지 리로드하여 모든 API 클라이언트에 적용
      window.location.reload()
    }
  } catch (e) {
    console.error('환경 설정 실패:', e)
  }
}

/**
 * 현재 호스트 반환 (런타임 환경 확인)
 */
function getCurrentHost() {
  const useProd = getUseProduction()
  return useProd ? PROD_HOST : DEV_HOST
}

/**
 * 서비스의 베이스 URL 생성
 * @param {number} port - 서비스 포트
 * @returns {string} 서비스 베이스 URL (예: https://dev.baseapi.funpik.net:9007)
 */
export function getServiceBaseUrl(port) {
  const host = getCurrentHost()
  return `${host}:${port}`
}

/**
 * 서비스 URL 생성
 * @param {number} port - 서비스 포트
 * @param {string} path - API 경로 (예: '/v3/popups')
 * @returns {string} 완전한 서비스 URL
 */
export function getServiceUrl(port, path) {
  const base = getServiceBaseUrl(port)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

/**
 * 현재 환경 정보 반환
 */
export function getApiConfig() {
  const useProd = getUseProduction()
  const host = getCurrentHost()
  return {
    environment: useProd ? 'production' : 'development',
    host,
    useProduction: useProd,
  }
}

// 디버깅용 로그
if (import.meta.env.DEV) {
  console.log('[ApiClient] Configuration:', getApiConfig())
}

