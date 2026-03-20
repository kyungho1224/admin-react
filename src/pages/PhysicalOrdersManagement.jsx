import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Descriptions, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { listPhysicalOrders, listShippingCarriers, updateOrderShippingStatus, updateOrderTracking } from '../services/api'

const { Title, Text } = Typography

const STATUS_OPTIONS = [
  { value: 'preparing', label: '배송 준비중' },
  { value: 'shipped', label: '배송 중' },
  { value: 'delivered', label: '배송 완료' },
]

const STATUS_LABEL_MAP = {
  preparing: { color: 'default', text: '배송 준비중' },
  shipped: { color: 'processing', text: '배송 중' },
  delivered: { color: 'success', text: '배송 완료' },
}

const ORDER_ID_KEYS = ['id', 'order_id', 'orderId']
const SHIPPING_STATUS_KEYS = ['shipping_status', 'shippingStatus']
const CARRIER_KEYS = ['shipping_carrier_code', 'shippingCarrierCode', 'carrier_code', 'carrierCode']
const TRACKING_KEYS = ['shipping_tracking_no', 'shippingTrackingNo', 'tracking_no', 'trackingNo']

function formatDateTime(value) {
  if (!value) return '-'
  const d = dayjs(value)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : '-'
}

function getValueByKeys(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null && obj[key] !== '') {
      return obj[key]
    }
  }
  return undefined
}

