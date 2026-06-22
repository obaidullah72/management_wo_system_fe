import { apiClient, unwrapResponse } from './client'

export async function getWorkOrders(params = {}) {
  const response = await apiClient.get('/work-orders', { params })
  return unwrapResponse(response)
}

export async function getWorkOrder(id) {
  const response = await apiClient.get(`/work-orders/${id}`)
  return unwrapResponse(response)
}

export async function createWorkOrder(payload) {
  const response = await apiClient.post('/work-orders', payload)
  return unwrapResponse(response)
}

export async function updateWorkOrder(id, payload) {
  const response = await apiClient.put(`/work-orders/${id}`, payload)
  return unwrapResponse(response)
}

export async function assignWorkOrder(id, assignedTo) {
  const response = await apiClient.post(`/work-orders/${id}/assign`, {
    assigned_to: assignedTo,
  })
  return unwrapResponse(response)
}

export async function updateWorkOrderStatus(id, status) {
  const response = await apiClient.patch(`/work-orders/${id}/status`, { status })
  return unwrapResponse(response)
}

export async function getWorkOrderProgress(id) {
  const response = await apiClient.get(`/work-orders/${id}/progress`)
  return unwrapResponse(response)
}

export async function deleteWorkOrder(id) {
  await apiClient.delete(`/work-orders/${id}`)
}
