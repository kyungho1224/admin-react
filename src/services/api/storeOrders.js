import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

const BASE = '/v3/admin/store'

/**
 * 실물 주문 목록 조회 (어드민)
 * @param {Object} params
 * @param {'preparing'|'shipped'|'delivered'} [params.status]
 * @param {string} [params.q]
 * @param {number} [params.limit=100]
 * @param {number} [params.offset=0]
 */
export async function listPhysicalOrders(params = {}) {
  const { status, q, limit = 100, offset = 0 } = params
  const searchParams = new URLSearchParams()
  if (status) searchParams.set('status', status)
  if (q != null && q !== '') searchParams.set('q', q)
  searchParams.set('limit', String(limit))
  searchParams.set('offset', String(offset))

  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/orders/physical?${searchParams.toString()}`)
  const response = await fetch(url, { headers: getAuthHeaders() })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  const body = await handleResponse(response)
  return body?.data != null ? body : { data: [], pagination: {} }
}

/**
 * 배송 택배사 목록 조회
 * @returns {Promise<Array<{code: string, name: string}>>}
 */
export async function listShippingCarriers() {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/shipping-carriers`)
  const response = await fetch(url, { headers: getAuthHeaders() })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  const body = await handleResponse(response)
  return Array.isArray(body) ? body : body?.items ?? body?.data ?? []
}

/**
 * 송장 입력 + shipped 전환
 * @param {string|number} orderId
 * @param {{carrier_code: string, tracking_no: string}} body
 */
export async function updateOrderTracking(orderId, body) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/orders/${orderId}/tracking`)
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  return handleResponse(response)
}

/**
 * 배송 상태 수동/동기화 업데이트
 * @param {string|number} orderId
 * @param {{shipping_status: 'preparing'|'shipped'|'delivered', message?: string, carrier_code?: string, tracking_no?: string}} body
 */
export async function updateOrderShippingStatus(orderId, body) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/orders/${orderId}/shipping-status`)
  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  return handleResponse(response)
}
