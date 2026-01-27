import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  message,
  Typography,
  Space,
  DatePicker,
  Row,
  Col,
  Divider,
  Table,
  Tag,
  Modal,
  TimePicker,
  InputNumber,
  Switch,
  Tabs,
  Popconfirm,
  Image,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  BookOutlined,
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
  getReservations,
  updateEntryLink,
  createFeedback,
  cancelReservationByAdmin,
} from '../services/api'
import { listS3Images } from '../services/s3Upload'
import './ClassReservation.css'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

function ClassReservation() {
  const [classForm] = Form.useForm()
  const [scheduleForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const [entryLinkForm] = Form.useForm()
  const [cancelForm] = Form.useForm()

  // 상태 관리
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('reservations')
  const [reservations, setReservations] = useState([])
  const [reservationFilters, setReservationFilters] = useState({
    class_id: null,
    schedule_date: null,
    status: null,
  })
  
  // 모달 상태
  const [isClassModalVisible, setIsClassModalVisible] = useState(false)
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false)
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false)
  const [isEntryLinkModalVisible, setIsEntryLinkModalVisible] = useState(false)
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [selectedClassForSchedule, setSelectedClassForSchedule] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)
  const [imageModalType, setImageModalType] = useState('thumbnail') // 'thumbnail' or 'detail'
  const [thumbnailImages, setThumbnailImages] = useState([])
  const [detailImages, setDetailImages] = useState([])
  const [classes, setClasses] = useState([])

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
    // Form 값 변경을 강제로 반영하기 위해 업데이트
    classForm.validateFields(['thumbnail_url', 'detail_page_url'])
  }

  // 예약 현황 조회
  const fetchReservations = async () => {
    setLoading(true)
    try {
      const data = await getReservations(reservationFilters, 100, 0)
      setReservations(data?.items || data || [])
    } catch (error) {
      console.error('예약 현황 조회 실패:', error)
      message.error(error.message || '예약 현황을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations()
    } else if (activeTab === 'classes') {
      fetchClasses()
    }
  }, [activeTab, reservationFilters])

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
      // 클래스 목록 새로고침
      if (activeTab === 'classes') {
        fetchClasses()
      }
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
      setSchedules(data?.items || data || [])
    } catch (error) {
      console.error('일정 목록 조회 실패:', error)
      message.error(error.message || '일정 목록을 불러오는데 실패했습니다.')
      setSchedules([])
    } finally {
      setLoading(false)
    }
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
        schedule_date: scheduleDate,
        start_time: startTime,
        end_time: endTime,
        max_reservations: values.max_reservations || 1,
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
      // 일정 목록 새로고침
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

  // 입장 링크 등록
  const handleEntryLinkSubmit = async (values) => {
    if (!selectedReservation) return

    setLoading(true)
    try {
      await updateEntryLink(selectedReservation.reservation_id, values.entry_link)
      message.success('입장 링크가 등록되었습니다.')
      setIsEntryLinkModalVisible(false)
      entryLinkForm.resetFields()
      setSelectedReservation(null)
      fetchReservations()
    } catch (error) {
      console.error('입장 링크 등록 실패:', error)
      message.error(error.message || '입장 링크 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 피드백 등록
  const handleFeedbackSubmit = async (values) => {
    if (!selectedReservation) return

    setLoading(true)
    try {
      await createFeedback(selectedReservation.reservation_id, {
        feedback: values.feedback,
      })
      message.success('피드백이 등록되었습니다.')
      setIsFeedbackModalVisible(false)
      feedbackForm.resetFields()
      setSelectedReservation(null)
      fetchReservations()
    } catch (error) {
      console.error('피드백 등록 실패:', error)
      message.error(error.message || '피드백 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 예약 취소 (관리자)
  const handleCancelSubmit = async (values) => {
    if (!selectedReservation) return

    setLoading(true)
    try {
      await cancelReservationByAdmin(selectedReservation.reservation_id, {
        cancellation_reason: values.cancellation_reason,
        cancelled_by: values.cancelled_by || 'admin',
      })
      message.success('예약이 취소되었습니다.')
      setIsCancelModalVisible(false)
      cancelForm.resetFields()
      setSelectedReservation(null)
      fetchReservations()
    } catch (error) {
      console.error('예약 취소 실패:', error)
      message.error(error.message || '예약 취소에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 예약 테이블 컬럼
  const reservationColumns = [
    {
      title: '예약 ID',
      dataIndex: 'reservation_id',
      key: 'reservation_id',
      width: 100,
    },
    {
      title: '클래스',
      dataIndex: 'class_title',
      key: 'class_title',
      width: 200,
    },
    {
      title: '예약자',
      key: 'reserver',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.reserver_name || '-'}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.reserver_email || '-'}
          </Text>
        </div>
      ),
    },
    {
      title: '예약 일시',
      key: 'schedule',
      width: 180,
      render: (_, record) => (
        <div>
          <div>{record.schedule_date || '-'}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.start_time} ~ {record.end_time}
          </Text>
        </div>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusMap = {
          reserved: { color: 'blue', text: '예약 완료' },
          completed: { color: 'green', text: '진행 완료' },
          cancelled: { color: 'red', text: '취소됨' },
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: '입장 링크',
      dataIndex: 'entry_link',
      key: 'entry_link',
      width: 200,
      render: (link) => (
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link.length > 30 ? `${link.substring(0, 30)}...` : link}
          </a>
        ) : (
          <Text type="secondary">미등록</Text>
        )
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {!record.entry_link && record.status === 'reserved' && (
            <Button
              size="small"
              onClick={() => {
                setSelectedReservation(record)
                entryLinkForm.setFieldValue('entry_link', record.entry_link || '')
                setIsEntryLinkModalVisible(true)
              }}
            >
              입장 링크
            </Button>
          )}
          {record.status === 'completed' && !record.feedback && (
            <Button
              size="small"
              onClick={() => {
                setSelectedReservation(record)
                feedbackForm.setFieldValue('feedback', record.feedback || '')
                setIsFeedbackModalVisible(true)
              }}
            >
              피드백
            </Button>
          )}
          {record.status === 'reserved' && (
            <Button
              size="small"
              danger
              onClick={() => {
                setSelectedReservation(record)
                cancelForm.setFieldValue('cancellation_reason', '')
                cancelForm.setFieldValue('cancelled_by', 'admin')
                setIsCancelModalVisible(true)
              }}
            >
              취소
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="class-reservation">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>1:1 클래스 관리</Title>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <BookOutlined />
                  예약 현황
                </span>
              }
              key="reservations"
            >
              {/* 예약 현황 필터 */}
              <Card style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col xs={24} sm={8} md={6}>
                    <Space wrap>
                      <span>클래스 ID:</span>
                      <Input
                        type="number"
                        placeholder="클래스 ID"
                        value={reservationFilters.class_id || ''}
                        onChange={(e) =>
                          setReservationFilters({
                            ...reservationFilters,
                            class_id: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        style={{ width: 120 }}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={8} md={6}>
                    <Space wrap>
                      <span>날짜:</span>
                      <DatePicker
                        value={reservationFilters.schedule_date ? dayjs(reservationFilters.schedule_date) : null}
                        onChange={(date) =>
                          setReservationFilters({
                            ...reservationFilters,
                            schedule_date: date ? date.format('YYYY-MM-DD') : null,
                          })
                        }
                        format="YYYY-MM-DD"
                        style={{ width: 150 }}
                      />
                    </Space>
                  </Col>
                  <Col xs={24} sm={8} md={6}>
                    <Space wrap>
                      <span>상태:</span>
                      <Select
                        value={reservationFilters.status}
                        onChange={(value) =>
                          setReservationFilters({
                            ...reservationFilters,
                            status: value,
                          })
                        }
                        allowClear
                        placeholder="전체"
                        style={{ width: 120 }}
                      >
                        <Option value="reserved">예약 완료</Option>
                        <Option value="completed">진행 완료</Option>
                        <Option value="cancelled">취소됨</Option>
                      </Select>
                    </Space>
                  </Col>
                  <Col xs={24} sm={24} md={6}>
                    <Space>
                      <Button
                        icon={<SearchOutlined />}
                        onClick={fetchReservations}
                        loading={loading}
                      >
                        조회
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setReservationFilters({
                            class_id: null,
                            schedule_date: null,
                            status: null,
                          })
                        }}
                      >
                        초기화
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* 예약 현황 테이블 */}
              <Table
                dataSource={reservations}
                columns={reservationColumns}
                rowKey="reservation_id"
                loading={loading}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `총 ${total}개`,
                }}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CalendarOutlined />
                  클래스 관리
                </span>
              }
              key="classes"
            >
              <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={fetchClasses}
                      loading={loading}
                    >
                      새로고침
                    </Button>
                  </div>

                  <Table
                    dataSource={classes}
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
                              onClick={() => {
                                setSelectedClassForSchedule(record)
                                fetchSchedules(record.id)
                              }}
                            >
                              일정 관리
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                    pagination={{
                      pageSize: 20,
                      showSizeChanger: true,
                      showTotal: (total) => `총 ${total}개`,
                    }}
                  />

                  {/* 선택된 클래스의 일정 관리 섹션 */}
                  {selectedClassForSchedule && (
                    <Card
                      title={
                        <Space>
                          <Text strong>일정 관리: {selectedClassForSchedule.title}</Text>
                          <Button
                            type="text"
                            size="small"
                            onClick={() => {
                              setSelectedClassForSchedule(null)
                              setSchedules([])
                            }}
                          >
                            닫기
                          </Button>
                        </Space>
                      }
                      style={{ marginTop: 24 }}
                    >
                      <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                            onClick={() => fetchSchedules(selectedClassForSchedule.id)}
                            loading={loading}
                          >
                            새로고침
                          </Button>
                        </div>

                        <Table
                          dataSource={schedules}
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
                              render: (_, record) => (
                                <Text>
                                  {record.start_time} ~ {record.end_time}
                                </Text>
                              ),
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
                            showTotal: (total) => `총 ${total}개`,
                          }}
                        />
                      </Space>
                    </Card>
                  )}
                </Space>
              </Card>
            </TabPane>
          </Tabs>
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

      {/* 일정 등록/수정 모달 */}
      <Modal
        title={editingSchedule ? '일정 수정' : '일정 등록'}
        open={isScheduleModalVisible}
        onCancel={() => {
          setIsScheduleModalVisible(false)
          scheduleForm.resetFields()
          setEditingSchedule(null)
          setSelectedClassId(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={scheduleForm}
          layout="vertical"
          onFinish={handleScheduleSubmit}
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

          <Row gutter={16}>
            <Col span={12}>
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
            <Col span={12}>
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
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 입장 링크 등록 모달 */}
      <Modal
        title="입장 링크 등록"
        open={isEntryLinkModalVisible}
        onCancel={() => {
          setIsEntryLinkModalVisible(false)
          entryLinkForm.resetFields()
          setSelectedReservation(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={entryLinkForm}
          layout="vertical"
          onFinish={handleEntryLinkSubmit}
        >
          <Form.Item
            label="입장 링크"
            name="entry_link"
            rules={[{ required: true, message: '입장 링크를 입력해주세요.' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                저장
              </Button>
              <Button
                onClick={() => {
                  setIsEntryLinkModalVisible(false)
                  entryLinkForm.resetFields()
                  setSelectedReservation(null)
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 피드백 등록 모달 */}
      <Modal
        title="피드백 등록"
        open={isFeedbackModalVisible}
        onCancel={() => {
          setIsFeedbackModalVisible(false)
          feedbackForm.resetFields()
          setSelectedReservation(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={handleFeedbackSubmit}
        >
          <Form.Item
            label="피드백"
            name="feedback"
            rules={[{ required: true, message: '피드백을 입력해주세요.' }]}
          >
            <TextArea rows={6} placeholder="수업 피드백을 입력하세요" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                저장
              </Button>
              <Button
                onClick={() => {
                  setIsFeedbackModalVisible(false)
                  feedbackForm.resetFields()
                  setSelectedReservation(null)
                }}
              >
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 예약 취소 모달 */}
      <Modal
        title="예약 취소 (관리자)"
        open={isCancelModalVisible}
        onCancel={() => {
          setIsCancelModalVisible(false)
          cancelForm.resetFields()
          setSelectedReservation(null)
        }}
        footer={null}
        width={600}
      >
        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={handleCancelSubmit}
          initialValues={{
            cancelled_by: 'admin',
          }}
        >
          <Form.Item
            label="취소 사유"
            name="cancellation_reason"
            rules={[{ required: true, message: '취소 사유를 입력해주세요.' }]}
          >
            <TextArea rows={4} placeholder="취소 사유를 입력하세요" />
          </Form.Item>

          <Form.Item
            label="취소 주체"
            name="cancelled_by"
            rules={[{ required: true, message: '취소 주체를 선택해주세요.' }]}
          >
            <Select>
              <Option value="admin">관리자</Option>
              <Option value="instructor">선생님</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Popconfirm
                title="정말 취소하시겠습니까?"
                onConfirm={cancelForm.submit}
                okText="예"
                cancelText="아니오"
              >
                <Button type="primary" danger loading={loading}>
                  취소 처리
                </Button>
              </Popconfirm>
              <Button
                onClick={() => {
                  setIsCancelModalVisible(false)
                  cancelForm.resetFields()
                  setSelectedReservation(null)
                }}
              >
                닫기
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
          {((imageModalType === 'thumbnail' && thumbnailImages.length === 0) ||
            (imageModalType === 'detail' && detailImages.length === 0)) && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
              업로드된 이미지가 없습니다.
              <br />
              <Button
                type="link"
                onClick={() => {
                  setIsImageModalVisible(false)
                  // 이미지 관리 페이지로 이동하도록 안내
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

export default ClassReservation
