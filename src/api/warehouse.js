import { apiClient, unwrapResponse } from './client'

export async function getWarehouseLocations() {
  const response = await apiClient.get('/warehouse/locations')
  return unwrapResponse(response)
}

export async function getWarehouseLocation(id) {
  const response = await apiClient.get(`/warehouse/locations/${id}`)
  return unwrapResponse(response)
}

export async function createWarehouseLocation(payload) {
  const response = await apiClient.post('/warehouse/locations', payload)
  return unwrapResponse(response)
}

export async function updateWarehouseLocation(id, payload) {
  const response = await apiClient.put(`/warehouse/locations/${id}`, payload)
  return unwrapResponse(response)
}

export async function deleteWarehouseLocation(id) {
  const response = await apiClient.delete(`/warehouse/locations/${id}`)
  return unwrapResponse(response)
}

export async function getLocationPallets(id) {
  const response = await apiClient.get(`/warehouse/locations/${id}/pallets`)
  return unwrapResponse(response)
}
