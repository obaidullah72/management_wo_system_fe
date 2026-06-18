import { apiClient, unwrapResponse } from './client'

export async function getDashboardSummary() {
  const response = await apiClient.get('/dashboard/summary')
  return unwrapResponse(response)
}

export async function checkHealth() {
  const response = await fetch('/health')
  return response.json()
}
