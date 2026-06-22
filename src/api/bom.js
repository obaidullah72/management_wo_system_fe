import { apiClient, unwrapResponse } from './client'

export async function getBoms(params = {}) {
  const response = await apiClient.get('/bom', { params })
  return unwrapResponse(response)
}

export async function getBom(id) {
  const response = await apiClient.get(`/bom/${id}`)
  return unwrapResponse(response)
}

export async function createBom(payload) {
  const response = await apiClient.post('/bom', payload)
  return unwrapResponse(response)
}

export async function updateBom(id, payload) {
  const response = await apiClient.put(`/bom/${id}`, payload)
  return unwrapResponse(response)
}

export async function deleteBom(id) {
  const response = await apiClient.delete(`/bom/${id}`)
  return unwrapResponse(response)
}

export async function getMaterialRequirements(payload) {
  const response = await apiClient.post('/bom/material-requirements', payload)
  return unwrapResponse(response)
}
