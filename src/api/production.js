import { apiClient, unwrapResponse } from './client'

export async function getProductionHistory(params = {}) {
  const response = await apiClient.get('/production/history', { params })
  return unwrapResponse(response)
}

export async function recordProduction(payload) {
  const response = await apiClient.post('/production/record', payload)
  return unwrapResponse(response)
}
