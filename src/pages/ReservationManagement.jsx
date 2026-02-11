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
  Table,
  Tag,
  Modal,
  Popconfirm,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getReservations,
  updateEntryLink,
  createFeedback,
  updateFeedback,
  cancelReservationByAdmin,
} from '../services/api'
import './ClassReservation.css'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function ReservationManagement() {
  const [feedbackForm] = Form.useForm()
  const [entryLinkForm] = Form.useForm()
  const [cancelForm] = Form.useForm()

  // 상태 관리
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState([])
  const [reservationFilters, setReservationFilters] = useState({
    class_id: null,
    schedule_date: null,
    status: null,
  })
  
  // 모달 상태
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false)
  const [feedbackModalMode, setFeedbackModalMode] = useState('create') // 'create' | 'view' | 'edit'
  const [isEntryLinkModalVisible, setIsEntryLinkModalVisible] = useState(false)
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)

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
    fetchReservations()
  }, [reservationFilters])

  // 입장 링크 등록
  const handleEntryLinkSubmit = async (values) => {
    if (!selectedReservation) return

    setLoading(true)
    try {
      await updateEntryLink(selectedReservation.id, values.entry_link)
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
      await createFeedback(selectedReservation.id, {
        feedback_content: values.feedback,
      })
      message.success('피드백이 등록되었습니다. 예약 상태가 "진행 완료"로 변경됩니다.')
      setIsFeedbackModalVisible(false)
      setFeedbackModalMode('create')
      feedbackForm.resetFields()
      setSelectedReservation(null)
      await fetchReservations()
    } catch (error) {
      console.error('피드백 등록 실패:', error)
      message.error(error.message || '피드백 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 피드백 수정
  const handleFeedbackUpdateSubmit = async (values) => {
    if (!selectedReservation) return

    setLoading(true)
    try {
      await updateFeedback(selectedReservation.id, {
        feedback_content: values.feedback,
      })
      message.success('피드백이 수정되었습니다.')
      setIsFeedbackModalVisible(false)
      setFeedbackModalMode('create')
      feedbackForm.resetFields()
      setSelectedReservation(null)
      await fetchReservations()
    } catch (error) {
      console.error('피드백 수정 실패:', error)
      message.error(error.message || '피드백 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 예약 취소 (관리자)
  const handleCancelSubmit = async (values) => {
    if (!selectedReservation) return

    setLoading(true)
    try {
      await cancelReservationByAdmin(selectedReservation.id, {
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
      dataIndex: 'id',
      key: 'id',
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
          <div>{record.name || '-'}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.email || '-'}
          </Text>
        </div>
      ),
    },
    {
      title: '예약 일시',
      key: 'schedule',
      width: 180,
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
        
        const startTime = formatTime(record.schedule_start_time || record.start_time)
        const endTime = formatTime(record.schedule_end_time || record.end_time)
        
        return (
          <div>
            <div>{record.schedule_date || '-'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {startTime} ~ {endTime}
            </Text>
          </div>
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status, record) => {
        const statusMap = {
          reserved: { color: 'blue', text: '예약 완료' },
          completed: { color: 'green', text: '진행 완료' },
          cancelled: { color: 'red', text: '취소됨' },
        }
        const statusInfo = statusMap[status] || { color: 'default', text: status }
        return (
          <Space direction="vertical" size={0}>
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
            {record.feedback_content && (
              <Text type="secondary" style={{ fontSize: '11px' }}>피드백 등록됨</Text>
            )}
          </Space>
        )
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
          {record.status === 'reserved' && (
            <Button
              size="small"
              onClick={() => {
                setSelectedReservation(record)
                setFeedbackModalMode('create')
                feedbackForm.setFieldValue('feedback', '')
                setIsFeedbackModalVisible(true)
              }}
            >
              피드백 등록
            </Button>
          )}
          {record.feedback_content && (
            <Button
              size="small"
              onClick={() => {
                setSelectedReservation(record)
                setFeedbackModalMode('view')
                feedbackForm.setFieldValue('feedback', record.feedback_content || '')
                setIsFeedbackModalVisible(true)
              }}
            >
              피드백 보기/수정
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
    <div className="reservation-management">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>예약 현황</Title>

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
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개`,
            }}
          />
        </Space>
      </Card>

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

      {/* 피드백 등록/보기/수정 모달 */}
      <Modal
        title={
          feedbackModalMode === 'create'
            ? '피드백 등록'
            : feedbackModalMode === 'view'
            ? '피드백 보기'
            : '피드백 수정'
        }
        open={isFeedbackModalVisible}
        onCancel={() => {
          setIsFeedbackModalVisible(false)
          setFeedbackModalMode('create')
          feedbackForm.resetFields()
          setSelectedReservation(null)
        }}
        footer={null}
        width={600}
      >
        {feedbackModalMode === 'view' ? (
          <>
            <div style={{ marginBottom: 16, whiteSpace: 'pre-wrap', minHeight: 120, padding: 12, background: '#fafafa', borderRadius: 4 }}>
              <Text>{selectedReservation?.feedback_content || '-'}</Text>
            </div>
            <Space>
              <Button
                type="primary"
                onClick={() => setFeedbackModalMode('edit')}
              >
                수정
              </Button>
              <Button
                onClick={() => {
                  setIsFeedbackModalVisible(false)
                  setFeedbackModalMode('create')
                  setSelectedReservation(null)
                }}
              >
                닫기
              </Button>
            </Space>
          </>
        ) : (
          <Form
            form={feedbackForm}
            layout="vertical"
            onFinish={feedbackModalMode === 'create' ? handleFeedbackSubmit : handleFeedbackUpdateSubmit}
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
                  {feedbackModalMode === 'create' ? '등록' : '저장'}
                </Button>
                <Button
                  onClick={() => {
                    if (feedbackModalMode === 'edit') {
                      feedbackForm.setFieldValue('feedback', selectedReservation?.feedback_content || '')
                      setFeedbackModalMode('view')
                    } else {
                      setIsFeedbackModalVisible(false)
                      setFeedbackModalMode('create')
                      feedbackForm.resetFields()
                      setSelectedReservation(null)
                    }
                  }}
                >
                  {feedbackModalMode === 'edit' ? '취소' : '닫기'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
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
    </div>
  )
}

export default ReservationManagement
