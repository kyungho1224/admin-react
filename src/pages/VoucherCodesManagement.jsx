import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  message,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Row,
  Col,
  DatePicker,
} from 'antd'
import { PlusOutlined, ReloadOutlined, GiftOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { listVoucherCodes, createVoucherCodes, getVoucherItems } from '../services/api'
import './VoucherCodesManagement.css'

const { Title } = Typography
const { Option } = Select

function VoucherCodesManagement() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ next_cursor: null, has_more: false })
  const [filters, setFilters] = useState({
    voucher_type: undefined,
    is_active_flag: undefined,
    sold: undefined,
  })
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createMode, setCreateMode] = useState('single') // 'single' | 'batch'
  const [voucherItems, setVoucherItems] = useState([])
  const [voucherItemsLoading, setVoucherItemsLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchList = useCallback(async (cursor = null, append = false) => {
    setLoading(true)
    try {
      const res = await listVoucherCodes({
        cursor: cursor != null ? Number(cursor) : undefined,
        limit: 20,
        voucher_type: filters.voucher_type || undefined,
        is_active_flag: filters.is_active_flag,
        sold: filters.sold,
      })
      const list = res?.data ?? []
      const pag = res?.pagination ?? {}
      if (append) {
        setData((prev) => [...prev, ...list])
      } else {
        setData(list)
      }
      const next = pag.next_cursor != null ? Number(pag.next_cursor) : null
      setPagination({ next_cursor: next, has_more: !!pag.has_more })
    } catch (err) {
      console.error(err)
      message.error(err.message || '목록 조회에 실패했습니다.')
      if (!append) setData([])
    } finally {
      setLoading(false)
    }
  }, [filters.voucher_type, filters.is_active_flag, filters.sold])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const fetchVoucherItems = async (itemType) => {
    setVoucherItemsLoading(true)
    try {
      const list = await getVoucherItems({ item_type: itemType || undefined, limit: 500 })
      const arr = Array.isArray(list) ? list : []
      arr.sort((a, b) => (a.item_id ?? 0) - (b.item_id ?? 0))
      setVoucherItems(arr)
    } catch (err) {
      console.error(err)
      message.error('아이템 목록 조회에 실패했습니다.')
      setVoucherItems([])
    } finally {
      setVoucherItemsLoading(false)
    }
  }

  const handleCreateOpen = () => {
    setCreateMode('single')
    form.resetFields()
    form.setFieldsValue({
      code: '',
      count: undefined,
      code_name: '',
      voucher_type: '',
      use_count_limit: 1,
      is_active_flag: true,
      use_expired_flag: false,
      start_at: undefined,
      expired_at: undefined,
      rewards: [{ item_id: undefined, item_cnt: 1, is_lifetime_membership: false }],
    })
    setCreateModalOpen(true)
    fetchVoucherItems()
  }

  const handleCreateSubmit = async (values) => {
    setCreateLoading(true)
    try {
      const rewards = (values.rewards || []).filter((r) => r?.item_id != null).map((r) => ({
        item_id: Number(r.item_id),
        item_cnt: Number(r.item_cnt) || 1,
        is_lifetime_membership: !!r.is_lifetime_membership,
      }))
      if (rewards.length === 0) {
        message.warning('보상 항목을 1개 이상 입력해주세요.')
        setCreateLoading(false)
        return
      }

      const body = {
        code_name: values.code_name,
        voucher_type: values.voucher_type,
        use_count_limit: Number(values.use_count_limit) || 1,
        is_active_flag: !!values.is_active_flag,
        use_expired_flag: !!values.use_expired_flag,
        start_at: values.start_at ? dayjs(values.start_at).toISOString() : null,
        expired_at: values.expired_at ? dayjs(values.expired_at).toISOString() : null,
        rewards,
      }

      if (createMode === 'single' && values.code?.trim()) {
        body.code = values.code.trim()
      } else if (createMode === 'batch' && values.count > 0) {
        body.count = Number(values.count)
      } else {
        message.warning(createMode === 'single' ? '코드를 입력하거나, 난수 N건 생성으로 전환 후 개수를 입력해주세요.' : '생성 개수를 입력해주세요.')
        setCreateLoading(false)
        return
      }

      await createVoucherCodes(body)
      message.success(createMode === 'single' ? '바우처 코드가 생성되었습니다.' : '바우처 코드가 일괄 생성되었습니다.')
      setCreateModalOpen(false)
      form.resetFields()
      fetchList()
    } catch (err) {
      message.error(err.message || '생성에 실패했습니다.')
    } finally {
      setCreateLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'voucher_code_id', key: 'voucher_code_id', width: 80 },
    { title: '코드', dataIndex: 'code', key: 'code', width: 90, ellipsis: true, render: (t) => <code style={{ fontSize: 12 }}>{t}</code> },
    { title: '코드명', dataIndex: 'code_name', key: 'code_name', width: 200 },
    { title: '타입', dataIndex: 'voucher_type', key: 'voucher_type', width: 140 },
    { title: '사용 한도', dataIndex: 'use_count_limit', key: 'use_count_limit', width: 90 },
    {
      title: '판매',
      key: 'sold',
      width: 80,
      render: (_, r) => (r.sold_at ? <Tag color="blue">판매됨</Tag> : <Tag>미판매</Tag>),
    },
    {
      title: '활성',
      dataIndex: 'is_active_flag',
      key: 'is_active_flag',
      width: 70,
      render: (v) => (v ? <Tag color="green">활성</Tag> : <Tag color="default">비활성</Tag>),
    },
    {
      title: '시작일',
      dataIndex: 'start_at',
      key: 'start_at',
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '종료일',
      dataIndex: 'expired_at',
      key: 'expired_at',
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
  ]

  return (
    <div className="voucher-codes-management">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Title level={4} style={{ margin: 0 }}>
            <GiftOutlined /> 바우처 코드 (프로모션)
          </Title>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOpen}>
              코드 생성
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchList()}>
              새로고침
            </Button>
          </Space>
        </div>

        <Space style={{ marginTop: 16 }} wrap>
          <span>타입:</span>
          <Input
            placeholder="voucher_type 필터"
            value={filters.voucher_type ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, voucher_type: e.target.value || undefined }))}
            style={{ width: 140 }}
            allowClear
          />
          <span>활성:</span>
          <Select
            value={filters.is_active_flag}
            onChange={(v) => setFilters((f) => ({ ...f, is_active_flag: v }))}
            style={{ width: 100 }}
            placeholder="전체"
            allowClear
          >
            <Option value={true}>활성</Option>
            <Option value={false}>비활성</Option>
          </Select>
          <span>판매:</span>
          <Select
            value={filters.sold}
            onChange={(v) => setFilters((f) => ({ ...f, sold: v }))}
            style={{ width: 100 }}
            placeholder="전체"
            allowClear
          >
            <Option value={true}>판매됨</Option>
            <Option value={false}>미판매</Option>
          </Select>
        </Space>

        <Table
          style={{ marginTop: 16 }}
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey="voucher_code_id"
          pagination={false}
          scroll={{ x: 900 }}
        />
        {pagination.has_more && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button onClick={() => fetchList(pagination.next_cursor, true)} loading={loading}>
              더 불러오기
            </Button>
          </div>
        )}
      </Card>

      <Modal
        title="바우처 코드 생성"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit} initialValues={{ use_count_limit: 1, is_active_flag: true, use_expired_flag: false }}>
          <Form.Item label="생성 방식">
            <Select value={createMode} onChange={setCreateMode} style={{ width: '100%' }}>
              <Option value="single">단일 코드 (코드 직접 입력)</Option>
              <Option value="batch">난수 코드 N건 생성</Option>
            </Select>
          </Form.Item>
          {createMode === 'single' && (
            <Form.Item name="code" label="코드" rules={[{ required: true, message: '코드를 입력하세요' }]}>
              <Input placeholder="예: PROMO2024" />
            </Form.Item>
          )}
          {createMode === 'batch' && (
            <Form.Item name="count" label="생성 개수" rules={[{ required: true, message: '개수를 입력하세요' }]}>
              <InputNumber min={1} max={1000} style={{ width: '100%' }} placeholder="예: 10" />
            </Form.Item>
          )}
          <Form.Item name="code_name" label="코드명" rules={[{ required: true, message: '코드명을 입력하세요' }]}>
            <Input placeholder="예: 이벤트 프로모션" />
          </Form.Item>
          <Form.Item name="voucher_type" label="voucher_type" rules={[{ required: true, message: '타입을 입력하세요' }]}>
            <Input placeholder="예: PROMOTION" />
          </Form.Item>
          <Form.Item name="use_count_limit" label="사용 한도 (1코드당 사용 횟수)" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_active_flag" label="활성" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="use_expired_flag" label="만료일 사용" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="start_at" label="시작일 (선택)">
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expired_at" label="종료일 (선택)">
            <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
          </Form.Item>
          <Title level={5}>보상 (1개 이상)</Title>
          <Space style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>아이템 타입 필터:</span>
            <Select
              placeholder="전체"
              allowClear
              style={{ width: 160 }}
              loading={voucherItemsLoading}
              onChange={(v) => fetchVoucherItems(v ?? undefined)}
            >
              <Option value="">전체</Option>
              {[...new Set(voucherItems.map((i) => i.item_type).filter(Boolean))].sort().map((t) => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
            <Button size="small" onClick={() => fetchVoucherItems()} loading={voucherItemsLoading}>목록 새로고침</Button>
          </Space>
          <Form.List name="rewards" initialValue={[{ item_id: undefined, item_cnt: 1, is_lifetime_membership: false }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={10}>
                      <Form.Item {...rest} name={[name, 'item_id']} rules={[{ required: true, message: '아이템 선택' }]}>
                        <Select
                          placeholder="아이템 선택"
                          showSearch
                          optionFilterProp="label"
                          loading={voucherItemsLoading}
                          options={voucherItems.map((it) => ({
                            value: it.item_id,
                            label: [it.item_id, it.item_type, it.label].filter(Boolean).join(' · ') || `item_id ${it.item_id}`,
                          }))}
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item {...rest} name={[name, 'item_cnt']}>
                        <InputNumber placeholder="수량" min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...rest}
                        name={[name, 'is_lifetime_membership']}
                        valuePropName="checked"
                        tooltip="평생 멤버십 (plan 보상 시 만료 없음)"
                      >
                        <Switch checkedChildren="평생" unCheckedChildren="-" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button type="text" danger onClick={() => remove(name)}>
                        삭제
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add({ item_id: undefined, item_cnt: 1, is_lifetime_membership: false })}
                    block
                  >
                    보상 항목 추가
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createLoading}>
                생성
              </Button>
              <Button onClick={() => setCreateModalOpen(false)}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default VoucherCodesManagement
