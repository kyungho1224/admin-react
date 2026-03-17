import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

const BASE = '/v3/admin/store'

/**
 * 유저별·상품별 상점 성과 집계 (해당 월 기준)
 * @param {Object} params
 * @param {number} params.year - 년 (예: 2026)
 * @param {number} params.month - 월 (1~12)
 * @param {number[]} [params.product_ids] - 상품 ID 목록
 * @param {string} [params.user_keyword] - 공유자 검색 (닉네임/이메일/user_id)
 * @param {number} [params.limit=100]
 * @param {number} [params.offset=0]
 */
export async function getStorePerformanceByUserProduct(params = {}) {
  const { year, month, product_ids, user_keyword, limit = 100, offset = 0 } = params
  const searchParams = new URLSearchParams()
  if (year != null) searchParams.set('year', String(year))
  if (month != null) searchParams.set('month', String(month))
  if (product_ids?.length) searchParams.set('product_ids', product_ids.join(','))
  if (user_keyword != null && user_keyword !== '') searchParams.set('user_keyword', user_keyword)
  searchParams.set('limit', String(limit))
  searchParams.set('offset', String(offset))

  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/performance/by-user-product?${searchParams.toString()}`)
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
 * affiliate_earnings 개별 목록 (집계중/지급예정/지급완료 필터)
 * @param {Object} params
 * @param {number} [params.user_id] - 공유자 user_id
 * @param {number} [params.product_id] - 상품 ID
 * @param {string} [params.start_date] - YYYY-MM-DD
 * @param {string} [params.end_date] - YYYY-MM-DD
 * @param {string} [params.status] - aggregating | scheduled | paid
 * @param {number} [params.limit=100]
 * @param {number} [params.offset=0]
 */
export async function listStoreEarnings(params = {}) {
  const { user_id, product_id, start_date, end_date, status, limit = 100, offset = 0 } = params
  const searchParams = new URLSearchParams()
  if (user_id != null) searchParams.set('user_id', String(user_id))
  if (product_id != null) searchParams.set('product_id', String(product_id))
  if (start_date) searchParams.set('start_date', start_date)
  if (end_date) searchParams.set('end_date', end_date)
  if (status) searchParams.set('status', status)
  searchParams.set('limit', String(limit))
  searchParams.set('offset', String(offset))

  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/earnings?${searchParams.toString()}`)
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
 * 확정 금액 입력 (집계중 → 지급 예정)
 * @param {number} earningId - affiliate_earnings.id
 * @param {Object} body
 * @param {number} body.final_amount - 확정 금액 (원, 0 이상)
 * @param {number} [body.fx_rate] - 적용 환율 (선택)
 */
export async function updateEarningFinalAmount(earningId, body) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/earnings/${earningId}/final-amount`)
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
 * 지급 완료 처리 (paid_at 설정)
 * @param {number[]} earningIds - affiliate_earnings.id 목록
 */
export async function markEarningsPaid(earningIds) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/earnings/mark-paid`)
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ earning_ids: earningIds }),
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
 * 유저별 정산 계좌 조회 (은행/계좌번호/예금주)
 * @param {number} userId - payment.users.id
 */
export async function getStoreUserSettlementAccount(userId) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `${BASE}/users/${userId}/settlement-account`)
  const response = await fetch(url, { headers: getAuthHeaders() })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  const body = await handleResponse(response)
  return body && typeof body === 'object' ? body : {}
}
