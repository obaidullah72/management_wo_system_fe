import { apiClient, unwrapResponse } from './client'

export async function getUsers(params = {}) {
  const response = await apiClient.get('/users', { params })
  return unwrapResponse(response)
}

export async function getUser(id) {
  const response = await apiClient.get(`/users/${id}`)
  return unwrapResponse(response)
}

export async function createUser(payload) {
  const response = await apiClient.post('/users', payload)
  return unwrapResponse(response)
}

export async function updateUser(id, payload) {
  const response = await apiClient.put(`/users/${id}`, payload)
  return unwrapResponse(response)
}

export async function deleteUser(id) {
  const response = await apiClient.delete(`/users/${id}`)
  return unwrapResponse(response)
}
