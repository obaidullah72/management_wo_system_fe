import { apiClient, unwrapResponse } from './client'

export async function getPallets(params = {}) {
  const response = await apiClient.get('/pallets', { params })
  return unwrapResponse(response)
}

export async function getPallet(id) {
  const response = await apiClient.get(`/pallets/${id}`)
  return unwrapResponse(response)
}

export async function createPallet(payload) {
  const response = await apiClient.post('/pallets', payload)
  return unwrapResponse(response)
}

export async function movePallet(id, warehouseLocationId) {
  const response = await apiClient.post(`/pallets/${id}/move`, {
    warehouse_location_id: warehouseLocationId,
  })
  return unwrapResponse(response)
}

export async function updatePalletStatus(id, status) {
  const response = await apiClient.patch(`/pallets/${id}/status`, { status })
  return unwrapResponse(response)
}
