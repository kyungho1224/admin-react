import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  Table,
  Tag,
  Modal,
  TimePicker,
  InputNumber,
  Switch,
  Popconfirm,
  Image,
  Drawer,
  Row,
  Col,
  DatePicker,
} from 'antd'

const { Meta: CardMeta } = Card
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CalendarOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  createClass,
  updateClass,
  getClasses,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getClassSchedules,
} from '../services/api'
import { listS3Images } from '../services/s3Upload'
import './ClassReservation.css'

const { Title, Text } = Typography
const { TextArea } = Input

function ClassManagement() {
  const [classForm] = Form.useForm()
  const [scheduleForm] = Form.useForm()

  // 상태 관리
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  
  // 모달 상태
  const [isClassModalVisible, setIsClassModalVisible] = useState(false)
  const [isScheduleDrawerVisible, setIsScheduleDrawerVisible] = useState(false)
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [selectedClassForSchedule, setSelectedClassForSchedule] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [scheduleDateFilter, setScheduleDateFilter] = useState(null)
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)
  const [imageModalType, setImageModalType] = useState('thumbnail')
  const [thumbnailImages, setThumbnailImages] = useState([])
  const [detailImages, setDetailImages] = useState([])

  // 클래스 목록 조회
  const fetchClasses = async () => {
    setLoading(true)
    try {
      const data = await getClasses(100, 0)
      setClasses(data?.items || data || [])
    } catch (error) {
      console.error('클래스 목록 조회 실패:', error)
      message.error(error.message || '클래스 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  // 이미지 목록 조회
  const fetchImages = async (type) => {
    try {
      const folder = `class-reservation/${type}`
      const imageList = await listS3Images(folder)
      if (type === 'thumbnail') {
        setThumbnailImages(imageList)
      } else {
        setDetailImages(imageList)
      }
    } catch (error) {
      console.error('이미지 목록 조회 실패:', error)
    }
  }

  // 이미지 선택 모달 열기
  const openImageModal = (type) => {
    setImageModalType(type)
    setIsImageModalVisible(true)
    fetchImages(type)
  }

  // 이미지 선택
  const handleImageSelect = (imageUrl) => {
    if (imageModalType === 'thumbnail') {
      classForm.setFieldValue('thumbnail_url', imageUrl)
    } else {
      classForm.setFieldValue('detail_page_url', imageUrl)
    }
    setIsImageModalVisible(false)
    classForm.validateFields(['thumbnail_url', 'detail_page_url'])
  }

  // 클래스 생성/수정
  const handleClassSubmit = async (values) => {
    setLoading(true)
    try {
      const classData = {
        title: values.title,
        description: values.description || null,
        thumbnail_url: values.thumbnail_url || null,
        detail_page_url: values.detail_page_url || null,
        price: values.price || 0,
        is_free: values.is_free || false,
        instructor_name: values.instructor_name || null,
        instructor_info: values.instructor_info || null,
        duration_minutes: values.duration_minutes || null,
        is_active: values.is_active !== false,
      }

      if (editingClass) {
        await updateClass(editingClass.id, classData)
        message.success('클래스가 수정되었습니다.')
      } else {
        await createClass(classData)
        message.success('클래스가 생성되었습니다.')
      }

      setIsClassModalVisible(false)
      classForm.resetFields()
      setEditingClass(null)
      fetchClasses()
    } catch (error) {
      console.error('클래스 저장 실패:', error)
      message.error(error.message || '클래스 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 일정 목록 조회
  const fetchSchedules = async (classId) => {
    if (!classId) {
      setSchedules([])
      return
    }
    setLoading(true)
    try {
      const data = await getClassSchedules(classId)
      const allSchedules = data?.items || data || []
      setSchedules(allSchedules)
    } catch (error) {
      console.error('일정 목록 조회 실패:', error)
      message.error(error.message || '일정 목록을 불러오는데 실패했습니다.')
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  // 필터링된 일정 목록
  const filteredSchedules = scheduleDateFilter
    ? schedules.filter((schedule) => {
        const scheduleDate = dayjs(schedule.schedule_date).format('YYYY-MM-DD')
        const filterDate = dayjs(scheduleDateFilter).format('YYYY-MM-DD')
        return scheduleDate === filterDate
      })
    : schedules

  // 일정 관리 Drawer 열기
  const openScheduleDrawer = (classRecord) => {
    setSelectedClassForSchedule(classRecord)
    setIsScheduleDrawerVisible(true)
    fetchSchedules(classRecord.id)
  }

  // 일정 등록/수정
  const handleScheduleSubmit = async (values) => {
    const classId = editingSchedule?.class_id || selectedClassForSchedule?.id
    if (!classId) {
      message.warning('클래스를 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      const scheduleDate = dayjs(values.schedule_date).format('YYYY-MM-DD')
      const startTime = dayjs(values.start_time).format('HH:mm:ss')
      const endTime = dayjs(values.end_time).format('HH:mm:ss')

      const scheduleData = {
        class_id: classId,
        schedule_date: scheduleDate,
        start_time: startTime,
        end_time: endTime,
        max_reservations: values.max_reservations || 1,
        is_available: true,
      }

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData)
        message.success('일정이 수정되었습니다.')
      } else {
        await createSchedule(classId, scheduleData)
        message.success('일정이 등록되었습니다.')
      }

      setIsScheduleModalVisible(false)
      scheduleForm.resetFields()
      setEditingSchedule(null)
      scheduleForm.setFieldValue('max_reservations', 1)
      // 일정 목록 새로고침
      if (selectedClassForSchedule) {
        fetchSchedules(selectedClassForSchedule.id)
      }
    } catch (error) {
      console.error('일정 저장 실패:', error)
      message.error(error.message || '일정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 일정 삭제
  const handleDeleteSchedule = async (scheduleId) => {
    setLoading(true)
    try {
      await deleteSchedule(scheduleId)
      message.success('일정이 삭제되었습니다.')
      if (selectedClassForSchedule) {
        fetchSchedules(selectedClassForSchedule.id)
      }
    } catch (error) {
      console.error('일정 삭제 실패:', error)
      message.error(error.message || '일정 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 클래스 테이블 컬럼
  const classColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '썸네일',
      dataIndex: 'thumbnail_url',
      key: 'thumbnail_url',
      width: 120,
      render: (url) =>
        url ? (
          <Image
            src={url}
            alt="썸네일"
            width={80}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              mask: '미리보기',
            }}
          />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => (
        <Text>{price === 0 ? '무료' : `${price.toLocaleString()}원`}</Text>
      ),
    },
    {
      title: '소요 시간',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      width: 100,
      render: (minutes) => <Text>{minutes}분</Text>,
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Tag color={record.is_active ? 'success' : 'default'}>
            {record.is_active ? '활성' : '비활성'}
          </Tag>
          {record.is_free && <Tag color="blue">무료</Tag>}
        </Space>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingClass(record)
              classForm.setFieldsValue({
                title: record.title,
                description: record.description,
                thumbnail_url: record.thumbnail_url,
                detail_page_url: record.detail_page_url,
                price: record.price,
                duration_minutes: record.duration_minutes,
                is_free: record.is_free,
                is_active: record.is_active,
                instructor_name: record.instructor_name,
                instructor_info: record.instructor_info,
              })
              setIsClassModalVisible(true)
            }}
          >
            수정
          </Button>
          <Button
            size="small"
            icon={<CalendarOutlined />}
            onClick={() => openScheduleDrawer(record)}
          >
            일정 관리
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="class-management">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>클래스 관리</Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchClasses}
                loading={loading}
              >
                새로고침
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingClass(null)
                  classForm.resetFields()
                  setIsClassModalVisible(true)
                }}
              >
                클래스 등록
              </Button>
            </Space>
          </div>

          <Table
            dataSource={classes}
            columns={classColumns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개`,
            }}
          />
        </Space>
      </Card>

      {/* 클래스 등록/수정 모달 */}
      <Modal
        title={editingClass ? '클래스 수정' : '클래스 등록'}
        open={isClassModalVisible}
        onCancel={() => {
          setIsClassModalVisible(false)
          classForm.resetFields()
          setEditingClass(null)
        }}
        footer={null}
        width={800}
      >
        <Form
          form={classForm}
          layout="vertical"
          onFinish={handleClassSubmit}
          initialValues={{
            is_free: false,
            is_active: true,
          }}
        >
          <Form.Item
            label="제목"
            name="title"
            rules={[{ required: true, message: '제목을 입력해주세요.' }]}
          >
            <Input placeholder="클래스 제목" />
          </Form.Item>

          <Form.Item label="설명" name="description">
            <TextArea rows={4} placeholder="클래스 설명" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="썸네일 이미지"
                name="thumbnail_url"
              >
                <div>
                  <Button
                    type="default"
                    icon={<PictureOutlined />}
                    onClick={() => openImageModal('thumbnail')}
                    style={{ marginBottom: 8 }}
                  >
                    썸네일 이미지 선택
                  </Button>
                  <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.thumbnail_url !== currentValues.thumbnail_url}>
                    {({ getFieldValue }) => {
                      const thumbnailUrl = getFieldValue('thumbnail_url')
                      return thumbnailUrl ? (
                        <div style={{ marginTop: 8 }}>
                          <Image
                            src={thumbnailUrl}
                            alt="썸네일 미리보기"
                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: 4 }}
                            preview={{
                              mask: '미리보기',
                            }}
                          />
                          <div style={{ marginTop: 4 }}>
                            <Button
                              type="link"
                              size="small"
                              danger
                              onClick={() => {
                                classForm.setFieldValue('thumbnail_url', null)
                              }}
                            >
                              제거
                            </Button>
                          </div>
                        </div>
                      ) : null
                    }}
                  </Form.Item>
                </div>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="가격"
                name="price"
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="가격"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="상세 페이지 이미지"
            name="detail_page_url"
          >
            <div>
              <Button
                type="default"
                icon={<PictureOutlined />}
                onClick={() => openImageModal('detail')}
                style={{ marginBottom: 8 }}
              >
                상세 이미지 선택
              </Button>
              <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.detail_page_url !== currentValues.detail_page_url}>
                {({ getFieldValue }) => {
                  const detailPageUrl = getFieldValue('detail_page_url')
                  return detailPageUrl ? (
                    <div style={{ marginTop: 8 }}>
                      <Image
                        src={detailPageUrl}
                        alt="상세 이미지 미리보기"
                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: 4 }}
                        preview={{
                          mask: '미리보기',
                        }}
                      />
                      <div style={{ marginTop: 4 }}>
                        <Button
                          type="link"
                          size="small"
                          danger
                          onClick={() => {
                            classForm.setFieldValue('detail_page_url', null)
                          }}
                        >
                          제거
                        </Button>
                      </div>
                    </div>
                  ) : null
                }}
              </Form.Item>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="무료 클래스"
                name="is_free"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="활성화"
                name="is_active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="강사명" name="instructor_name">
                <Input placeholder="강사 이름" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="예상 소요 시간 (분)"
                name="duration_minutes"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="분"
                  min={1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="강사 정보" name="instructor_info">
            <TextArea rows={2} placeholder="강사 소개" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                저장
              </Button>
              <Button
                onClick={() => {
                  setIsClassModalVisible(false)
                  classForm.resetFields()
                  setEditingClass(null)
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 일정 관리 Drawer */}
      <Drawer
        title={
          selectedClassForSchedule
            ? `일정 관리: ${selectedClassForSchedule.title}`
            : '일정 관리'
        }
        placement="right"
        width={1200}
        open={isScheduleDrawerVisible}
        onClose={() => {
          setIsScheduleDrawerVisible(false)
          setSelectedClassForSchedule(null)
          setSchedules([])
          setScheduleDateFilter(null)
          setEditingSchedule(null)
          scheduleForm.resetFields()
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingSchedule(null)
                  scheduleForm.resetFields()
                  scheduleForm.setFieldValue('max_reservations', 1)
                  setIsScheduleModalVisible(true)
                }}
              >
                일정 등록
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => selectedClassForSchedule && fetchSchedules(selectedClassForSchedule.id)}
                loading={loading}
              >
                새로고침
              </Button>
            </Space>
            <Space>
              <span>날짜 필터:</span>
              <DatePicker
                value={scheduleDateFilter ? dayjs(scheduleDateFilter) : null}
                onChange={(date) => setScheduleDateFilter(date ? date.format('YYYY-MM-DD') : null)}
                format="YYYY-MM-DD"
                placeholder="전체"
                allowClear
                style={{ width: 150 }}
              />
              {scheduleDateFilter && (
                <Button
                  size="small"
                  onClick={() => setScheduleDateFilter(null)}
                >
                  전체 보기
                </Button>
              )}
            </Space>
          </div>

          <Table
            dataSource={filteredSchedules}
            rowKey="id"
            loading={loading}
            columns={[
              {
                title: 'ID',
                dataIndex: 'id',
                key: 'id',
                width: 80,
              },
              {
                title: '날짜',
                dataIndex: 'schedule_date',
                key: 'schedule_date',
                width: 120,
                render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
              },
              {
                title: '시간',
                key: 'time',
                width: 150,
                render: (_, record) => {
                  // 시간이 숫자(초)로 오는 경우 문자열로 변환
                  const formatTime = (time) => {
                    if (!time) return '-'
                    // 숫자인 경우 (초 단위)
                    if (typeof time === 'number') {
                      const hours = Math.floor(time / 3600)
                      const minutes = Math.floor((time % 3600) / 60)
                      const seconds = time % 60
                      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                    }
                    // 문자열인 경우 그대로 반환
                    if (typeof time === 'string') {
                      // HH:mm:ss 형식이면 그대로, 아니면 파싱 시도
                      if (time.includes(':')) {
                        return time
                      }
                      // 숫자 문자열인 경우
                      const numTime = parseInt(time, 10)
                      if (!isNaN(numTime)) {
                        const hours = Math.floor(numTime / 3600)
                        const minutes = Math.floor((numTime % 3600) / 60)
                        const seconds = numTime % 60
                        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                      }
                    }
                    return time
                  }
                  
                  return (
                    <Text>
                      {formatTime(record.start_time)} ~ {formatTime(record.end_time)}
                    </Text>
                  )
                },
              },
              {
                title: '최대 인원',
                dataIndex: 'max_reservations',
                key: 'max_reservations',
                width: 100,
              },
              {
                title: '현재 예약',
                dataIndex: 'current_reservations',
                key: 'current_reservations',
                width: 100,
              },
              {
                title: '상태',
                dataIndex: 'is_available',
                key: 'is_available',
                width: 100,
                render: (isAvailable) => (
                  <Tag color={isAvailable ? 'success' : 'default'}>
                    {isAvailable ? '예약 가능' : '예약 불가'}
                  </Tag>
                ),
              },
              {
                title: '작업',
                key: 'actions',
                width: 150,
                render: (_, record) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingSchedule(record)
                        scheduleForm.setFieldsValue({
                          schedule_date: dayjs(record.schedule_date),
                          start_time: dayjs(record.start_time, 'HH:mm:ss'),
                          end_time: dayjs(record.end_time, 'HH:mm:ss'),
                          max_reservations: record.max_reservations || 1,
                        })
                        setIsScheduleModalVisible(true)
                      }}
                    >
                      수정
                    </Button>
                    <Popconfirm
                      title="일정을 삭제하시겠습니까?"
                      onConfirm={() => handleDeleteSchedule(record.id)}
                      okText="삭제"
                      cancelText="취소"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        삭제
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => {
                const totalCount = schedules.length
                if (scheduleDateFilter) {
                  return `필터링: ${total}개 / 전체: ${totalCount}개`
                }
                return `총 ${total}개`
              },
            }}
          />
        </Space>
      </Drawer>

      {/* 일정 등록/수정 모달 */}
      <Modal
        title={editingSchedule ? '일정 수정' : '일정 등록'}
        open={isScheduleModalVisible}
        onCancel={() => {
          setIsScheduleModalVisible(false)
          scheduleForm.resetFields()
          setEditingSchedule(null)
          scheduleForm.setFieldValue('max_reservations', 1)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={scheduleForm}
          layout="vertical"
          onFinish={handleScheduleSubmit}
          initialValues={{
            max_reservations: 1,
          }}
        >
          <Form.Item
            label="클래스"
            required
          >
            <Input
              value={
                editingSchedule?.class_id
                  ? `ID: ${editingSchedule.class_id}`
                  : selectedClassForSchedule
                  ? `${selectedClassForSchedule.title} (ID: ${selectedClassForSchedule.id})`
                  : '클래스를 선택해주세요'
              }
              disabled
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="날짜"
                name="schedule_date"
                rules={[{ required: true, message: '날짜를 선택해주세요.' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="시작 시간"
                name="start_time"
                rules={[{ required: true, message: '시작 시간을 선택해주세요.' }]}
              >
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="종료 시간"
                name="end_time"
                rules={[{ required: true, message: '종료 시간을 선택해주세요.' }]}
              >
                <TimePicker
                  style={{ width: '100%' }}
                  format="HH:mm:ss"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="최대 인원"
            name="max_reservations"
            initialValue={1}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="최대 인원"
              min={1}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                저장
              </Button>
              <Button
                onClick={() => {
                  setIsScheduleModalVisible(false)
                  scheduleForm.resetFields()
                  setEditingSchedule(null)
                  scheduleForm.setFieldValue('max_reservations', 1)
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 이미지 선택 모달 */}
      <Modal
        title={imageModalType === 'thumbnail' ? '썸네일 이미지 선택' : '상세 이미지 선택'}
        open={isImageModalVisible}
        onCancel={() => setIsImageModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {imageModalType === 'thumbnail' ? (
            <Row gutter={[16, 16]}>
              {thumbnailImages.map((image) => (
                <Col xs={12} sm={8} md={6} key={image.key}>
                  <Card
                    hoverable
                    cover={
                      <Image
                        src={image.url}
                        alt={image.fileName}
                        style={{ height: 150, objectFit: 'cover' }}
                        preview={false}
                      />
                    }
                    onClick={() => handleImageSelect(image.url)}
                  >
                    <CardMeta
                      title={
                        <Text ellipsis style={{ fontSize: '12px' }}>
                          {image.fileName}
                        </Text>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Row gutter={[16, 16]}>
              {detailImages.map((image) => (
                <Col xs={12} sm={8} md={6} key={image.key}>
                  <Card
                    hoverable
                    cover={
                      <Image
                        src={image.url}
                        alt={image.fileName}
                        style={{ height: 150, objectFit: 'cover' }}
                        preview={false}
                      />
                    }
                    onClick={() => handleImageSelect(image.url)}
                  >
                    <CardMeta
                      title={
                        <Text ellipsis style={{ fontSize: '12px' }}>
                          {image.fileName}
                        </Text>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          {((imageModalType === 'thumbnail' && thumbnailImages.length === 0) ||
            (imageModalType === 'detail' && detailImages.length === 0)) && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
              업로드된 이미지가 없습니다.
              <br />
              <Button
                type="link"
                onClick={() => {
                  setIsImageModalVisible(false)
                  message.info('이미지 관리 메뉴에서 이미지를 업로드해주세요.')
                }}
              >
                이미지 관리 페이지로 이동
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ClassManagement
