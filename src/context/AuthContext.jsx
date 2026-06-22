import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { clearStoredTokens, getStoredToken, setStoredTokens } from '../api/client'
import { mapUserRole } from '../utils/mappers'
import { BACKEND_ROLES, hasMinRole } from '../constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const profile = await authApi.getMe()
      setUser(profile)
      setError(null)
    } catch {
      clearStoredTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async (username, password) => {
    setError(null)
    const tokenData = await authApi.login({ username, password })
    setStoredTokens(tokenData)
    const profile = await authApi.getMe()
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Client-side logout is sufficient for JWT
    } finally {
      clearStoredTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      setError,
      isAuthenticated: Boolean(user),
      login,
      logout,
      reloadUser: loadUser,
      role: user?.role ?? null,
      roleLabel: user ? mapUserRole(user.role) : null,
      isAdmin: user?.role === BACKEND_ROLES.ADMIN,
      isManagerOrAdmin: hasMinRole(user?.role, BACKEND_ROLES.MANAGER),
      canAccess: (minimumRole) => hasMinRole(user?.role, minimumRole),
    }),
    [user, isLoading, error, login, logout, loadUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
