import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getProfile()
        .then((u) => {
          const normalized = u ? { ...u, role: String(u.role).toLowerCase().replace('userrole.', '') } : null
          setUser(normalized)
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { user, access_token } = await authAPI.login(email, password)
    localStorage.setItem('token', access_token)
    // Normalize role to lowercase string in case backend returns Enum-like values
    const normalized = user ? { ...user, role: String(user.role).toLowerCase().replace('userrole.', '') } : null
    setUser(normalized)
    return normalized
  }

  const register = async (userData) => {
    const { user, access_token } = await authAPI.register(userData)
    localStorage.setItem('token', access_token)
    const normalized = user ? { ...user, role: String(user.role).toLowerCase().replace('userrole.', '') } : null
    setUser(normalized)
    return normalized
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}