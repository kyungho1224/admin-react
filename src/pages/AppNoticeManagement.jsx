import { useEffect, useState } from 'react'
import { Card, Typography, Table, Button, Space, Tag, message, Image, Modal, Descriptions, Form, Input, InputNumber, Switch, Row, Col, Popconfirm, Select } from 'antd'
import { ReloadOutlined, EyeOutlined, PlusOutlined, HolderOutlined, EditOutlined } from '@ant-design/icons'
import {
  getAdminNotices,
  getAdminNoticeDetail,
  createAdminNotice,
  updateAdminNotice,
  createAdminNoticeItem,
  updateAdminNoticeItem,
  deleteAdminNoticeItem,
} from '../services/api'
import { listS3Images } from '../services/s3Upload'
import { APP_LANGUAGES } from '../constants/languages'
import { IN_APP_ROUTES } from '../constants/inAppRoutes'

const { Title, Text } = Typography

function AppNoticeManagement() {
  const [loading, setLoading] = useState(false)
  const [notices, setNotices] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [createForm] = Form.useForm()
  const [editNoticeForm] = Form.useForm()
  const [draggingNoticeId, setDraggingNoticeId] = useState(null)
  const [originalOrderIds, setOriginalOrderIds] = useState([])
  const [itemImageOptions, setItemImageOptions] = useState([])
  const [actionUrlOptions, setActionUrlOptions] = useState([])
  const [loadingPickerOptions, setLoadingPickerOptions] = useState(false)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [updatingNotice, setUpdatingNotice] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [updatingItem, setUpdatingItem] = useState(false)
  const [editItemForm] = Form.useForm()
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [addItemForm] = Form.useForm()
  const [draggingItemId, setDraggingItemId] = useState(null)
  const [savingItemOrder, setSavingItemOrder] = useState(false)
  const [previewItemI18n, setPreviewItemI18n] = useState(null)
  const routeLabelMap = IN_APP_ROUTES.reduce((acc, route) => {
    acc[route.value] = route.label
    return acc
  }, {})

  const LANG_KEY_ALIASES = {
    'zh-Hant': ['zh-Hant', 'zh_hant', 'zhHant', 'zh_tw', 'zh-tw', 'zh-TW', 'zhTW'],
    'zh-Hans': ['zh-Hans', 'zh_hans', 'zhHans', 'zh_cn', 'zh-cn', 'zh-CN', 'zhCN'],
    uz: ['uz', 'uz-UZ', 'uz_UZ', 'uzb'],
    kk: ['kk', 'kk-KZ', 'kk_KZ', 'kaz'],
  }

  const normalizeLangMap = (obj = {}) => {
    const source = obj || {}
    const normalized = { ...source }
    Object.entries(LANG_KEY_ALIASES).forEach(([targetKey, aliases]) => {
      if (normalized[targetKey] !== undefined && normalized[targetKey] !== null && String(normalized[targetKey]).trim() !== '') return
      for (const alias of aliases) {
        const value = source[alias]
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          normalized[targetKey] = value
          break
        }
      }
    })
    return normalized
  }

  const toLangJson = (obj = {}) => {
    const next = {}
    APP_LANGUAGES.forEach(({ key }) => {
      const value = obj?.[key]
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        next[key] = String(value).trim()
      }
    })
    return next
  }

  const reorderByIds = (list, dragId, dropId, keyName) => {
    const fromIndex = list.findIndex((item) => item[keyName] === dragId)
    const toIndex = list.findIndex((item) => item[keyName] === dropId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list
    const next = [...list]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    return next
  }

  const renderReadonlyField = (label, value) => (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <Input value={value || '-'} readOnly size="small" />
    </Space>
  )

  const renderMultiLangReadonly = (value, multiline = false) => {
    if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return renderReadonlyField('언어', '-')
    return (
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        {Object.entries(value).map(([lang, text]) => (
          <Space key={lang} direction="vertical" size={2} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{lang}</Text>
            {multiline ? (
              <Input.TextArea value={String(text ?? '')} readOnly autoSize={{ minRows: 2, maxRows: 8 }} />
            ) : (
              <Input value={String(text ?? '')} readOnly size="small" />
            )}
          </Space>
        ))}
      </Space>
    )
  }

  const renderLanguageInputs = (namePath, labelPrefix = '텍스트', multiline = false) => (
    <Row gutter={[12, 0]}>
      {APP_LANGUAGES.map((lang) => (
        <Col xs={24} sm={12} key={`${labelPrefix}-${lang.key}`}>
          <Form.Item name={[...namePath, lang.key]} label={`${labelPrefix} - ${lang.label}`}>
            {multiline ? (
              <Input.TextArea placeholder={`${lang.label} 입력`} rows={4} autoSize={{ minRows: 3, maxRows: 8 }} />
            ) : (
              <Input placeholder={`${lang.label} 입력`} />
            )}
          </Form.Item>
        </Col>
      ))}
    </Row>
  )

  const getLangValue = (obj, langKey = 'ko') => {
    if (!obj || typeof obj !== 'object') return '-'
    return obj[langKey] || '-'
  }

  const renderRouteWithLabel = (routeValue) => {
    if (!routeValue) return '-'
    const label = routeLabelMap[routeValue]
    return label ? `${label} (${routeValue})` : routeValue
  }

  const normalizeSingleValue = (value) => {
    if (Array.isArray(value)) {
      const first = value.find((v) => v !== undefined && v !== null && String(v).trim() !== '')
      return first ? String(first).trim() : null
    }
    if (value === undefined || value === null) return null
    const text = String(value).trim()
    return text === '' ? null : text
  }

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const data = await getAdminNotices(true)
      const rows = data || []
      setNotices(rows)
      setOriginalOrderIds(rows.map((row) => row.notice_id))
    } catch (error) {
      message.error(error.message || '앱내 공지사항 목록 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchCreateOptions = async () => {
    setLoadingPickerOptions(true)
    try {
      const [images, noticesData] = await Promise.all([
        listS3Images('notices'),
        getAdminNotices(true),
      ])
      setItemImageOptions((images || []).map((img) => img.url))
      const actionUrls = new Set()
      ;(noticesData || []).forEach((notice) => {
        ;(notice.items || []).forEach((item) => {
          if (item.action_url) actionUrls.add(item.action_url)
        })
      })
      setActionUrlOptions(Array.from(actionUrls))
    } finally {
      setLoadingPickerOptions(false)
    }
  }

  const openDetail = async (noticeId) => {
    setDetailLoading(true)
    setIsDetailOpen(true)
    setIsEditMode(false)
    try {
      const detail = await getAdminNoticeDetail(noticeId)
      setSelectedNotice(detail)
      editNoticeForm.setFieldsValue({
        titles: normalizeLangMap(detail.titles || {}),
        is_active: Boolean(detail.is_active),
      })
    } catch (error) {
      message.error(error.message || '공지사항 상세 조회에 실패했습니다.')
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const openImagePicker = async (target) => {
    if (itemImageOptions.length === 0) await fetchCreateOptions()
    setPickerTarget(target)
    setIsImagePickerOpen(true)
  }

  const handleSelectImage = (url) => {
    if (!pickerTarget) return
    if (pickerTarget.type === 'create-item-image') {
      if (pickerTarget.index === null || pickerTarget.index === undefined) {
        addItemForm.setFieldValue('img_url', url)
      } else {
        createForm.setFieldValue(['items', pickerTarget.index, 'img_url'], url)
      }
    } else if (pickerTarget.type === 'edit-item-image') {
      editItemForm.setFieldValue('img_url', url)
    }
    setIsImagePickerOpen(false)
    setPickerTarget(null)
  }

  const handleCreate = async (values) => {
    setCreating(true)
    try {
      const noticePayload = {
        display_order: values.display_order ?? 10,
        titles: toLangJson(values.titles),
        is_active: values.is_active ?? true,
      }
      const noticeResult = await createAdminNotice(noticePayload)
      const noticeId = noticeResult?.notice_id
      const items = values.items || []
      for (const item of items) {
        if (!item.in_app_route && !item.action_url) {
          throw new Error('공지사항 아이템에는 앱 라우트 또는 액션 URL 중 하나가 필요합니다.')
        }
        const itemPayload = {
          display_order: item.display_order ?? 0,
          titles: toLangJson(item.titles),
          descriptions: toLangJson(item.descriptions),
          img_url: item.img_url || null,
          in_app_route: item.in_app_route || null,
          action_url: normalizeSingleValue(item.action_url),
          is_active: item.is_active ?? true,
        }
        await createAdminNoticeItem(noticeId, itemPayload)
      }
      message.success('공지사항이 생성되었습니다.')
      setIsCreateOpen(false)
      createForm.resetFields()
      await fetchNotices()
    } catch (error) {
      message.error(error.message || '공지사항 생성에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      for (let i = 0; i < notices.length; i += 1) {
        const notice = notices[i]
        await updateAdminNotice(notice.notice_id, { display_order: i })
      }
      message.success('공지사항 순서가 저장되었습니다.')
      await fetchNotices()
    } catch (error) {
      message.error(error.message || '순서 저장에 실패했습니다.')
    } finally {
      setSavingOrder(false)
    }
  }

  const handleUpdateNoticeInfo = async (values) => {
    if (!selectedNotice?.notice_id) return
    setUpdatingNotice(true)
    try {
      const payload = {
        titles: toLangJson(values.titles),
        is_active: values.is_active ?? true,
      }
      await updateAdminNotice(selectedNotice.notice_id, payload)
      message.success('공지사항 정보가 수정되었습니다.')
      const refreshed = await getAdminNoticeDetail(selectedNotice.notice_id)
      setSelectedNotice(refreshed)
      setIsEditMode(false)
      await fetchNotices()
    } catch (error) {
      message.error(error.message || '공지사항 수정에 실패했습니다.')
    } finally {
      setUpdatingNotice(false)
    }
  }

  const openEditItem = (item) => {
    setEditingItem(item)
    setIsEditItemOpen(true)
    editItemForm.setFieldsValue({
      display_order: item.display_order ?? 0,
      titles: normalizeLangMap(item.titles || {}),
      descriptions: normalizeLangMap(item.descriptions || {}),
      img_url: item.img_url || undefined,
      in_app_route: item.in_app_route || undefined,
      action_url: item.action_url || undefined,
      is_active: Boolean(item.is_active),
    })
  }

  const handleUpdateItem = async (values) => {
    if (!selectedNotice?.notice_id || !editingItem?.item_id) return
    setUpdatingItem(true)
    try {
      if (!values.in_app_route && !values.action_url) {
        throw new Error('아이템에는 앱 라우트 또는 액션 URL 중 하나가 필요합니다.')
      }
      const payload = {
        display_order: values.display_order ?? 0,
        titles: toLangJson(values.titles),
        descriptions: toLangJson(values.descriptions),
        img_url: values.img_url || null,
        in_app_route: values.in_app_route || null,
        action_url: normalizeSingleValue(values.action_url),
        is_active: values.is_active ?? true,
      }
      await updateAdminNoticeItem(selectedNotice.notice_id, editingItem.item_id, payload)
      message.success('아이템이 수정되었습니다.')
      const refreshed = await getAdminNoticeDetail(selectedNotice.notice_id)
      setSelectedNotice(refreshed)
      setIsEditItemOpen(false)
      setEditingItem(null)
      editItemForm.resetFields()
    } catch (error) {
      message.error(error.message || '아이템 수정에 실패했습니다.')
    } finally {
      setUpdatingItem(false)
    }
  }

  const openAddItem = () => {
    setIsAddItemOpen(true)
    addItemForm.setFieldsValue({
      display_order: 0,
      titles: {},
      descriptions: {},
      in_app_route: undefined,
      action_url: undefined,
      is_active: true,
    })
  }

  const handleAddItem = async (values) => {
    if (!selectedNotice?.notice_id) return
    setAddingItem(true)
    try {
      if (!values.in_app_route && !values.action_url) {
        throw new Error('아이템에는 앱 라우트 또는 액션 URL 중 하나가 필요합니다.')
      }
      const payload = {
        display_order: values.display_order ?? 0,
        titles: toLangJson(values.titles),
        descriptions: toLangJson(values.descriptions),
        img_url: values.img_url || null,
        in_app_route: values.in_app_route || null,
        action_url: normalizeSingleValue(values.action_url),
        is_active: values.is_active ?? true,
      }
      await createAdminNoticeItem(selectedNotice.notice_id, payload)
      message.success('아이템이 추가되었습니다.')
      const refreshed = await getAdminNoticeDetail(selectedNotice.notice_id)
      setSelectedNotice(refreshed)
      setIsAddItemOpen(false)
      addItemForm.resetFields()
    } catch (error) {
      message.error(error.message || '아이템 추가에 실패했습니다.')
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!selectedNotice?.notice_id) return
    try {
      await deleteAdminNoticeItem(selectedNotice.notice_id, itemId)
      message.success('아이템이 삭제되었습니다.')
      const refreshed = await getAdminNoticeDetail(selectedNotice.notice_id)
      setSelectedNotice(refreshed)
    } catch (error) {
      message.error(error.message || '아이템 삭제에 실패했습니다.')
    }
  }

  const handleSaveItemOrder = async () => {
    if (!selectedNotice?.notice_id || !selectedNotice?.items) return
    setSavingItemOrder(true)
    try {
      for (let i = 0; i < selectedNotice.items.length; i += 1) {
        const item = selectedNotice.items[i]
        await updateAdminNoticeItem(selectedNotice.notice_id, item.item_id, {
          display_order: (i + 1) * 10,
        })
      }
      message.success('아이템 순서가 저장되었습니다.')
      const refreshed = await getAdminNoticeDetail(selectedNotice.notice_id)
      setSelectedNotice(refreshed)
    } catch (error) {
      message.error(error.message || '아이템 순서 저장에 실패했습니다.')
    } finally {
      setSavingItemOrder(false)
    }
  }

  const isOrderChanged = notices.map((row) => row.notice_id).join(',') !== originalOrderIds.join(',')

  const columns = [
    { title: 'ID', dataIndex: 'notice_id', key: 'notice_id', width: 80 },
    { title: '순서', dataIndex: 'display_order', key: 'display_order', width: 80 },
    {
      title: '정렬',
      key: 'drag_handle',
      width: 70,
      render: (_, row) => (
        <span
          draggable
          onDragStart={(e) => {
            e.stopPropagation()
            setDraggingNoticeId(row.notice_id)
          }}
          style={{ cursor: 'grab', display: 'inline-flex', color: '#8c8c8c' }}
          title="아이콘을 드래그해서 순서 변경"
        >
          <HolderOutlined />
        </span>
      ),
    },
    {
      title: '제목(ko)',
      key: 'title_ko',
      width: 220,
      render: (_, row) => renderReadonlyField('ko', row.titles?.ko || '-'),
    },
    {
      title: '상태',
      key: 'is_active',
      width: 100,
      render: (_, row) => (
        <Tag color={row.is_active ? 'success' : 'default'}>
          {row.is_active ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '상세',
      key: 'detail',
      width: 100,
      render: (_, row) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(row.notice_id)}>
          보기
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>앱내 공지사항 관리</Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchNotices} loading={loading}>
                새로고침
              </Button>
              <Button onClick={handleSaveOrder} loading={savingOrder} disabled={!isOrderChanged}>
                순서 저장
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                공지사항 등록
              </Button>
            </Space>
          </div>
          <Table
            rowKey="notice_id"
            columns={columns}
            dataSource={notices}
            loading={loading}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            onRow={(record) => ({
              onDragOver: (e) => e.preventDefault(),
              onDrop: () => {
                if (!draggingNoticeId || draggingNoticeId === record.notice_id) return
                setNotices((prev) => reorderByIds(prev, draggingNoticeId, record.notice_id, 'notice_id'))
                setDraggingNoticeId(null)
              },
            })}
          />
        </Space>
      </Card>

      <Modal
        title="공지사항 상세"
        open={isDetailOpen}
        onCancel={() => {
          setIsDetailOpen(false)
          setSelectedNotice(null)
        }}
        footer={null}
        width={900}
      >
        {selectedNotice && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>공지사항 정보</Title>
              {!isEditMode ? (
                <Button icon={<EditOutlined />} onClick={() => setIsEditMode(true)}>
                  수정
                </Button>
              ) : (
                <Space>
                  <Button onClick={() => setIsEditMode(false)}>취소</Button>
                  <Button type="primary" loading={updatingNotice} onClick={() => editNoticeForm.submit()}>
                    저장
                  </Button>
                </Space>
              )}
            </div>
            {!isEditMode ? (
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="ID">{selectedNotice.notice_id}</Descriptions.Item>
                <Descriptions.Item label="제목(전체 언어)">
                  {renderMultiLangReadonly(selectedNotice.titles)}
                </Descriptions.Item>
                <Descriptions.Item label="상태">
                  <Tag color={selectedNotice.is_active ? 'success' : 'default'}>
                    {selectedNotice.is_active ? '활성' : '비활성'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="아이템 수">{selectedNotice.items?.length || 0}</Descriptions.Item>
              </Descriptions>
            ) : (
              <Form form={editNoticeForm} layout="vertical" onFinish={handleUpdateNoticeInfo}>
                {renderLanguageInputs(['titles'], '타이틀')}
                <Form.Item name="is_active" label="활성화" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Form>
            )}

            <Table
              rowKey="item_id"
              loading={detailLoading}
              dataSource={selectedNotice.items || []}
              title={() => (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>공지사항 아이템</span>
                  <Space>
                    <Button onClick={handleSaveItemOrder} loading={savingItemOrder} size="small">
                      순서 저장
                    </Button>
                    <Button type="primary" size="small" onClick={openAddItem}>
                      아이템 추가
                    </Button>
                  </Space>
                </div>
              )}
              pagination={false}
              onRow={(record) => ({
                onDragOver: (e) => e.preventDefault(),
                onDrop: () => {
                  if (!draggingItemId || draggingItemId === record.item_id) return
                  setSelectedNotice((prev) => {
                    if (!prev?.items) return prev
                    return { ...prev, items: reorderByIds(prev.items, draggingItemId, record.item_id, 'item_id') }
                  })
                  setDraggingItemId(null)
                },
              })}
              columns={[
                { title: '아이템 ID', dataIndex: 'item_id', key: 'item_id', width: 90 },
                { title: '순서', dataIndex: 'display_order', key: 'display_order', width: 80 },
                {
                  title: '정렬',
                  key: 'drag_handle',
                  width: 70,
                  render: (_, item) => (
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation()
                        setDraggingItemId(item.item_id)
                      }}
                      style={{ cursor: 'grab', display: 'inline-flex', color: '#8c8c8c' }}
                      title="아이콘을 드래그해서 순서 변경"
                    >
                      <HolderOutlined />
                    </span>
                  ),
                },
                {
                  title: '제목(ko)',
                  key: 'title_ko',
                  width: 220,
                  render: (_, item) => <Input value={getLangValue(item.titles, 'ko')} readOnly size="small" />,
                },
                {
                  title: '설명(ko)',
                  key: 'description_ko',
                  width: 320,
                  render: (_, item) => (
                    <Input.TextArea value={getLangValue(item.descriptions, 'ko')} readOnly autoSize={{ minRows: 2, maxRows: 4 }} />
                  ),
                },
                {
                  title: '다국어',
                  key: 'i18n_preview',
                  width: 100,
                  render: (_, item) => (
                    <Button type="link" size="small" onClick={() => setPreviewItemI18n(item)}>
                      보기
                    </Button>
                  ),
                },
                {
                  title: '이미지',
                  key: 'img_url',
                  width: 120,
                  render: (_, item) => (
                    item.img_url ? <Image src={item.img_url} width={80} height={80} style={{ objectFit: 'cover' }} /> : '-'
                  ),
                },
                {
                  title: '앱 라우트',
                  key: 'in_app_route',
                  width: 220,
                  render: (_, item) => renderReadonlyField('in_app_route', renderRouteWithLabel(item.in_app_route)),
                },
                {
                  title: '액션 URL',
                  key: 'action_url',
                  width: 260,
                  render: (_, item) => renderReadonlyField('action_url', item.action_url || '-'),
                },
                {
                  title: '상태',
                  key: 'is_active',
                  width: 90,
                  render: (_, item) => (
                    <Tag color={item.is_active ? 'success' : 'default'}>
                      {item.is_active ? '활성' : '비활성'}
                    </Tag>
                  ),
                },
                {
                  title: '작업',
                  key: 'action',
                  width: 150,
                  render: (_, item) => (
                    <Space size="small">
                      <Button type="link" size="small" onClick={() => openEditItem(item)}>
                        수정
                      </Button>
                      <Popconfirm
                        title="아이템을 삭제하시겠습니까?"
                        onConfirm={() => handleDeleteItem(item.item_id)}
                        okText="삭제"
                        cancelText="취소"
                      >
                        <Button type="link" size="small" danger>
                          삭제
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Modal>

      <Modal
        title="공지사항 등록"
        open={isCreateOpen}
        onCancel={() => {
          setIsCreateOpen(false)
          createForm.resetFields()
        }}
        afterOpenChange={(open) => {
          if (open) fetchCreateOptions()
        }}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        width={1000}
        okText="등록"
        cancelText="취소"
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ display_order: 10, is_active: true, items: [{ display_order: 0, is_active: true }] }}
        >
          <Form.Item name="display_order" label="공지사항 노출 순서">
            <InputNumber min={10} style={{ width: '100%' }} disabled />
          </Form.Item>
          {renderLanguageInputs(['titles'], '타이틀')}
          <Form.Item name="is_active" label="활성화" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Title level={5} style={{ margin: 0 }}>공지사항 아이템</Title>
                {fields.map((field, idx) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`아이템 ${idx + 1}`}
                    extra={fields.length > 1 ? <Button type="link" danger onClick={() => remove(field.name)}>삭제</Button> : null}
                  >
                    <Form.Item {...field} name={[field.name, 'display_order']} label="아이템 순서">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    {renderLanguageInputs([field.name, 'titles'], '아이템 타이틀')}
                    {renderLanguageInputs([field.name, 'descriptions'], '아이템 설명', true)}
                    <Form.Item {...field} name={[field.name, 'in_app_route']} label="아이템 앱 라우트">
                      <Select
                        allowClear
                        showSearch
                        options={IN_APP_ROUTES.map((route) => ({
                          value: route.value,
                          label: `${route.label} (${route.value})`,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'action_url']} label="아이템 액션 URL">
                      <Select
                        allowClear
                        showSearch
                        mode="tags"
                        tokenSeparators={[',']}
                        maxCount={1}
                        placeholder="등록된 URL에서 선택 또는 직접 입력"
                        options={actionUrlOptions.map((url) => ({ value: url, label: url }))}
                      />
                    </Form.Item>
                    <Form.Item {...field} label="아이템 이미지 URL">
                      <Space.Compact style={{ width: '100%' }}>
                        <Form.Item {...field} name={[field.name, 'img_url']} noStyle>
                          <Input style={{ width: 'calc(100% - 100px)' }} readOnly />
                        </Form.Item>
                        <Button onClick={() => openImagePicker({ type: 'create-item-image', index: field.name })}>
                          이미지 선택
                        </Button>
                      </Space.Compact>
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add({ display_order: 0, is_active: true })} block>
                  아이템 추가
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="이미지 선택"
        open={isImagePickerOpen}
        onCancel={() => {
          setIsImagePickerOpen(false)
          setPickerTarget(null)
        }}
        footer={null}
        width={900}
        zIndex={2100}
      >
        <Row gutter={[16, 16]} style={{ maxHeight: 500, overflowY: 'auto' }}>
          {loadingPickerOptions ? (
            <Col span={24} style={{ textAlign: 'center', padding: '24px 0' }}>
              이미지 목록을 불러오는 중...
            </Col>
          ) : itemImageOptions.map((url) => {
            const fileName = url.split('/').pop() || url
            return (
              <Col xs={12} sm={8} md={6} key={url}>
                <Card
                  hoverable
                  cover={<Image src={url} alt={fileName} style={{ height: 140, objectFit: 'cover' }} preview={false} />}
                  onClick={() => handleSelectImage(url)}
                >
                  <Typography.Text ellipsis style={{ display: 'block', fontSize: 12 }}>
                    {fileName}
                  </Typography.Text>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Modal>

      <Modal
        title="아이템 수정"
        open={isEditItemOpen}
        onCancel={() => {
          setIsEditItemOpen(false)
          setEditingItem(null)
          editItemForm.resetFields()
        }}
        onOk={() => editItemForm.submit()}
        confirmLoading={updatingItem}
        okText="저장"
        cancelText="취소"
        zIndex={1700}
      >
        <Form form={editItemForm} layout="vertical" onFinish={handleUpdateItem} initialValues={{ is_active: true }}>
          <Form.Item name="display_order" label="아이템 순서">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {renderLanguageInputs(['titles'], '아이템 타이틀')}
          {renderLanguageInputs(['descriptions'], '아이템 설명', true)}
          <Form.Item name="in_app_route" label="아이템 앱 라우트">
            <Select
              allowClear
              showSearch
              options={IN_APP_ROUTES.map((route) => ({
                value: route.value,
                label: `${route.label} (${route.value})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="action_url" label="아이템 액션 URL">
            <Select
              allowClear
              showSearch
              mode="tags"
              tokenSeparators={[',']}
              maxCount={1}
              placeholder="등록된 URL에서 선택 또는 직접 입력"
              options={actionUrlOptions.map((url) => ({ value: url, label: url }))}
            />
          </Form.Item>
          <Form.Item name="img_url" label="아이템 이미지 URL">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="img_url" noStyle>
                <Input style={{ width: 'calc(100% - 100px)' }} readOnly />
              </Form.Item>
              <Button onClick={() => openImagePicker({ type: 'edit-item-image' })}>
                이미지 선택
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="is_active" label="활성화" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="아이템 추가"
        open={isAddItemOpen}
        onCancel={() => {
          setIsAddItemOpen(false)
          addItemForm.resetFields()
        }}
        onOk={() => addItemForm.submit()}
        confirmLoading={addingItem}
        okText="추가"
        cancelText="취소"
        zIndex={1700}
      >
        <Form
          form={addItemForm}
          layout="vertical"
          onFinish={handleAddItem}
          initialValues={{ display_order: 0, titles: {}, descriptions: {}, in_app_route: undefined, action_url: undefined, is_active: true }}
        >
          <Form.Item name="display_order" label="아이템 순서">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {renderLanguageInputs(['titles'], '아이템 타이틀')}
          {renderLanguageInputs(['descriptions'], '아이템 설명', true)}
          <Form.Item name="in_app_route" label="아이템 앱 라우트">
            <Select
              allowClear
              showSearch
              options={IN_APP_ROUTES.map((route) => ({
                value: route.value,
                label: `${route.label} (${route.value})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="action_url" label="아이템 액션 URL">
            <Select
              allowClear
              showSearch
              mode="tags"
              tokenSeparators={[',']}
              maxCount={1}
              placeholder="등록된 URL에서 선택 또는 직접 입력"
              options={actionUrlOptions.map((url) => ({ value: url, label: url }))}
            />
          </Form.Item>
          <Form.Item name="img_url" label="아이템 이미지 URL">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="img_url" noStyle>
                <Input style={{ width: 'calc(100% - 100px)' }} readOnly />
              </Form.Item>
              <Button onClick={() => openImagePicker({ type: 'create-item-image', index: null })}>
                이미지 선택
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="is_active" label="활성화" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="아이템 다국어 상세"
        open={!!previewItemI18n}
        onCancel={() => setPreviewItemI18n(null)}
        footer={null}
        width={900}
      >
        {previewItemI18n && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="아이템 ID">{previewItemI18n.item_id}</Descriptions.Item>
              <Descriptions.Item label="순서">{previewItemI18n.display_order}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="제목(전체 언어)">
              {renderMultiLangReadonly(previewItemI18n.titles)}
            </Card>
            <Card size="small" title="설명(전체 언어)">
              {renderMultiLangReadonly(previewItemI18n.descriptions, true)}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default AppNoticeManagement
