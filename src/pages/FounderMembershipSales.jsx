import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  message,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Tag,
  Select,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getStorePerformanceByUserProduct,
  listStoreEarnings,
  updateEarningFinalAmount,
  markEarningsPaid,
  getStoreUserSettlementAccount,
} from '../services/api'
import './FounderMembershipSales.css'

const { Title, Text } = Typography

const STATUS_LABEL = {
  aggregating: { color: 'default', text: '집계중' },
  scheduled: { color: 'processing', text: '지급 예정' },
  paid: { color: 'success', text: '지급 완료' },
}

function deriveStatus(row) {
  if (row.paidAt) return 'paid'
  if (row.finalAmount != null) return 'scheduled'
  return 'aggregating'
}

/** API는 유저·상품별로 오므로, 유저별로 합쳐서 summary 행으로 만든다 */
function aggregateByUser(rawList) {
  const byUser = {}
  ;(rawList || []).forEach((row) => {
    const k = row.userId
    if (k == null) return
    if (!byUser[k]) {
      byUser[k] = {
        userId: row.userId,
        nickname: row.nickname ?? '',
        email: row.email ?? '',
        visits: 0,
        sales: 0,
        tempAmountSum: 0,
        finalAmountSum: 0,
        aggregatingCount: 0,
        scheduledCount: 0,
        paidCount: 0,
      }
    }
    const u = byUser[k]
    u.visits += Number(row.visits) || 0
    u.sales += Number(row.sales) || 0
    u.tempAmountSum += Number(row.tempAmountSum) || 0
    u.finalAmountSum += Number(row.finalAmountSum) || 0
    u.aggregatingCount += Number(row.aggregatingCount) || 0
    u.scheduledCount += Number(row.scheduledCount) || 0
    u.paidCount += Number(row.paidCount) || 0
  })
  return Object.values(byUser).map((u) => ({
    ...u,
    conversionRate: u.visits ? (u.sales / u.visits) * 100 : 0,
  }))
}

