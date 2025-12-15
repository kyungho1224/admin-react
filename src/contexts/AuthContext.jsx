import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getUserFromStorage, saveUserToStorage, removeUserFromStorage, isAuthenticated, getToken, getTokenExpirationTime, saveToken } from '../utils/auth'
import { verifyToken, refreshToken } from '../services/api'
import { Modal } from 'antd'

const AuthContext = createContext(null)

// 세션 만료 시간 (초 단위) - 60분
const SESSION_DURATION = 60 * 60
// 세션 연장 가능 시간 (초 단위) - 30분
const REFRESH_THRESHOLD = 30 * 60
// 세션 연장 시간 (초 단위) - 30분
const REFRESH_EXTENSION = 30 * 60

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionTimeLeft, setSessionTimeLeft] = useState(null)
  const [canExtend, setCanExtend] = useState(false)
  const sessionTimerRef = useRef(null)
  const checkIntervalRef = useRef(null)

  // 로그아웃 함수 (먼저 정의)
  const logout = useCallback(() => {
    setUser(null)
    removeUserFromStorage()
    setSessionTimeLeft(null)
    setCanExtend(false)
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
  }, [])

  // 세션 타이머 업데이트
  const updateSessionTimer = useCallback(() => {
    const token = getToken()
    if (!token) {
      setSessionTimeLeft(null)
      setCanExtend(false)
      return
    }

    const expiresIn = getTokenExpirationTime(token)
    if (expiresIn === null || expiresIn <= 0) {
      // 토큰 만료
      logout()
      return
    }

    setSessionTimeLeft(expiresIn)
    setCanExtend(expiresIn < REFRESH_THRESHOLD)
  }, [logout])

  // 세션 연장
  const extendSession = useCallback(async () => {
    try {
      const response = await refreshToken()
      if (response.access_token) {
        saveToken(response.access_token)
        updateSessionTimer()
        Modal.success({
          title: '세션 연장',
          content: '세션이 30분 연장되었습니다.',
        })
      }
    } catch (error) {
      console.error('세션 연장 실패:', error)
      Modal.error({
        title: '세션 연장 실패',
        content: error.message || '세션을 연장할 수 없습니다. 다시 로그인해주세요.',
      })
      logout()
    }
  }, [updateSessionTimer, logout])


  // 토큰 검증 및 사용자 정보 로드
  const verifyAndLoadUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      console.log('[AuthContext] 토큰이 없습니다.')
      setLoading(false)
      return
    }

    console.log('[AuthContext] 토큰 검증 시작...')
    try {
      const response = await verifyToken()
      console.log('[AuthContext] 토큰 검증 응답:', response)
      if (response.valid && response.user) {
        setUser(response.user)
        saveUserToStorage(response.user, token)
        updateSessionTimer()
        console.log('[AuthContext] 사용자 정보 로드 완료:', response.user.username)
      } else {
        console.log('[AuthContext] 토큰이 유효하지 않습니다.')
        logout()
      }
    } catch (error) {
      console.error('[AuthContext] 토큰 검증 실패:', error)
      // 네트워크 에러나 일시적 오류인 경우 토큰이 유효할 수 있으므로
      // 토큰 만료 시간을 확인하여 유효하면 사용자 정보를 복원
      const expiresIn = getTokenExpirationTime(token)
      if (expiresIn && expiresIn > 0) {
        const storedUser = getUserFromStorage()
        if (storedUser) {
          console.log('[AuthContext] 토큰이 유효하므로 저장된 사용자 정보 복원')
          setUser(storedUser)
          updateSessionTimer()
        } else {
          logout()
        }
      } else {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }, [updateSessionTimer, logout])

  useEffect(() => {
    // 앱 시작 시 토큰 검증
    verifyAndLoadUser()

    // 세션 타이머 체크 (1초마다)
    checkIntervalRef.current = setInterval(() => {
      updateSessionTimer()
    }, 1000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [verifyAndLoadUser, updateSessionTimer])

  // 로그인
  const login = useCallback((userData, token) => {
    setUser(userData)
    saveUserToStorage(userData, token)
    updateSessionTimer()
  }, [updateSessionTimer])

  const value = {
    user,
    isAuthenticated: !!user && isAuthenticated(),
    login,
    logout,
    loading,
    sessionTimeLeft,
    canExtend,
    extendSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}