function PhysicalOrdersManagement() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ status: undefined, q: '' })
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })

  const [trackingModalOpen, setTrackingModalOpen] = useState(false)
  const [trackingTarget, setTrackingTarget] = useState(null)
  const [trackingCarrierCode, setTrackingCarrierCode] = useState('')
  const [trackingNo, setTrackingNo] = useState('')
  const [trackingSaving, setTrackingSaving] = useState(false)
  const [shippingCarriers, setShippingCarriers] = useState([])
  const [shippingCarriersLoading, setShippingCarriersLoading] = useState(false)

  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusForm, setStatusForm] = useState({
    shipping_status: 'preparing',
    message: '',
    carrier_code: '',
    tracking_no: '',
  })
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)

  const fetchOrders = useCallback(async (nextPagination = pagination, nextFilters = filters) => {
    setLoading(true)
    try {
      const params = {
        status: nextFilters.status || undefined,
        q: nextFilters.q?.trim() || undefined,
        limit: nextPagination.pageSize,
        offset: (nextPagination.current - 1) * nextPagination.pageSize,
      }
      const res = await listPhysicalOrders(params)
      const list = Array.isArray(res?.data) ? res.data : []
      const totalCount = Number(res?.pagination?.total ?? res?.pagination?.count ?? list.length ?? 0)
      setOrders(list)
      setTotal(totalCount)
    } catch (err) {
      console.error(err)
      message.error(err.message || '실물 주문 목록 조회에 실패했습니다.')
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [pagination, filters])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const fetchShippingCarriers = useCallback(async () => {
    setShippingCarriersLoading(true)
    try {
      const list = await listShippingCarriers()
      setShippingCarriers(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error(err)
      message.error(err.message || '택배사 목록 조회에 실패했습니다.')
      setShippingCarriers([])
    } finally {
      setShippingCarriersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShippingCarriers()
  }, [fetchShippingCarriers])

  const shippingCarrierNameMap = useMemo(() => {
    return (shippingCarriers || []).reduce((acc, carrier) => {
      if (carrier?.code) acc[carrier.code] = carrier.name || carrier.code
      return acc
    }, {})
  }, [shippingCarriers])

  const normalizeRows = useMemo(() => {
    return orders.map((row, idx) => {
      const orderId = getValueByKeys(row, ORDER_ID_KEYS)
      const orderIdToss = getValueByKeys(row, ['orderIdToss', 'order_id_toss', 'orderId'])
      const paymentStatus = getValueByKeys(row, ['status']) || '-'
      const shippingStatus =
        getValueByKeys(row, SHIPPING_STATUS_KEYS)
        || (getValueByKeys(row, ['deliveredAt', 'delivered_at']) ? 'delivered' : null)
        || (getValueByKeys(row, ['shippedAt', 'shipped_at']) ? 'shipped' : null)
        || 'preparing'
      const carrierCode = getValueByKeys(row, CARRIER_KEYS) || ''
      const trackingNumber = getValueByKeys(row, TRACKING_KEYS) || ''
      const userId = getValueByKeys(row, ['user_id', 'userId'])
      const nickname = getValueByKeys(row, ['nickname', 'user_nickname', 'userNickname']) || '-'
      const customerName = getValueByKeys(row, ['customerName', 'customer_name']) || '-'
      const customerEmail = getValueByKeys(row, ['customerEmail', 'customer_email']) || '-'
      const customerPhone = getValueByKeys(row, ['customerPhone', 'customer_phone']) || '-'
      const productId = getValueByKeys(row, ['product_id', 'productId'])
      const productTitleI18n = getValueByKeys(row, ['productTitleI18n', 'product_title_i18n']) || {}
      const productTitle = productTitleI18n?.ko || getValueByKeys(row, ['product_title', 'productTitle', 'title']) || '-'
      const productSubtotal = getValueByKeys(row, ['productSubtotal', 'product_subtotal'])
      const shippingFeeTotal = getValueByKeys(row, ['shippingFeeTotal', 'shipping_fee_total', 'shippingFee', 'shipping_fee'])
      const totalAmount = getValueByKeys(row, ['totalAmount', 'total_amount', 'amount'])
      const currency = getValueByKeys(row, ['currency']) || 'KRW'
      const quantity = getValueByKeys(row, ['quantity']) ?? '-'
      const shippingFee = getValueByKeys(row, ['shippingFee', 'shipping_fee']) ?? '-'
      const orderedAt = getValueByKeys(row, ['paidAt', 'paid_at', 'ordered_at', 'orderedAt', 'created_at'])
      const shippedAt = getValueByKeys(row, ['shipped_at', 'shippedAt'])
      const deliveredAt = getValueByKeys(row, ['delivered_at', 'deliveredAt'])
      const shippingAddressSnapshot = getValueByKeys(row, ['shippingAddressSnapshot', 'shipping_address_snapshot']) || {}

      return {
        ...row,
        _rowKey: `${orderId ?? orderIdToss ?? 'row'}-${idx}`,
        _orderId: orderId,
        _orderIdToss: orderIdToss,
        _paymentStatus: paymentStatus,
        _shippingStatus: shippingStatus,
        _carrierCode: carrierCode,
        _trackingNo: trackingNumber,
        _userId: userId,
        _nickname: nickname,
        _customerName: customerName,
        _customerEmail: customerEmail,
        _customerPhone: customerPhone,
        _productId: productId,
        _productTitle: productTitle,
        _productTitleI18n: productTitleI18n,
        _productSubtotal: productSubtotal,
        _shippingFeeTotal: shippingFeeTotal,
        _totalAmount: totalAmount,
        _quantity: quantity,
        _shippingFee: shippingFee,
        _currency: currency,
        _orderedAt: orderedAt,
        _shippedAt: shippedAt,
        _deliveredAt: deliveredAt,
        _shippingAddressSnapshot: shippingAddressSnapshot,
      }
    })
  }, [orders])

  const handleTableChange = (nextPagination) => {
    const updated = { current: nextPagination.current, pageSize: nextPagination.pageSize }
    setPagination(updated)
    fetchOrders(updated, filters)
  }

  const handleSearch = () => {
    const resetPagination = { ...pagination, current: 1 }
    setPagination(resetPagination)
    fetchOrders(resetPagination, filters)
  }

  const openTrackingModal = (row) => {
    setTrackingTarget(row)
    setTrackingCarrierCode(row._carrierCode || '')
    setTrackingNo(row._trackingNo || '')
    setTrackingModalOpen(true)
  }

  const submitTracking = async () => {
    if (!trackingTarget?._orderId) return
    if (!trackingCarrierCode.trim() || !trackingNo.trim()) {
      message.warning('택배사 코드와 송장번호를 입력해주세요.')
      return
    }
    setTrackingSaving(true)
    try {
      await updateOrderTracking(trackingTarget._orderId, {
        carrier_code: trackingCarrierCode.trim(),
        tracking_no: trackingNo.trim(),
      })
      message.success('송장 정보가 저장되고 배송 중으로 변경되었습니다.')
      setTrackingModalOpen(false)
      setTrackingTarget(null)
      fetchOrders()
    } catch (err) {
      message.error(err.message || '송장 입력에 실패했습니다.')
    } finally {
      setTrackingSaving(false)
    }
  }

  const openStatusModal = (row) => {
    setStatusTarget(row)
    setStatusForm({
      shipping_status: row._shippingStatus || 'preparing',
      message: '',
      carrier_code: row._carrierCode || '',
      tracking_no: row._trackingNo || '',
    })
    setStatusModalOpen(true)
  }

  const submitStatus = async () => {
    if (!statusTarget?._orderId) return
    if (statusForm.shipping_status === 'shipped') {
      const carrier = statusForm.carrier_code?.trim() || statusTarget._carrierCode?.trim()
      const tracking = statusForm.tracking_no?.trim() || statusTarget._trackingNo?.trim()
      if (!carrier || !tracking) {
        message.warning('배송 중(shipped) 상태는 택배사 코드와 송장번호가 필요합니다.')
        return
      }
    }

    setStatusSaving(true)
    try {
      await updateOrderShippingStatus(statusTarget._orderId, {
        shipping_status: statusForm.shipping_status,
        message: statusForm.message?.trim() || undefined,
        carrier_code: statusForm.carrier_code?.trim() || undefined,
        tracking_no: statusForm.tracking_no?.trim() || undefined,
      })
      message.success('배송 상태가 업데이트되었습니다.')
      setStatusModalOpen(false)
      setStatusTarget(null)
      fetchOrders()
    } catch (err) {
      message.error(err.message || '배송 상태 변경에 실패했습니다.')
    } finally {
      setStatusSaving(false)
    }
  }

  const exportExcel = () => {
    if (!normalizeRows.length) {
      message.info('다운로드할 데이터가 없습니다.')
      return
    }
    const rows = normalizeRows.map((row) => ({
      주문ID: row._orderId ?? '-',
      상태: STATUS_LABEL_MAP[row._shippingStatus]?.text ?? row._shippingStatus ?? '-',
      유저ID: row._userId ?? '-',
      닉네임: row._nickname ?? '-',
      상품ID: row._productId ?? '-',
      상품명: row._productTitle ?? '-',
      상품가격: row._productSubtotal ?? '-',
      배송비: row._shippingFeeTotal ?? '-',
      최종금액: row._totalAmount ?? '-',
      통화: row._currency ?? 'KRW',
      택배사코드: row._carrierCode ?? '-',
      송장번호: row._trackingNo ?? '-',
      주문시각: formatDateTime(row._orderedAt),
      배송시작시각: formatDateTime(row._shippedAt),
      배송완료시각: formatDateTime(row._deliveredAt),
    }))

    const sheet = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'PhysicalOrders')
    const fileName = `physical-orders-${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const columns = [
    {
      title: '주문 ID',
      dataIndex: '_orderIdToss',
      key: '_orderIdToss',
      width: 140,
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '배송상태',
      dataIndex: '_shippingStatus',
      key: '_shippingStatus',
      width: 100,
      render: (v) => {
        const view = STATUS_LABEL_MAP[v] || { color: 'default', text: v || '-' }
        return <Tag color={view.color}>{view.text}</Tag>
      },
    },
    { title: '구매자', dataIndex: '_customerName', key: '_customerName', width: 100, ellipsis: true },
    { title: '상품명', dataIndex: '_productTitle', key: '_productTitle', width: 180, ellipsis: true },
    {
      title: '최종 금액',
      key: '_totalAmount',
      width: 70,
      align: 'right',
      render: (_, row) => (row._totalAmount != null ? Number(row._totalAmount).toLocaleString() : '-'),
    },
    { title: '수량', dataIndex: '_quantity', key: '_quantity', width: 50, align: 'right' },
    {
      title: '택배사',
      dataIndex: '_carrierCode',
      key: '_carrierCode',
      width: 120,
      render: (v) => (v ? shippingCarrierNameMap[v] || v : '-'),
    },
    { title: '송장번호', dataIndex: '_trackingNo', key: '_trackingNo', width: 150, render: (v) => v || '-' },
    {
      title: '주문시각',
      dataIndex: '_orderedAt',
      key: '_orderedAt',
      width: 150,
      render: (v) => formatDateTime(v),
    },
    {
      title: '액션',
      key: 'actions',
      width: 110,
      render: (_, row) => (
        <Space direction="vertical" size={6}>
          <Button size="small" onClick={(e) => { e.stopPropagation(); openTrackingModal(row) }}>
            송장 입력
          </Button>
          <Button size="small" onClick={(e) => { e.stopPropagation(); openStatusModal(row) }}>
            상태 변경
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Title level={4} style={{ margin: 0 }}>실물 상품 주문 관리</Title>
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={exportExcel}>
              엑셀 다운로드
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchOrders()}>
              새로고침
            </Button>
          </Space>
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          <span>상태</span>
          <Select
            style={{ width: 160 }}
            placeholder="전체"
            allowClear
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
          />
          <span>검색</span>
          <Input
            style={{ width: 260 }}
            placeholder="주문ID/유저/상품 등 검색"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            allowClear
            onPressEnter={handleSearch}
          />
          <Button type="primary" onClick={handleSearch}>조회</Button>
        </Space>

        <Table
          style={{ marginTop: 16 }}
          rowKey={(row) => row._rowKey}
          columns={columns}
          dataSource={normalizeRows}
          loading={loading}
          onRow={(row) => ({
            onClick: () => {
              setDetailTarget(row)
              setDetailModalOpen(true)
            },
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `총 ${t}건`,
          }}
          onChange={handleTableChange}
        />

        <Text type="secondary">
          shipped 상태 변경 시 송장 정보가 필수입니다. 기존 송장 정보가 이미 있으면 새로 입력하지 않아도 됩니다.
        </Text>
      </Card>

      <Modal
        title={`송장 입력${trackingTarget?._orderId ? ` - ${trackingTarget._orderId}` : ''}`}
        open={trackingModalOpen}
        onCancel={() => setTrackingModalOpen(false)}
        onOk={submitTracking}
        confirmLoading={trackingSaving}
        okText="저장"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>택배사 코드</Text>
            <Select
              style={{ width: '100%' }}
              value={trackingCarrierCode}
              onChange={(v) => setTrackingCarrierCode(v)}
              placeholder="택배사를 선택하세요"
              loading={shippingCarriersLoading}
              options={shippingCarriers.map((carrier) => ({
                value: carrier.code,
                label: `${carrier.name} (${carrier.code})`,
              }))}
              showSearch
              optionFilterProp="label"
            />
          </div>
          <div>
            <Text>송장번호</Text>
            <Input
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="예: 1234-5678-9999"
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title={`배송 상태 변경${statusTarget?._orderId ? ` - ${statusTarget._orderId}` : ''}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={submitStatus}
        confirmLoading={statusSaving}
        okText="저장"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>배송 상태</Text>
            <Select
              style={{ width: '100%' }}
              value={statusForm.shipping_status}
              options={STATUS_OPTIONS}
              onChange={(v) => setStatusForm((prev) => ({ ...prev, shipping_status: v }))}
            />
          </div>
          <div>
            <Text>메시지 (선택)</Text>
            <Input
              value={statusForm.message}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="예: 택배사 시스템 동기화"
            />
          </div>
          <div>
            <Text>택배사 코드 (선택)</Text>
            <Input
              value={statusForm.carrier_code}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, carrier_code: e.target.value }))}
              placeholder="예: CJGLS"
            />
          </div>
          <div>
            <Text>송장번호 (선택)</Text>
            <Input
              value={statusForm.tracking_no}
              onChange={(e) => setStatusForm((prev) => ({ ...prev, tracking_no: e.target.value }))}
              placeholder="예: 1234-5678-9999"
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title={`주문 상세${detailTarget?._orderIdToss ? ` - ${detailTarget._orderIdToss}` : ''}`}
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false)
          setDetailTarget(null)
        }}
        footer={null}
        width={900}
      >
        {detailTarget && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions size="small" bordered column={2} title="상품정보">
              <Descriptions.Item label="상품 ID">{detailTarget._productId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="상품명">{detailTarget._productTitle ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="수량">{detailTarget._quantity ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="상품 가격">
                {detailTarget._productSubtotal != null ? `${Number(detailTarget._productSubtotal).toLocaleString()} ${detailTarget._currency}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="배송비">
                {detailTarget._shippingFeeTotal != null ? `${Number(detailTarget._shippingFeeTotal).toLocaleString()} ${detailTarget._currency}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="최종 금액">
                {detailTarget._totalAmount != null ? `${Number(detailTarget._totalAmount).toLocaleString()} ${detailTarget._currency}` : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions size="small" bordered column={2} title="주문정보">
              <Descriptions.Item label="주문 ID">
                {detailTarget._orderIdToss ? <Text copyable>{detailTarget._orderIdToss}</Text> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="내부 ID">{detailTarget._orderId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="주문상태">{detailTarget._paymentStatus ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="배송상태">{STATUS_LABEL_MAP[detailTarget._shippingStatus]?.text ?? detailTarget._shippingStatus ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="택배사명">
                {detailTarget._carrierCode ? shippingCarrierNameMap[detailTarget._carrierCode] || detailTarget._carrierCode : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="송장번호">
                {detailTarget._trackingNo ? <Text copyable>{detailTarget._trackingNo}</Text> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="주문시각">{formatDateTime(detailTarget._orderedAt)}</Descriptions.Item>
              <Descriptions.Item label="배송시작시각">{formatDateTime(detailTarget._shippedAt)}</Descriptions.Item>
              <Descriptions.Item label="배송완료시각">{formatDateTime(detailTarget._deliveredAt)}</Descriptions.Item>
            </Descriptions>

            <Descriptions size="small" bordered column={2} title="구매자정보">
              <Descriptions.Item label="유저 ID">{detailTarget._userId ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="이름">{detailTarget._customerName ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="이메일">{detailTarget._customerEmail ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="전화번호">{detailTarget._customerPhone ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="닉네임">{detailTarget._nickname ?? '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions size="small" bordered column={2} title="배송지정보">
              <Descriptions.Item label="수령인">{detailTarget._shippingAddressSnapshot?.recipient || '-'}</Descriptions.Item>
              <Descriptions.Item label="연락처">{detailTarget._shippingAddressSnapshot?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="우편번호">{detailTarget._shippingAddressSnapshot?.postalCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="주소">{detailTarget._shippingAddressSnapshot?.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="상세주소" span={2}>{detailTarget._shippingAddressSnapshot?.addressDetail || '-'}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default PhysicalOrdersManagement
