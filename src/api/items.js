import { apiClient, unwrapResponse } from './client'

export async function getItems(params = {}) {
  const response = await apiClient.get('/items', { params })
  return unwrapResponse(response)
}

export async function getItem(id) {
  const response = await apiClient.get(`/items/${id}`)
  return unwrapResponse(response)
}

export async function createItem(payload) {
  const response = await apiClient.post('/items', payload)
  return unwrapResponse(response)
}

export async function updateItem(id, payload) {
  const response = await apiClient.put(`/items/${id}`, payload)
  return unwrapResponse(response)
}

export async function deleteItem(id) {
  const response = await apiClient.delete(`/items/${id}`)
  return unwrapResponse(response)
}
