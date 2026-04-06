import { getServiceUrl, ServicePort } from '../apiClient'
import { getAuthHeaders, handleResponse } from './apiUtils'

export async function getAdminEvents(includeInactive = true) {
  const response = await fetch(
    getServiceUrl(
      ServicePort.NOTIFICATION,
      `/v3/admin/events?include_inactive=${includeInactive ? 'true' : 'false'}`
    ),
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function getAdminEventDetail(eventId) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/events/${eventId}`),
    { headers: getAuthHeaders() }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function createAdminEvent(eventData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/admin/events'),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData),
    }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function createAdminEventItem(eventId, itemData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/events/${eventId}/items`),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function updateAdminEvent(eventId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/events/${eventId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function updateAdminEventItem(eventId, itemId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/events/${eventId}/items/${itemId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function deleteAdminEventItem(eventId, itemId) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/events/${eventId}/items/${itemId}`),
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function getAdminNotices(includeInactive = true) {
  const response = await fetch(
    getServiceUrl(
      ServicePort.NOTIFICATION,
      `/v3/admin/notices?include_inactive=${includeInactive ? 'true' : 'false'}`
    ),
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}

export async function getAdminNoticeDetail(noticeId) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/admin/notices/${noticeId}`),
    { headers: getAuthHeaders() }
  )
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || errorData.result?.message || `HTTP error! status: ${response.status}`)
  }
  return handleResponse(response)
}