function FounderMembershipSales() {
  const [loading, setLoading] = useState(false)
  const [rawList, setRawList] = useState([])
  const now = dayjs()
  const [filters, setFilters] = useState({
    year: now.year(),
    month: now.month() + 1,
    user_keyword: '',
  })

  const [selectedUserId, setSelectedUserId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [accountInfo, setAccountInfo] = useState(null)
  const [accountLoading, setAccountLoading] = useState(false)

  const [earningsModalOpen, setEarningsModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [selectedProductTitle, setSelectedProductTitle] = useState('')
  const [earningsList, setEarningsList] = useState([])
  const [earningsLoading, setEarningsLoading] = useState(false)
  const [editingFinalAmounts, setEditingFinalAmounts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [selectedEarningIds, setSelectedEarningIds] = useState([])
  const [markingPaidIds, setMarkingPaidIds] = useState([])

  const list = useMemo(() => aggregateByUser(rawList), [rawList])
  const selectedRow = useMemo(() => list.find((r) => r.userId === selectedUserId) ?? null, [list, selectedUserId])
  const drawerProductList = useMemo(
    () => (rawList || []).filter((r) => r.userId === selectedUserId),
    [rawList, selectedUserId]
  )

  const fetchPerformance = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getStorePerformanceByUserProduct({
        year: filters.year,
        month: filters.month,
        user_keyword: filters.user_keyword?.trim() || undefined,
        limit: 500,
        offset: 0,
      })
      setRawList(res?.data ?? [])
    } catch (err) {
      console.error(err)
      message.error(err.message || '성과 조회에 실패했습니다.')
      setRawList([])
    } finally {
      setLoading(false)
    }
  }, [filters.year, filters.month, filters.user_keyword])

  useEffect(() => {
    fetchPerformance()
  }, [fetchPerformance])

  useEffect(() => {
    if (!drawerOpen || selectedUserId == null) {
      setAccountInfo(null)
      return
    }
    setAccountLoading(true)
    getStoreUserSettlementAccount(selectedUserId)
      .then((data) => setAccountInfo(data || null))
      .catch(() => setAccountInfo(null))
      .finally(() => setAccountLoading(false))
  }, [drawerOpen, selectedUserId])

  const monthRange = useMemo(() => {
    const y = filters.year
    const m = filters.month
    const start = dayjs(`${y}-${String(m).padStart(2, '0')}-01`)
    const end = start.endOf('month')
    return { start_date: start.format('YYYY-MM-DD'), end_date: end.format('YYYY-MM-DD') }
  }, [filters.year, filters.month])

  const loadEarnings = useCallback(async () => {
    if (selectedUserId == null || selectedProductId == null) return
    setEarningsLoading(true)
    try {
      const res = await listStoreEarnings({
        user_id: selectedUserId,
        product_id: selectedProductId,
        start_date: monthRange.start_date,
        end_date: monthRange.end_date,
        limit: 200,
        offset: 0,
      })
      setEarningsList(res?.data ?? [])
    } catch (err) {
      console.error(err)
      message.error(err.message || '정산 내역 조회에 실패했습니다.')
      setEarningsList([])
    } finally {
      setEarningsLoading(false)
    }
  }, [selectedUserId, selectedProductId, monthRange.start_date, monthRange.end_date])

  useEffect(() => {
    if (earningsModalOpen && selectedUserId != null && selectedProductId != null) {
      loadEarnings()
    }
  }, [earningsModalOpen, selectedUserId, selectedProductId, loadEarnings])

  const handleSaveFinalAmount = async (earningId) => {
    const value = editingFinalAmounts[earningId]
    if (value == null || value < 0) {
      message.warning('확정 금액을 0 이상으로 입력하세요.')
      return
    }
    setSavingId(earningId)
    try {
      await updateEarningFinalAmount(earningId, { final_amount: Math.round(Number(value)) })
      message.success('확정 금액이 반영되었습니다. (지급 예정으로 변경)')
      setEditingFinalAmounts((prev) => {
        const next = { ...prev }
        delete next[earningId]
        return next
      })
      loadEarnings()
      fetchPerformance()
    } catch (err) {
      message.error(err.message || '저장에 실패했습니다.')
    } finally {
      setSavingId(null)
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedEarningIds?.length) {
      message.warning('지급 완료할 건을 선택하세요.')
      return
    }
    setMarkingPaidIds(selectedEarningIds)
    try {
      await markEarningsPaid(selectedEarningIds)
      message.success(`${selectedEarningIds.length}건 지급 완료 처리되었습니다.`)
      setSelectedEarningIds([])
      loadEarnings()
      fetchPerformance()
    } catch (err) {
      message.error(err.message || '지급 완료 처리에 실패했습니다.')
    } finally {
      setMarkingPaidIds([])
    }
  }

  const openEarningsModal = (productRecord) => {
    setSelectedProductId(productRecord.productId)
    setSelectedProductTitle(productRecord.productTitle || `상품 ${productRecord.productId}`)
    setEarningsModalOpen(true)
    setEarningsList([])
    setEditingFinalAmounts({})
    setSelectedEarningIds([])
  }

  const productColumns = [
    { title: '상품 ID', dataIndex: 'productId', key: 'productId', width: 90 },
    { title: '상품명', dataIndex: 'productTitle', key: 'productTitle', width: 160, ellipsis: true },
    {
      title: '판매수수료율(%)',
      dataIndex: 'commissionRatePct',
      key: 'commissionRatePct',
      width: 110,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(1) : '-'),
    },
    { title: '유입', dataIndex: 'visits', key: 'visits', width: 80, align: 'right' },
    { title: '판매', dataIndex: 'sales', key: 'sales', width: 80, align: 'right' },
    {
      title: '전환율(%)',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      width: 90,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(1) : '-'),
    },
    {
      title: '임시 합계(원)',
      dataIndex: 'tempAmountSum',
      key: 'tempAmountSum',
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString() : '-'),
    },
    {
      title: '확정 합계(원)',
      dataIndex: 'finalAmountSum',
      key: 'finalAmountSum',
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString() : '-'),
    },
    { title: '집계중', dataIndex: 'aggregatingCount', key: 'aggregatingCount', width: 80, align: 'right' },
    { title: '지급예정', dataIndex: 'scheduledCount', key: 'scheduledCount', width: 90, align: 'right' },
    { title: '지급완료', dataIndex: 'paidCount', key: 'paidCount', width: 90, align: 'right' },
  ]

  const earningsColumns = [
    { title: 'Earning ID', dataIndex: 'earningId', key: 'earningId', width: 90 },
    {
      title: '주문 ID',
      key: 'orderId',
      width: 140,
      render: (_, row) => row.order?.orderIdToss ?? '-',
    },
    {
      title: '임시 금액(원)',
      dataIndex: 'tempAmount',
      key: 'tempAmount',
      width: 110,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString() : '-'),
    },
    {
      title: '확정 금액(원)',
      key: 'finalAmount',
      width: 220,
      render: (_, row) => {
        const status = deriveStatus(row)
        const isEditing = status === 'aggregating' || (status === 'scheduled' && !row.paidAt)
        const value = editingFinalAmounts[row.earningId] ?? row.finalAmount ?? row.tempAmount ?? ''
        return (
          <Space>
            {isEditing ? (
              <>
                <InputNumber
                  min={0}
                  value={value}
                  onChange={(v) => setEditingFinalAmounts((prev) => ({ ...prev, [row.earningId]: v }))}
                  style={{ width: 130 }}
                  placeholder="확정 금액"
                />
                <Button
                  type="primary"
                  size="small"
                  loading={savingId === row.earningId}
                  onClick={() => handleSaveFinalAmount(row.earningId)}
                >
                  저장
                </Button>
              </>
            ) : (
              <Text>{row.finalAmount != null ? Number(row.finalAmount).toLocaleString() : '-'}</Text>
            )}
          </Space>
        )
      },
    },
    {
      title: '상태',
      key: 'status',
      width: 100,
      render: (_, row) => {
        const status = deriveStatus(row)
        const { color, text } = STATUS_LABEL[status] || { color: 'default', text: status }
        return <Tag color={color}>{text}</Tag>
      },
    },
  ]

  const performanceColumns = [
    { title: '유저 ID', dataIndex: 'userId', key: 'userId', width: 90, render: (v) => v ?? '-' },
    { title: '닉네임', dataIndex: 'nickname', key: 'nickname', width: 100, ellipsis: true },
    { title: '이메일', dataIndex: 'email', key: 'email', width: 160, ellipsis: true },
    { title: '유입', dataIndex: 'visits', key: 'visits', width: 80, align: 'right' },
    { title: '판매', dataIndex: 'sales', key: 'sales', width: 80, align: 'right' },
    {
      title: '전환율(%)',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      width: 90,
      align: 'right',
      render: (v) => (v != null ? Number(v).toFixed(1) : '-'),
    },
    {
      title: '임시 합계(원)',
      dataIndex: 'tempAmountSum',
      key: 'tempAmountSum',
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString() : '-'),
    },
    {
      title: '확정 합계(원)',
      dataIndex: 'finalAmountSum',
      key: 'finalAmountSum',
      width: 120,
      align: 'right',
      render: (v) => (v != null ? Number(v).toLocaleString() : '-'),
    },
    { title: '집계중', dataIndex: 'aggregatingCount', key: 'aggregatingCount', width: 80, align: 'right' },
    { title: '지급예정', dataIndex: 'scheduledCount', key: 'scheduledCount', width: 80, align: 'right' },
    { title: '지급완료', dataIndex: 'paidCount', key: 'paidCount', width: 80, align: 'right' },
  ]

  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="founder-membership-sales">
      <Title level={4}>유저별 판매 실적</Title>
      <Card>
        <Space wrap className="founder-membership-sales-filters">
          <Space>
            <Text>기간(년·월)</Text>
            <Select
              value={filters.year}
              onChange={(y) => setFilters((f) => ({ ...f, year: y }))}
              options={years.map((y) => ({ label: `${y}년`, value: y }))}
              style={{ width: 100 }}
            />
            <Select
              value={filters.month}
              onChange={(m) => setFilters((f) => ({ ...f, month: m }))}
              options={months.map((m) => ({ label: `${m}월`, value: m }))}
              style={{ width: 80 }}
            />
          </Space>
          <Space>
            <Text>유저 검색</Text>
            <Input
              placeholder="닉네임/이메일/유저ID"
              value={filters.user_keyword}
              onChange={(e) => setFilters((f) => ({ ...f, user_keyword: e.target.value }))}
              style={{ width: 180 }}
              allowClear
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPerformance} loading={loading}>
            조회
          </Button>
        </Space>

        <Table
          columns={performanceColumns}
          dataSource={list}
          rowKey="userId"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => `총 ${t}건`,
          }}
          locale={{ emptyText: '조건에 맞는 데이터가 없습니다.' }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedUserId(record.userId)
              setDrawerOpen(true)
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Drawer
        title={selectedRow ? `유저 상세: ${selectedRow.nickname || selectedRow.userId}` : '유저 상세'}
        placement="right"
        width={1360}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedUserId(null)
        }}
      >
        {selectedRow && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">유저 ID {selectedRow.userId} · {selectedRow.email || '-'}</Text>
            </div>
            <Card size="small" title="계좌 정보" loading={accountLoading} style={{ marginBottom: 16 }}>
              {accountInfo && (accountInfo.bankName || accountInfo.accountNo) ? (
                <Space direction="vertical" size={4}>
                  <div><Text type="secondary">은행</Text> {accountInfo.bankName || '-'}</div>
                  <div><Text type="secondary">계좌번호</Text> {accountInfo.accountNo || '-'}</div>
                  <div><Text type="secondary">예금주</Text> {accountInfo.holderName || '-'}</div>
                </Space>
              ) : (
                <Text type="secondary">등록된 정산 계좌가 없습니다.</Text>
              )}
            </Card>
            <Text strong>상품별 실적 (행 클릭 시 정산 내역 모달)</Text>
            <Table
              size="small"
              columns={productColumns}
              dataSource={drawerProductList}
              rowKey={(r) => `${r.userId}-${r.productId}`}
              loading={loading}
              scroll={{ x: 900 }}
              pagination={false}
              locale={{ emptyText: '해당 유저의 상품 데이터가 없습니다.' }}
              onRow={(record) => ({
                onClick: () => openEarningsModal(record),
                style: { cursor: 'pointer' },
              })}
            />
          </Space>
        )}
      </Drawer>

      <Modal
        title={`정산 내역 - ${selectedProductTitle}`}
        open={earningsModalOpen}
        onCancel={() => {
          setEarningsModalOpen(false)
          setSelectedProductId(null)
          setSelectedProductTitle('')
        }}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Table
          size="small"
          columns={earningsColumns}
          dataSource={earningsList}
          rowKey="earningId"
          loading={earningsLoading}
          pagination={false}
          scroll={{ x: 700 }}
          locale={{ emptyText: '내역이 없습니다.' }}
          rowSelection={{
            selectedRowKeys: selectedEarningIds,
            onChange: (keys) => setSelectedEarningIds(keys),
            getCheckboxProps: (row) => ({
              disabled: !!row.paidAt,
            }),
          }}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="primary"
            onClick={handleMarkPaid}
            loading={markingPaidIds.length > 0}
            disabled={selectedEarningIds.length === 0}
          >
            선택 건 지급 완료
          </Button>
          <Text type="secondary">
            집계중: 확정 금액 입력 후 저장 → 지급 예정. 지급 예정 건을 선택 후 지급 완료 버튼으로 처리.
          </Text>
        </div>
      </Modal>
    </div>
  )
}

export default FounderMembershipSales
