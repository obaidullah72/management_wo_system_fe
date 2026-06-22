import axios from 'axios'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
let refreshPromise = null

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

const publicAuthPaths = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
]

function isPublicAuthRequest(url = '') {
  return publicAuthPaths.some((path) => url.includes(path))
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${apiClient.defaults.baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .then((response) => {
        const data = response.data?.data
        if (!data?.access_token) {
          throw new Error('Invalid refresh response')
        }
        setStoredTokens(data)
        return data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const url = originalRequest?.url ?? ''

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRequest(url) &&
      localStorage.getItem(REFRESH_TOKEN_KEY)
    ) {
      originalRequest._retry = true
      try {
        const newToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch {
        clearStoredTokens()
        const publicPaths = ['/login', '/forgot-password', '/reset-password']
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login'
        }
      }
    }

    if (status === 401 && !isPublicAuthRequest(url)) {
      clearStoredTokens()
      const publicPaths = ['/login', '/forgot-password', '/reset-password']
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setStoredToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function setStoredTokens({ access_token, refresh_token }) {
  if (access_token) {
    localStorage.setItem(TOKEN_KEY, access_token)
  }
  if (refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  }
}

export function clearStoredToken() {
  clearStoredTokens()
}

export function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function unwrapResponse(response) {
  return response.data?.data
}

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'An unexpected error occurred'
}
