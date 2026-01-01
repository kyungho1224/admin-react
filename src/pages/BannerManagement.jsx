import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Typography, message, Tag, Modal, Form, Input, Select, Switch, DatePicker, Image, Row, Col } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, HolderOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getBanners, createBanner, updateBanner, activateBanner, deactivateBanner, changeBannerOrder } from '../services/api'
import { listS3Images } from '../services/s3Upload'
import './BannerManagement.css'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

// 앱 내부 라우터 목록 (팝업과 동일)
const IN_APP_ROUTES = [
  { value: 'HOME', label: '홈' },
  { value: 'MAIN', label: '메인' },
  { value: 'SELECT', label: '선택학습' },
  { value: 'STUDY', label: '학습' },
  { value: 'GAME', label: '게임' },
  { value: 'MARKET', label: '마켓' },
  { value: 'MARKET_MEMBERSHIP', label: '마켓-멤버십' },
  { value: 'MARKET_GOODS', label: '마켓-상품' },
  { value: 'MARKET_STUDY', label: '마켓-학습' },
  { value: 'GUILD', label: '길드' },
  { value: 'RANKING', label: '랭킹' },
  { value: 'MOCKTEST', label: '모의고사' },
  { value: 'MAILBOX', label: '우편함' },
  { value: 'QUEST', label: '퀘스트' },
  { value: 'CLOSET', label: '옷장' },
  { value: 'BAG', label: '가방' },
  { value: 'INVENTORY', label: '인벤토리' },
  { value: 'VOD', label: 'VOD' },
  { value: 'SETTING', label: '설정' },
  { value: 'SETTING_LANG', label: '설정-언어' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'TREASURE', label: '보물' },
]

// 드래그 가능한 행 컴포넌트
const SortableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  })

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999, opacity: 0.5 } : {}),
  }

  // 버튼 클릭 시 드래그 방지
  const handlePointerDown = (e) => {
    // 버튼이나 링크 클릭 시 드래그 방지
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.closest('button') !== null ||
      e.target.tagName === 'A' ||
      e.target.closest('a') !== null
    ) {
      return
    }
    // listeners의 onPointerDown 호출
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e)
    }
  }

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={handlePointerDown}
    >
      {children}
    </tr>
  )
}

