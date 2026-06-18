import { apiClient, unwrapResponse } from './client'

export async function getInventorySummary() {
  const response = await apiClient.get('/inventory/summary')
  return unwrapResponse(response)
}

export async function adjustInventory(payload) {
  const response = await apiClient.post('/inventory/adjust', payload)
  return unwrapResponse(response)
}

export async function getInventoryTransactions(params = {}) {
  const response = await apiClient.get('/inventory/transactions', { params })
  return unwrapResponse(response)
}
