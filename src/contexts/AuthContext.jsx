import { createContext, useContext, useState, useEffect } from 'react'
import { getUserFromStorage, saveUserToStorage, removeUserFromStorage, isAuthenticated } from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 앱 시작 시 저장된 사용자 정보 확인
    const storedUser = getUserFromStorage()
    if (storedUser) {
      setUser(storedUser)
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    saveUserToStorage(userData)
  }

  const logout = () => {
    setUser(null)
    removeUserFromStorage()
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
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