function BannerManagement() {
  const [loading, setLoading] = useState(false)
  const [banners, setBanners] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [isImageSelectModalVisible, setIsImageSelectModalVisible] = useState(false)
  const [availableImages, setAvailableImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false)
  const [previewBanner, setPreviewBanner] = useState(null)
  const [isSelectingForEdit, setIsSelectingForEdit] = useState(false)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 배너 목록 조회
  const fetchBanners = async () => {
    setLoading(true)
    try {
      const data = await getBanners()
      // sort_order로 정렬 (낮은 순서가 먼저)
      const sortedBanners = (data || []).sort((a, b) => a.sort_order - b.sort_order)
      setBanners(sortedBanners)
    } catch (error) {
      console.error('배너 조회 실패:', error)
      message.error(error.message || '배너 목록을 불러오는데 실패했습니다.')
      setBanners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  // 이미지 목록 조회
  const fetchAvailableImages = async () => {
    setLoadingImages(true)
    try {
      const imageList = await listS3Images('events/banner')
      setAvailableImages(imageList)
    } catch (error) {
      console.error('이미지 목록 조회 실패:', error)
      message.error('이미지 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoadingImages(false)
    }
  }

  // 이미지 선택 모달 열기
  const openImageSelectModal = (forEdit = false) => {
    setIsSelectingForEdit(forEdit)
    setIsImageSelectModalVisible(true)
    fetchAvailableImages()
  }

  // 이미지 선택
  const handleImageSelect = (imageUrl) => {
    const targetForm = isSelectingForEdit ? editForm : form
    targetForm.setFieldValue('banner_image_url', imageUrl)
    setIsImageSelectModalVisible(false)
    setIsSelectingForEdit(false)
    message.success('이미지가 선택되었습니다.')
  }

  // 배너 생성
  const handleCreate = async (values) => {
    try {
      const bannerData = {
        title: values.title,
        banner_image_url: values.banner_image_url,
        link_type: values.link_type || null,
        link_target: values.link_target || null,
        sort_order: values.sort_order || 999,
        started_at: values.started_at ? values.started_at.toISOString() : null,
        finished_at: values.finished_at ? values.finished_at.toISOString() : null,
        is_active: values.is_active || false,
      }
      
      await createBanner(bannerData)
      message.success('배너가 등록되었습니다.')
      setIsModalVisible(false)
      form.resetFields()
      fetchBanners()
    } catch (error) {
      console.error('배너 등록 실패:', error)
      message.error(error.message || '배너 등록에 실패했습니다.')
    }
  }

  // 배너 수정 모달 열기
  const handleEdit = (record) => {
    setEditingBanner(record)
    
    editForm.setFieldsValue({
      title: record.title,
      banner_image_url: record.banner_image_url,
      link_type: record.link_type,
      link_target: record.link_target,
      sort_order: record.sort_order,
      started_at: record.started_at ? dayjs(record.started_at) : null,
      finished_at: record.finished_at ? dayjs(record.finished_at) : null,
      is_active: record.is_active,
    })
    
    setIsEditModalVisible(true)
  }

  // 배너 수정
  const handleUpdate = async (values) => {
    if (!editingBanner) return

    try {
      const updateData = {}
      
      if (values.title !== undefined) updateData.title = values.title
      if (values.banner_image_url !== undefined) updateData.banner_image_url = values.banner_image_url
      if (values.link_type !== undefined) updateData.link_type = values.link_type || null
      if (values.link_target !== undefined) updateData.link_target = values.link_target || null
      if (values.sort_order !== undefined) updateData.sort_order = values.sort_order
      if (values.started_at !== undefined) updateData.started_at = values.started_at ? values.started_at.toISOString() : null
      if (values.finished_at !== undefined) updateData.finished_at = values.finished_at ? values.finished_at.toISOString() : null
      if (values.is_active !== undefined) updateData.is_active = values.is_active
      
      await updateBanner(editingBanner.record_id, updateData)
      message.success('배너 정보가 수정되었습니다.')
      setIsEditModalVisible(false)
      setEditingBanner(null)
      editForm.resetFields()
      fetchBanners()
    } catch (error) {
      console.error('배너 수정 실패:', error)
      message.error(error.message || '배너 수정에 실패했습니다.')
    }
  }

  // 배너 활성화/비활성화
  const handleToggleActive = async (record) => {
    try {
      if (record.is_active) {
        await deactivateBanner(record.record_id)
        message.success('배너가 비활성화되었습니다.')
      } else {
        await activateBanner(record.record_id)
        message.success('배너가 활성화되었습니다.')
      }
      fetchBanners()
    } catch (error) {
      console.error('배너 상태 변경 실패:', error)
      message.error(error.message || '배너 상태 변경에 실패했습니다.')
    }
  }

  // 배너 순서 변경 (위로 이동)
  const handleMoveUp = async (record, index) => {
    if (index === 0) {
      message.warning('이미 맨 위에 있습니다.')
      return
    }

    try {
      const prevBanner = banners[index - 1]
      const newSortOrder = prevBanner.sort_order - 1
      await changeBannerOrder(record.record_id, newSortOrder)
      message.success('순서가 변경되었습니다.')
      fetchBanners()
    } catch (error) {
      console.error('순서 변경 실패:', error)
      message.error(error.message || '순서 변경에 실패했습니다.')
    }
  }

  // 배너 순서 변경 (아래로 이동)
  const handleMoveDown = async (record, index) => {
    if (index === banners.length - 1) {
      message.warning('이미 맨 아래에 있습니다.')
      return
    }

    try {
      const nextBanner = banners[index + 1]
      const newSortOrder = nextBanner.sort_order + 1
      await changeBannerOrder(record.record_id, newSortOrder)
      message.success('순서가 변경되었습니다.')
      fetchBanners()
    } catch (error) {
      console.error('순서 변경 실패:', error)
      message.error(error.message || '순서 변경에 실패했습니다.')
    }
  }

  // 드래그앤드롭 핸들러
  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = banners.findIndex((item) => item.record_id === active.id)
    const newIndex = banners.findIndex((item) => item.record_id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    try {
      const movedBanner = banners[oldIndex]
      
      // 새로운 순서 계산
      let newSortOrder
      if (newIndex < oldIndex) {
        // 위로 이동
        newSortOrder = newIndex === 0 ? 0 : banners[newIndex - 1].sort_order + 1
      } else {
        // 아래로 이동
        newSortOrder = banners[newIndex].sort_order + 1
      }

      await changeBannerOrder(movedBanner.record_id, newSortOrder)
      message.success('순서가 변경되었습니다.')
      fetchBanners()
    } catch (error) {
      console.error('순서 변경 실패:', error)
      message.error(error.message || '순서 변경에 실패했습니다.')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'record_id',
      key: 'record_id',
      width: 80,
    },
    {
      title: '썸네일',
      key: 'thumbnail',
      width: 120,
      render: (_, record) => (
        <Image
          src={record.banner_image_url}
          alt={record.title}
          width={100}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{
            mask: <EyeOutlined />,
          }}
        />
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '링크 타입',
      dataIndex: 'link_type',
      key: 'link_type',
      width: 120,
      render: (type) => (
        type ? (
          <Tag color={type === 'IN_APP' ? 'blue' : 'green'}>
            {type === 'IN_APP' ? '앱 내부' : '외부 링크'}
          </Tag>
        ) : '-'
      ),
    },
    {
      title: '링크 타겟',
      dataIndex: 'link_target',
      key: 'link_target',
      width: 150,
      ellipsis: true,
    },
    {
      title: '상태',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '순서',
      key: 'sort_order',
      width: 150,
      render: (_, record, index) => (
        <Space>
          <span
            style={{ 
              cursor: 'grab', 
              display: 'inline-flex', 
              alignItems: 'center',
              color: '#8c8c8c',
              marginRight: 8
            }}
            title="드래그하여 순서 변경"
          >
            <HolderOutlined />
          </span>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation()
              handleMoveUp(record, index)
            }}
            title="위로 이동"
          />
          <span style={{ minWidth: '40px', display: 'inline-block', textAlign: 'center' }}>
            {record.sort_order}
          </span>
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === banners.length - 1}
            onClick={(e) => {
              e.stopPropagation()
              handleMoveDown(record, index)
            }}
            title="아래로 이동"
          />
        </Space>
      ),
    },
    {
      title: '시작일',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 150,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '종료일',
      dataIndex: 'finished_at',
      key: 'finished_at',
      width: 150,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '작업',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setPreviewBanner(record)
              setIsPreviewModalVisible(true)
            }}
          >
            미리보기
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            수정
          </Button>
          <Button 
            type="link" 
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? '비활성화' : '활성화'}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="banner-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          배너 목록
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            배너 추가
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchBanners} loading={loading}>
            새로고침
          </Button>
        </Space>
      </div>

      <Card>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={banners.map((banner) => banner.record_id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              columns={columns}
              dataSource={banners}
              loading={loading}
              rowKey="record_id"
              scroll={{ x: 1500 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개`,
              }}
              components={{
                body: {
                  row: SortableRow,
                },
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      {/* 배너 등록 모달 */}
      <Modal
        title="배너 등록"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요' }]}
          >
            <Input placeholder="배너 관리용 제목" />
          </Form.Item>

          <Form.Item
            name="banner_image_url"
            label="배너 이미지 URL"
            rules={[{ required: true, message: '배너 이미지 URL을 입력해주세요' }]}
          >
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 100px)' }}
                placeholder="이미지 URL을 입력하거나 선택하세요"
                value={form.getFieldValue('banner_image_url')}
                onChange={(e) => form.setFieldValue('banner_image_url', e.target.value)}
              />
              <Button onClick={() => openImageSelectModal(false)}>
                이미지 선택
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="link_type"
            label="링크 타입"
          >
            <Select placeholder="링크 타입 선택">
              <Option value="IN_APP">앱 내부</Option>
              <Option value="EXTERNAL">외부 링크</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.link_type !== currentValues.link_type
            }
          >
            {({ getFieldValue }) => {
              const linkType = getFieldValue('link_type')
              return (
                <Form.Item
                  name="link_target"
                  label="링크 타겟"
                  rules={[
                    {
                      required: linkType === 'IN_APP' || linkType === 'EXTERNAL',
                      message: '링크 타겟을 입력해주세요',
                    },
                  ]}
                >
                  {linkType === 'IN_APP' ? (
                    <Select placeholder="앱 내부 라우트 선택">
                      {IN_APP_ROUTES.map(route => (
                        <Option key={route.value} value={route.value}>
                          {route.label}
                        </Option>
                      ))}
                    </Select>
                  ) : linkType === 'EXTERNAL' ? (
                    <Input placeholder="외부 링크 URL을 입력하세요" />
                  ) : (
                    <Input disabled placeholder="링크 타입을 먼저 선택하세요" />
                  )}
                </Form.Item>
              )
            }}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="started_at"
                label="시작일"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="시작일 선택"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="finished_at"
                label="종료일"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="종료일 선택"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="순서"
                initialValue={999}
              >
                <Input type="number" placeholder="순서 (낮을수록 먼저 표시)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="활성화"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                등록
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false)
                form.resetFields()
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 배너 수정 모달 */}
      <Modal
        title="배너 수정"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          setEditingBanner(null)
          editForm.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요' }]}
          >
            <Input placeholder="배너 관리용 제목" />
          </Form.Item>

          <Form.Item
            name="banner_image_url"
            label="배너 이미지 URL"
            rules={[{ required: true, message: '배너 이미지 URL을 입력해주세요' }]}
          >
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 100px)' }}
                placeholder="이미지 URL을 입력하거나 선택하세요"
                value={editForm.getFieldValue('banner_image_url')}
                onChange={(e) => editForm.setFieldValue('banner_image_url', e.target.value)}
              />
              <Button onClick={() => openImageSelectModal(true)}>
                이미지 선택
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item
            name="link_type"
            label="링크 타입"
          >
            <Select placeholder="링크 타입 선택">
              <Option value="IN_APP">앱 내부</Option>
              <Option value="EXTERNAL">외부 링크</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.link_type !== currentValues.link_type
            }
          >
            {({ getFieldValue }) => {
              const linkType = getFieldValue('link_type')
              return (
                <Form.Item
                  name="link_target"
                  label="링크 타겟"
                >
                  {linkType === 'IN_APP' ? (
                    <Select placeholder="앱 내부 라우트 선택">
                      {IN_APP_ROUTES.map(route => (
                        <Option key={route.value} value={route.value}>
                          {route.label}
                        </Option>
                      ))}
                    </Select>
                  ) : linkType === 'EXTERNAL' ? (
                    <Input placeholder="외부 링크 URL을 입력하세요" />
                  ) : (
                    <Input disabled placeholder="링크 타입을 먼저 선택하세요" />
                  )}
                </Form.Item>
              )
            }}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="started_at"
                label="시작일"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="시작일 선택"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="finished_at"
                label="종료일"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="종료일 선택"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label="순서"
              >
                <Input type="number" placeholder="순서 (낮을수록 먼저 표시)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="활성화"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                수정
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false)
                setEditingBanner(null)
                editForm.resetFields()
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 이미지 선택 모달 */}
      <Modal
        title="배너 이미지 선택"
        open={isImageSelectModalVisible}
        onCancel={() => {
          setIsImageSelectModalVisible(false)
          setIsSelectingForEdit(false)
        }}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {loadingImages ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              이미지를 불러오는 중...
            </div>
          ) : availableImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
              업로드된 이미지가 없습니다.
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {availableImages.map((image) => (
                <Col xs={12} sm={8} md={6} key={image.key}>
                  <Card
                    hoverable
                    cover={
                      <Image
                        src={image.url}
                        alt={image.fileName}
                        style={{ height: 120, objectFit: 'cover' }}
                        preview={false}
                      />
                    }
                    onClick={() => handleImageSelect(image.url)}
                  >
                    <Card.Meta
                      title={
                        <Typography.Text ellipsis style={{ fontSize: '12px' }}>
                          {image.fileName}
                        </Typography.Text>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Modal>

      {/* 배너 미리보기 모달 */}
      <Modal
        title="배너 미리보기"
        open={isPreviewModalVisible}
        onCancel={() => {
          setIsPreviewModalVisible(false)
          setPreviewBanner(null)
        }}
        footer={null}
        width={800}
        centered
      >
        {previewBanner && (
          <div>
            <Image
              src={previewBanner.banner_image_url}
              alt={previewBanner.title}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 16 }}>
              <Typography.Text strong>제목: </Typography.Text>
              <Typography.Text>{previewBanner.title}</Typography.Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Typography.Text strong>링크 타입: </Typography.Text>
              <Typography.Text>
                {previewBanner.link_type === 'IN_APP' ? '앱 내부' : previewBanner.link_type === 'EXTERNAL' ? '외부 링크' : '-'}
              </Typography.Text>
            </div>
            {previewBanner.link_target && (
              <div style={{ marginTop: 8 }}>
                <Typography.Text strong>링크 타겟: </Typography.Text>
                <Typography.Text copyable={{ text: previewBanner.link_target }} ellipsis>
                  {previewBanner.link_target}
                </Typography.Text>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Typography.Text strong>상태: </Typography.Text>
              <Tag color={previewBanner.is_active ? 'success' : 'default'}>
                {previewBanner.is_active ? '활성' : '비활성'}
              </Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BannerManagement
