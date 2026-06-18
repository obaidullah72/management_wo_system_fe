import { apiClient, unwrapResponse } from './client'

export async function login(credentials) {
  const response = await apiClient.post('/auth/login', credentials)
  return unwrapResponse(response)
}

export async function getMe() {
  const response = await apiClient.get('/auth/me')
  return unwrapResponse(response)
}

export async function registerUser(payload) {
  const response = await apiClient.post('/auth/register', payload)
  return unwrapResponse(response)
}

export async function changePassword(payload) {
  const response = await apiClient.post('/auth/change-password', payload)
  return unwrapResponse(response)
}

export async function logout() {
  const response = await apiClient.post('/auth/logout')
  return unwrapResponse(response)
}
