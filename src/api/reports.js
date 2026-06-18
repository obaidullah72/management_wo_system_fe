import { apiClient, unwrapResponse } from './client'

export async function getDailyProductionReport(params = {}) {
  const response = await apiClient.get('/reports/daily-production', { params })
  return unwrapResponse(response)
}

export async function getInventoryStatusReport() {
  const response = await apiClient.get('/reports/inventory-status')
  return unwrapResponse(response)
}

export async function getCompletedWorkOrdersReport() {
  const response = await apiClient.get('/reports/completed-work-orders')
  return unwrapResponse(response)
}

export async function getProductionActivityReport(params = {}) {
  const response = await apiClient.get('/reports/production-activity', { params })
  return unwrapResponse(response)
}
