import { getServiceUrl, ServicePort } from '../apiClient'
import { handleResponse, getAuthHeaders } from './apiUtils'

/**
 * 바우처 생성 시 보상으로 선택할 아이템 목록 (inventory_service.items)
 * @param {Object} params
 * @param {string} [params.item_type] - item_type 필터 (plan, energy, gold_bar 등)
 * @param {number} [params.limit=500] - 조회 개수 (1~1000)
 */
export async function getVoucherItems(params = {}) {
  const { item_type, limit = 500 } = params
  const searchParams = new URLSearchParams()
  if (item_type != null && item_type !== '') searchParams.set('item_type', item_type)
  searchParams.set('limit', String(limit))

  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/voucher-codes/items?${searchParams.toString()}`)
  const response = await fetch(url, { headers: getAuthHeaders() })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  const body = await handleResponse(response)
  return Array.isArray(body) ? body : body?.data ?? []
}

/**
 * 바우처 코드 목록 조회
 * @param {Object} params
 * @param {number} [params.cursor] - 페이지네이션 커서 (voucher_code_id)
 * @param {number} [params.limit=20] - 페이지 크기 (1~100)
 * @param {string} [params.voucher_type] - voucher_type 필터
 * @param {boolean} [params.is_active_flag] - 활성 여부 필터
 * @param {boolean} [params.sold] - true=판매됨, false=미판매
 */
export async function listVoucherCodes(params = {}) {
  const { cursor, limit = 20, voucher_type, is_active_flag, sold } = params
  const searchParams = new URLSearchParams()
  if (cursor != null) searchParams.set('cursor', cursor)
  searchParams.set('limit', String(limit))
  if (voucher_type != null && voucher_type !== '') searchParams.set('voucher_type', voucher_type)
  if (is_active_flag !== undefined && is_active_flag !== null) searchParams.set('is_active_flag', String(is_active_flag))
  if (sold !== undefined && sold !== null) searchParams.set('sold', String(sold))

  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/voucher-codes?${searchParams.toString()}`)
  const response = await fetch(url, { headers: getAuthHeaders() })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  return handleResponse(response)
}

/**
 * 바우처 코드 상세 조회
 * @param {number} voucherCodeId - voucher_code_id
 */
export async function getVoucherCode(voucherCodeId) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/voucher-codes/${voucherCodeId}`)
  const response = await fetch(url, { headers: getAuthHeaders() })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || errorData.result?.message || errorData.message || `HTTP error! status: ${response.status}`
    )
  }
  return handleResponse(response)
}

/**
 * 바우처 코드 생성
 * 방식 A: code 지정 → 1건. 방식 B: count 지정 → 난수 코드 N건.
 * @param {Object} body
 * @param {string} [body.code] - 방식 A 시 코드 (단일 1건)
 * @param {number} [body.count] - 방식 B 시 개수 (난수 N건)
 * @param {string} body.code_name
 * @param {string} body.voucher_type
 * @param {number} body.use_count_limit
 * @param {boolean} [body.is_active_flag=true]
 * @param {boolean} [body.use_expired_flag=false]
 * @param {string} [body.start_at] - ISO datetime
 * @param {string} [body.expired_at] - ISO datetime
 * @param {Array<{item_id: number, item_cnt?: number, is_lifetime_membership?: boolean}>} body.rewards
 */
export async function createVoucherCodes(body) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/voucher-codes')
  const response = await fetch(url, {
    method: 'POST',
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
 * 바우처 코드 수정 (부분 업데이트)
 * @param {number} voucherCodeId - voucher_code_id
 * @param {Object} body - 수정할 필드만 (code_name, voucher_type, use_count_limit, sold_at, is_active_flag, use_expired_flag, start_at, expired_at, rewards)
 */
export async function patchVoucherCode(voucherCodeId, body) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/voucher-codes/${voucherCodeId}`)
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
