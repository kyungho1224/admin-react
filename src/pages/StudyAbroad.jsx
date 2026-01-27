import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Typography, message, Tag, Modal, Form, Input, Select, Switch, Tabs, Image, Row, Col, DatePicker, InputNumber, Upload, Popconfirm } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { 
  getLanguageAcademies, 
  createLanguageAcademy, 
  updateLanguageAcademy,
  getLanguageCourses,
  createLanguageCourse,
  updateLanguageCourse,
  // getAcademyPayments // TODO: 개발 완료 후 주석 해제
} from '../services/api'
import { listS3Images, uploadToS3, deleteS3Image } from '../services/s3Upload'
import './StudyAbroad.css'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

// 지원 언어 목록
const SUPPORTED_LANGUAGES = [
  'ko', 'en', 'vi', 'id', 'ja', 'zh-tw', 'zh-cn', 'fr', 'uz', 'ru', 'th', 'kk', 'mn'
]

const LANGUAGE_LABELS = {
  'ko': '한국어',
  'en': '영어',
  'vi': '베트남어',
  'id': '인도네시아어',
  'ja': '일본어',
  'zh-tw': '중국어(번체)',
  'zh-cn': '중국어(간체)',
  'fr': '프랑스어',
  'uz': '우즈베크어',
  'ru': '러시아어',
  'th': '태국어',
  'kk': '카자흐어',
  'mn': '몽골어'
}

// 상태 옵션
const ACADEMY_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' }
]

const COURSE_STATUS_OPTIONS = [
  { value: 'RECRUITING', label: '모집중' },
  { value: 'CLOSED', label: '마감' },
  { value: 'APPLIED', label: '지원완료' }
]

// 결제 상태 옵션
const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: '대기중', color: 'orange' },
  { value: 'DONE', label: '완료', color: 'green' },
  { value: 'FAILED', label: '실패', color: 'red' },
  { value: 'CANCELED', label: '취소', color: 'default' }
]

function StudyAbroad() {
  const [loading, setLoading] = useState(false)
  const [academies, setAcademies] = useState([])
  const [selectedAcademy, setSelectedAcademy] = useState(null)
  const [courses, setCourses] = useState([])
  const [isAcademyModalVisible, setIsAcademyModalVisible] = useState(false)
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false)
  const [editingAcademy, setEditingAcademy] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)
  const [availableImages, setAvailableImages] = useState([])
  const [currentImageField, setCurrentImageField] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [academyForm] = Form.useForm()
  const [courseForm] = Form.useForm()
  
  // 결제 내역 관련 state (개발 완료 후 주석 해제)
  // const [payments, setPayments] = useState([])
  // const [paymentFilters, setPaymentFilters] = useState({
  //   academy_id: null,
  //   course_id: null,
  //   payment_status: null,
  //   start_date: null,
  //   end_date: null,
  // })
  // const [isPaymentDetailModalVisible, setIsPaymentDetailModalVisible] = useState(false)
  // const [selectedPayment, setSelectedPayment] = useState(null)

  // 어학원 목록 조회
  const fetchAcademies = async () => {
    setLoading(true)
    try {
      const data = await getLanguageAcademies()
      setAcademies(data || [])
    } catch (error) {
      console.error('어학원 목록 조회 실패:', error)
      message.error(error.message || '어학원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 코스 목록 조회
  const fetchCourses = async (academyId) => {
    if (!academyId) {
      setCourses([])
      return
    }
    
    setLoading(true)
    try {
      const data = await getLanguageCourses(academyId)
      setCourses(data || [])
    } catch (error) {
      console.error('코스 목록 조회 실패:', error)
      message.error(error.message || '코스 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAcademies()
  }, [])

  useEffect(() => {
    if (selectedAcademy) {
      fetchCourses(selectedAcademy.academy_id)
    }
  }, [selectedAcademy])

  // 결제 내역 조회 (개발 완료 후 주석 해제)
  // const fetchPayments = async () => {
  //   setLoading(true)
  //   try {
  //     const filters = {}
  //     if (paymentFilters.academy_id) filters.academy_id = paymentFilters.academy_id
  //     if (paymentFilters.course_id) filters.course_id = paymentFilters.course_id
  //     if (paymentFilters.payment_status) filters.payment_status = paymentFilters.payment_status
  //     if (paymentFilters.start_date) filters.start_date = paymentFilters.start_date.format('YYYY-MM-DD')
  //     if (paymentFilters.end_date) filters.end_date = paymentFilters.end_date.format('YYYY-MM-DD')
  //     
  //     const data = await getAcademyPayments(filters)
  //     setPayments(data || [])
  //   } catch (error) {
  //     console.error('결제 내역 조회 실패:', error)
  //     message.error(error.message || '결제 내역을 불러오는데 실패했습니다.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // 어학원 선택 시 코스 목록 업데이트 (결제 필터용) (개발 완료 후 주석 해제)
  // useEffect(() => {
  //   if (paymentFilters.academy_id) {
  //     fetchCourses(paymentFilters.academy_id)
  //   } else {
  //     setCourses([])
  //   }
  // }, [paymentFilters.academy_id])

  // 결제 내역 조회 (개발 완료 후 주석 해제)
  // useEffect(() => {
  //   fetchPayments()
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [paymentFilters.academy_id, paymentFilters.course_id, paymentFilters.payment_status, paymentFilters.start_date, paymentFilters.end_date])

  // 어학원 등록/수정 모달 열기
  const handleOpenAcademyModal = (academy = null) => {
    setEditingAcademy(academy)
    if (academy) {
      // 수정 모드
      academyForm.setFieldsValue({
        names: typeof academy.names === 'string' ? JSON.parse(academy.names) : academy.names,
        descriptions: typeof academy.descriptions === 'string' ? JSON.parse(academy.descriptions) : academy.descriptions,
        regions: typeof academy.regions === 'string' ? JSON.parse(academy.regions) : academy.regions,
        thumbnail_image_url: academy.thumbnail_image_url,
        status: academy.status,
      })
    } else {
      // 등록 모드
      academyForm.resetFields()
    }
    setIsAcademyModalVisible(true)
  }

  // 어학원 등록/수정
  const handleSaveAcademy = async (values) => {
    try {
      const data = {
        names: typeof values.names === 'string' ? values.names : JSON.stringify(values.names),
        descriptions: typeof values.descriptions === 'string' ? values.descriptions : JSON.stringify(values.descriptions),
        regions: typeof values.regions === 'string' ? values.regions : JSON.stringify(values.regions),
        thumbnail_image_url: values.thumbnail_image_url,
        status: values.status,
      }

      if (editingAcademy) {
        await updateLanguageAcademy(editingAcademy.academy_id, data)
        message.success('어학원이 수정되었습니다.')
      } else {
        await createLanguageAcademy(data)
        message.success('어학원이 등록되었습니다.')
      }

      setIsAcademyModalVisible(false)
      fetchAcademies()
    } catch (error) {
      console.error('어학원 저장 실패:', error)
      message.error(error.message || '어학원 저장에 실패했습니다.')
    }
  }

  // 코스 등록/수정 모달 열기
  const handleOpenCourseModal = (course = null) => {
    setEditingCourse(course)
    if (course) {
      // 수정 모드
      courseForm.setFieldsValue({
        academy_id: course.academy_id,
        names: typeof course.names === 'string' ? JSON.parse(course.names) : course.names,
        regions: typeof course.regions === 'string' ? JSON.parse(course.regions) : course.regions,
        tags: typeof course.tags === 'string' ? JSON.parse(course.tags) : course.tags,
        logo_url: course.logo_url,
        thumbnail_url: course.thumbnail_url,
        recruiting_start_date: course.recruiting_start_date ? dayjs(course.recruiting_start_date) : null,
        recruiting_end_date: course.recruiting_end_date ? dayjs(course.recruiting_end_date) : null,
        class_start_date: course.class_start_date ? dayjs(course.class_start_date) : null,
        duration: course.duration,
        schedule_days: typeof course.schedule_days === 'string' ? JSON.parse(course.schedule_days) : course.schedule_days,
        class_time: course.class_time,
        price: course.price,
        map_location: typeof course.map_location === 'string' ? JSON.parse(course.map_location) : course.map_location,
        detail_html: typeof course.detail_html === 'string' ? JSON.parse(course.detail_html) : course.detail_html,
        status: course.status,
      })
    } else {
      // 등록 모드
      courseForm.resetFields()
      courseForm.setFieldsValue({
        academy_id: selectedAcademy?.academy_id,
      })
    }
    setIsCourseModalVisible(true)
  }

  // 코스 등록/수정
  const handleSaveCourse = async (values) => {
    try {
      const data = {
        academy_id: values.academy_id,
        names: typeof values.names === 'string' ? values.names : JSON.stringify(values.names),
        regions: typeof values.regions === 'string' ? values.regions : JSON.stringify(values.regions || {}),
        tags: Array.isArray(values.tags) ? JSON.stringify(values.tags) : (values.tags || '[]'),
        logo_url: values.logo_url,
        thumbnail_url: values.thumbnail_url,
        recruiting_start_date: values.recruiting_start_date ? values.recruiting_start_date.format('YYYY-MM-DD HH:mm:ss') : null,
        recruiting_end_date: values.recruiting_end_date ? values.recruiting_end_date.format('YYYY-MM-DD HH:mm:ss') : null,
        class_start_date: values.class_start_date ? values.class_start_date.format('YYYY-MM-DD HH:mm:ss') : null,
        duration: values.duration,
        schedule_days: typeof values.schedule_days === 'string' ? values.schedule_days : JSON.stringify(values.schedule_days || {}),
        class_time: values.class_time,
        price: values.price,
        map_location: Array.isArray(values.map_location) ? JSON.stringify(values.map_location) : (values.map_location || '[]'),
        detail_html: typeof values.detail_html === 'string' ? values.detail_html : JSON.stringify(values.detail_html || {}),
        status: values.status,
      }

      if (editingCourse) {
        await updateLanguageCourse(editingCourse.course_id, data)
        message.success('코스가 수정되었습니다.')
      } else {
        await createLanguageCourse(data)
        message.success('코스가 등록되었습니다.')
      }

      setIsCourseModalVisible(false)
      if (selectedAcademy) {
        fetchCourses(selectedAcademy.academy_id)
      }
    } catch (error) {
      console.error('코스 저장 실패:', error)
      message.error(error.message || '코스 저장에 실패했습니다.')
    }
  }

  // 이미지 선택 모달 열기
  const handleOpenImageModal = (fieldName) => {
    setCurrentImageField(fieldName)
    loadAvailableImages()
    setIsImageModalVisible(true)
  }

  // S3 이미지 목록 로드
  const loadAvailableImages = async () => {
    try {
      const images = await listS3Images('k-life/language_center')
      setAvailableImages(images)
    } catch (error) {
      console.error('이미지 목록 로드 실패:', error)
      message.error('이미지 목록을 불러오는데 실패했습니다.')
    }
  }

  // 이미지 선택
  const handleSelectImage = (imageUrl) => {
    if (currentImageField) {
      if (isAcademyModalVisible) {
        academyForm.setFieldsValue({ [currentImageField]: imageUrl })
      } else if (isCourseModalVisible) {
        // 지도 위치의 map_img_url인 경우
        if (currentImageField.startsWith('map_location_')) {
          const match = currentImageField.match(/map_location_(\d+)_map_img_url/)
          if (match) {
            const index = parseInt(match[1])
            const mapLocations = courseForm.getFieldValue('map_location') || []
            mapLocations[index] = { ...mapLocations[index], map_img_url: imageUrl }
            courseForm.setFieldsValue({ map_location: mapLocations })
          }
        }
        // 상세 HTML URL인 경우
        else if (currentImageField.startsWith('detail_html_')) {
          const lang = currentImageField.replace('detail_html_', '')
          const detailHtml = courseForm.getFieldValue('detail_html') || {}
          detailHtml[lang] = imageUrl
          courseForm.setFieldsValue({ detail_html: detailHtml })
        }
        // 일반 필드인 경우
        else {
          courseForm.setFieldsValue({ [currentImageField]: imageUrl })
        }
      }
    }
    setIsImageModalVisible(false)
    setCurrentImageField(null)
  }

  // 이미지 업로드
  const handleUploadImage = async (file) => {
    setUploadingImage(true)
    try {
      await uploadToS3(file, 'k-life/language_center')
      message.success('이미지가 업로드되었습니다.')
      loadAvailableImages() // 목록 새로고침
    } catch (error) {
      message.error(error.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingImage(false)
    }
    return false // 자동 업로드 방지
  }

  // 이미지 삭제
  const handleDeleteImage = async (image) => {
    try {
      await deleteS3Image(image.key)
      message.success('이미지가 삭제되었습니다.')
      loadAvailableImages() // 목록 새로고침
    } catch (error) {
      message.error(error.message || '이미지 삭제에 실패했습니다.')
    }
  }

  // 어학원 테이블 컬럼
  const academyColumns = [
    {
      title: 'ID',
      dataIndex: 'academy_id',
      key: 'academy_id',
      width: 80,
    },
    {
      title: '이름 (한국어)',
      dataIndex: 'names',
      key: 'names',
      render: (names) => {
        const parsed = typeof names === 'string' ? JSON.parse(names) : names
        return parsed?.ko || '-'
      },
    },
    {
      title: '썸네일',
      dataIndex: 'thumbnail_image_url',
      key: 'thumbnail_image_url',
      width: 100,
      render: (url) => (url ? <Image src={url} width={50} height={50} style={{ objectFit: 'cover' }} /> : '-'),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenAcademyModal(record)}>
            수정
          </Button>
          <Button size="small" onClick={() => setSelectedAcademy(record)}>
            코스 관리
          </Button>
        </Space>
      ),
    },
  ]

  // 결제 내역 테이블 컬럼 (개발 완료 후 주석 해제)
  // const paymentColumns = [
  //   {
  //     title: '결제 ID',
  //     dataIndex: 'payment_id',
  //     key: 'payment_id',
  //     width: 100,
  //   },
  //   {
  //     title: '주문 ID',
  //     dataIndex: 'order_id',
  //     key: 'order_id',
  //     width: 150,
  //     render: (text) => <Typography.Text copyable={{ text }}>{text}</Typography.Text>,
  //   },
  //   {
  //     title: '어학원/코스',
  //     key: 'academy_course',
  //     width: 200,
  //     render: (_, record) => {
  //       const academy = academies.find(a => a.academy_id === record.academy_id)
  //       const course = courses.find(c => c.course_id === record.course_id)
  //       const academyName = academy ? (typeof academy.names === 'string' ? JSON.parse(academy.names)?.ko : academy.names?.ko) : `ID: ${record.academy_id}`
  //       const courseName = course ? (typeof course.names === 'string' ? JSON.parse(course.names)?.ko : course.names?.ko) : `ID: ${record.course_id}`
  //       return (
  //         <div>
  //           <div>{academyName}</div>
  //           <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{courseName}</Typography.Text>
  //         </div>
  //       )
  //     },
  //   },
  //   {
  //     title: '고객 정보',
  //     key: 'customer',
  //     width: 200,
  //     render: (_, record) => (
  //       <div>
  //         <div>{record.customer_name}</div>
  //         <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{record.customer_email}</Typography.Text>
  //       </div>
  //     ),
  //   },
  //   {
  //     title: '결제 금액',
  //     key: 'amount',
  //     width: 150,
  //     render: (_, record) => (
  //       <div>
  //         <Typography.Text strong>
  //           {record.amount?.toLocaleString()} {record.currency}
  //         </Typography.Text>
  //         {record.total_amount && record.total_amount !== record.amount && (
  //           <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
  //             총액: {record.total_amount?.toLocaleString()}
  //           </div>
  //         )}
  //       </div>
  //     ),
  //   },
  //   {
  //     title: '결제 상태',
  //     dataIndex: 'payment_status',
  //     key: 'payment_status',
  //     width: 100,
  //     render: (status) => {
  //       const option = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === status)
  //       return <Tag color={option?.color}>{option?.label || status}</Tag>
  //     },
  //   },
  //   {
  //     title: '결제 수단',
  //     key: 'payment_method',
  //     width: 120,
  //     render: (_, record) => (
  //       <div>
  //         <div>{record.payment_method || '-'}</div>
  //         {record.provider && (
  //           <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
  //             {record.provider}
  //           </Typography.Text>
  //         )}
  //       </div>
  //     ),
  //   },
  //   {
  //     title: '결제 일시',
  //     dataIndex: 'approved_at',
  //     key: 'approved_at',
  //     width: 150,
  //     render: (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
  //   },
  //   {
  //     title: '작업',
  //     key: 'action',
  //     width: 100,
  //     render: (_, record) => (
  //       <Button
  //         size="small"
  //         icon={<EyeOutlined />}
  //         onClick={() => {
  //           setSelectedPayment(record)
  //           setIsPaymentDetailModalVisible(true)
  //         }}
  //       >
  //         상세
  //       </Button>
  //     ),
  //   },
  // ]

  // 코스 테이블 컬럼
  const courseColumns = [
    {
      title: 'ID',
      dataIndex: 'course_id',
      key: 'course_id',
      width: 80,
    },
    {
      title: '이름 (한국어)',
      dataIndex: 'names',
      key: 'names',
      render: (names) => {
        const parsed = typeof names === 'string' ? JSON.parse(names) : names
        return parsed?.ko || '-'
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          RECRUITING: 'blue',
          CLOSED: 'red',
          APPLIED: 'green',
        }
        const labels = {
          RECRUITING: '모집중',
          CLOSED: '마감',
          APPLIED: '지원완료',
        }
        return <Tag color={colors[status]}>{labels[status]}</Tag>
      },
    },
    {
      title: '모집 기간',
      key: 'recruiting_period',
      render: (_, record) => {
        const start = record.recruiting_start_date ? dayjs(record.recruiting_start_date).format('YYYY-MM-DD') : '-'
        const end = record.recruiting_end_date ? dayjs(record.recruiting_end_date).format('YYYY-MM-DD') : '-'
        return `${start} ~ ${end}`
      },
    },
    {
      title: '수업 시작',
      dataIndex: 'class_start_date',
      key: 'class_start_date',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '가격',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (price ? `${price.toLocaleString()}원` : '-'),
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenCourseModal(record)}>
          수정
        </Button>
      ),
    },
  ]

  return (
    <div className="study-abroad">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>어학연수 관리</Title>

          {/* 어학원 목록 */}
          <Card
            title="어학원 목록"
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchAcademies} loading={loading}>
                  새로고침
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenAcademyModal()}>
                  어학원 등록
                </Button>
              </Space>
            }
          >
            <Table
              columns={academyColumns}
              dataSource={academies}
              rowKey="academy_id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({
                onClick: () => setSelectedAcademy(record),
                style: { cursor: 'pointer' },
              })}
              rowClassName={(record) => 
                selectedAcademy?.academy_id === record.academy_id ? 'selected-row' : ''
              }
            />
          </Card>

          {/* 코스 목록 */}
          {selectedAcademy && (
            <Card
              title={`${typeof selectedAcademy.names === 'string' ? JSON.parse(selectedAcademy.names)?.ko : selectedAcademy.names?.ko} - 코스 목록`}
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={() => fetchCourses(selectedAcademy.academy_id)} loading={loading}>
                    새로고침
                  </Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenCourseModal()}>
                    코스 등록
                  </Button>
                </Space>
              }
            >
              <Table
                columns={courseColumns}
                dataSource={courses}
                rowKey="course_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          )}

          {/* 결제 내역 (개발 완료 후 주석 해제) */}
          {/* <Card
            title="결제 내역"
            extra={
              <Button icon={<ReloadOutlined />} onClick={fetchPayments} loading={loading}>
                새로고침
              </Button>
            }
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Select
                    placeholder="어학원 선택"
                    allowClear
                    style={{ width: '100%' }}
                    value={paymentFilters.academy_id}
                    onChange={(value) => {
                      setPaymentFilters({
                        ...paymentFilters,
                        academy_id: value,
                        course_id: null,
                      })
                    }}
                  >
                    {academies.map((academy) => {
                      const name = typeof academy.names === 'string' ? JSON.parse(academy.names)?.ko : academy.names?.ko
                      return (
                        <Option key={academy.academy_id} value={academy.academy_id}>
                          {name || `ID: ${academy.academy_id}`}
                        </Option>
                      )
                    })}
                  </Select>
                </Col>
                <Col span={6}>
                  <Select
                    placeholder="코스 선택"
                    allowClear
                    style={{ width: '100%' }}
                    value={paymentFilters.course_id}
                    onChange={(value) => setPaymentFilters({ ...paymentFilters, course_id: value })}
                    disabled={!paymentFilters.academy_id}
                  >
                    {courses
                      .filter((course) => course.academy_id === paymentFilters.academy_id)
                      .map((course) => {
                        const name = typeof course.names === 'string' ? JSON.parse(course.names)?.ko : course.names?.ko
                        return (
                          <Option key={course.course_id} value={course.course_id}>
                            {name || `ID: ${course.course_id}`}
                          </Option>
                        )
                      })}
                  </Select>
                </Col>
                <Col span={4}>
                  <Select
                    placeholder="결제 상태"
                    allowClear
                    style={{ width: '100%' }}
                    value={paymentFilters.payment_status}
                    onChange={(value) => setPaymentFilters({ ...paymentFilters, payment_status: value })}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <DatePicker
                    placeholder="시작일"
                    style={{ width: '100%' }}
                    value={paymentFilters.start_date}
                    onChange={(date) => setPaymentFilters({ ...paymentFilters, start_date: date })}
                  />
                </Col>
                <Col span={4}>
                  <DatePicker
                    placeholder="종료일"
                    style={{ width: '100%' }}
                    value={paymentFilters.end_date}
                    onChange={(date) => setPaymentFilters({ ...paymentFilters, end_date: date })}
                  />
                </Col>
              </Row>
            </Card>

            <Table
              columns={paymentColumns}
              dataSource={payments}
              rowKey="payment_id"
              loading={loading}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
            />
          </Card> */}

          {/* 어학원 등록/수정 모달 */}
          <Modal
            title={editingAcademy ? '어학원 수정' : '어학원 등록'}
            open={isAcademyModalVisible}
            onCancel={() => setIsAcademyModalVisible(false)}
            footer={null}
            width={800}
            className="academy-modal"
          >
            <Form
              form={academyForm}
              layout="vertical"
              onFinish={handleSaveAcademy}
            >
              {/* 다국어 이름 입력 */}
              <Card title="이름 (다국어)" size="small" style={{ marginBottom: 16 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Form.Item
                    key={lang}
                    label={LANGUAGE_LABELS[lang]}
                    name={['names', lang]}
                    rules={lang === 'ko' ? [{ required: true, message: '한국어 이름은 필수입니다.' }] : []}
                  >
                    <Input placeholder={`${LANGUAGE_LABELS[lang]} 이름`} />
                  </Form.Item>
                ))}
              </Card>

              {/* 다국어 설명 입력 */}
              <Card title="설명 (다국어)" size="small" style={{ marginBottom: 16 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Form.Item
                    key={lang}
                    label={LANGUAGE_LABELS[lang]}
                    name={['descriptions', lang]}
                  >
                    <TextArea rows={2} placeholder={`${LANGUAGE_LABELS[lang]} 설명`} />
                  </Form.Item>
                ))}
              </Card>

              {/* 썸네일 이미지 */}
              <Form.Item label="썸네일 이미지 URL" name="thumbnail_image_url">
                <Input.Group compact>
                  <Input
                    style={{ width: 'calc(100% - 100px)' }}
                    placeholder="이미지 URL을 입력하거나 이미지를 선택하세요"
                    readOnly
                  />
                  <Button onClick={() => handleOpenImageModal('thumbnail_image_url')}>
                    이미지 선택
                  </Button>
                </Input.Group>
              </Form.Item>

              {/* 상태 */}
              <Form.Item label="상태" name="status" initialValue="ACTIVE">
                <Select>
                  {ACADEMY_STATUS_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    {editingAcademy ? '수정' : '등록'}
                  </Button>
                  <Button onClick={() => setIsAcademyModalVisible(false)}>
                    취소
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* 코스 등록/수정 모달 */}
          <Modal
            title={editingCourse ? '코스 수정' : '코스 등록'}
            open={isCourseModalVisible}
            onCancel={() => setIsCourseModalVisible(false)}
            footer={null}
            width={900}
            style={{ top: 20 }}
            bodyStyle={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}
            className="course-modal"
          >
            <Form
              form={courseForm}
              layout="vertical"
              onFinish={handleSaveCourse}
            >
              <Form.Item name="academy_id" hidden>
                <Input />
              </Form.Item>

              {/* 다국어 이름 입력 */}
              <Card title="이름 (다국어)" size="small" style={{ marginBottom: 16 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Form.Item
                    key={lang}
                    label={LANGUAGE_LABELS[lang]}
                    name={['names', lang]}
                    rules={lang === 'ko' ? [{ required: true, message: '한국어 이름은 필수입니다.' }] : []}
                  >
                    <Input placeholder={`${LANGUAGE_LABELS[lang]} 이름`} />
                  </Form.Item>
                ))}
              </Card>

              {/* 이미지 URL */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="로고 URL" name="logo_url">
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 100px)' }}
                        placeholder="로고 이미지 URL"
                      />
                      <Button onClick={() => handleOpenImageModal('logo_url')}>
                        이미지 선택
                      </Button>
                    </Input.Group>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="썸네일 URL" name="thumbnail_url">
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 100px)' }}
                        placeholder="썸네일 이미지 URL"
                      />
                      <Button onClick={() => handleOpenImageModal('thumbnail_url')}>
                        이미지 선택
                      </Button>
                    </Input.Group>
                  </Form.Item>
                </Col>
              </Row>

              {/* 날짜 필드 */}
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="모집 시작일" name="recruiting_start_date">
                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="모집 종료일" name="recruiting_end_date">
                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="수업 시작일" name="class_start_date">
                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                  </Form.Item>
                </Col>
              </Row>

              {/* 기타 필드 */}
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="기간" name="duration">
                    <Input placeholder="예: 8weeks" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="수업 시간" name="class_time">
                    <Input placeholder="예: 10:00~11:30 KST" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="가격" name="price">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="가격 (원)"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* 태그 */}
              <Form.Item label="태그" name="tags">
                <Select mode="tags" placeholder="태그를 입력하세요">
                  <Option value="November class">November class</Option>
                  <Option value="Morning">Morning</Option>
                  <Option value="Evening">Evening</Option>
                </Select>
              </Form.Item>

              {/* 지역 (다국어) */}
              <Card title="지역 (다국어)" size="small" style={{ marginBottom: 16 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Form.Item
                    key={lang}
                    label={LANGUAGE_LABELS[lang]}
                    name={['regions', lang]}
                  >
                    <Select mode="tags" placeholder={`${LANGUAGE_LABELS[lang]} 지역`} />
                  </Form.Item>
                ))}
              </Card>

              {/* 수업 일정 (다국어) */}
              <Card title="수업 일정 (다국어)" size="small" style={{ marginBottom: 16 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Form.Item
                    key={lang}
                    label={LANGUAGE_LABELS[lang]}
                    name={['schedule_days', lang]}
                  >
                    <Input placeholder={`${LANGUAGE_LABELS[lang]} 예: 월 & 수`} />
                  </Form.Item>
                ))}
              </Card>

              {/* 지도 위치 (배열) */}
              <Form.List name="map_location">
                {(fields, { add, remove }) => (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Typography.Text strong>지도 위치</Typography.Text>
                      <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                        위치 추가
                      </Button>
                    </div>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        style={{ marginBottom: 16 }}
                        extra={
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            삭제
                          </Button>
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              label="지점명"
                              name={[name, 'region_name']}
                              rules={[{ required: true, message: '지점명을 입력하세요' }]}
                            >
                              <Input placeholder="예: 강남점" />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              label="주소"
                              name={[name, 'address']}
                              rules={[{ required: true, message: '주소를 입력하세요' }]}
                            >
                              <Input placeholder="예: 서울특별시 강남구..." />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              label="위도 (lat)"
                              name={[name, 'lat']}
                              rules={[{ required: true, message: '위도를 입력하세요' }]}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                placeholder="예: 37.497318"
                                step={0.000001}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              label="경도 (lng)"
                              name={[name, 'lng']}
                              rules={[{ required: true, message: '경도를 입력하세요' }]}
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                placeholder="예: 127.031476"
                                step={0.000001}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              {...restField}
                              label="지도 이미지 URL"
                              name={[name, 'map_img_url']}
                            >
                              <Input.Group compact>
                                <Input
                                  style={{ width: 'calc(100% - 100px)' }}
                                  placeholder="지도 이미지 URL"
                                />
                                <Button onClick={() => handleOpenImageModal(`map_location_${name}_map_img_url`)}>
                                  이미지 선택
                                </Button>
                              </Input.Group>
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    {fields.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #d9d9d9', borderRadius: '4px' }}>
                        <Typography.Text type="secondary">지도 위치가 없습니다. "위치 추가" 버튼을 클릭하여 추가하세요.</Typography.Text>
                      </div>
                    )}
                  </div>
                )}
              </Form.List>

              {/* 상세 HTML (다국어 URL) */}
              <Card title="상세 HTML URL (다국어)" size="small" style={{ marginBottom: 16 }}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <Form.Item
                    key={lang}
                    label={LANGUAGE_LABELS[lang]}
                    name={['detail_html', lang]}
                  >
                    <Input.Group compact>
                      <Input
                        style={{ width: 'calc(100% - 100px)' }}
                        placeholder={`${LANGUAGE_LABELS[lang]} 상세 HTML URL`}
                      />
                      <Button onClick={() => handleOpenImageModal(`detail_html_${lang}`)}>
                        이미지 선택
                      </Button>
                    </Input.Group>
                  </Form.Item>
                ))}
              </Card>

              {/* 상태 */}
              <Form.Item label="상태" name="status" initialValue="RECRUITING">
                <Select>
                  {COURSE_STATUS_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    {editingCourse ? '수정' : '등록'}
                  </Button>
                  <Button onClick={() => setIsCourseModalVisible(false)}>
                    취소
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>

          {/* 이미지 선택 모달 */}
          <Modal
            title="이미지 선택"
            open={isImageModalVisible}
            onCancel={() => setIsImageModalVisible(false)}
            footer={null}
            width={900}
            className="image-select-modal"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 업로드 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Upload
                  beforeUpload={handleUploadImage}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploadingImage}>
                    이미지 업로드
                  </Button>
                </Upload>
                <Button icon={<ReloadOutlined />} onClick={loadAvailableImages}>
                  새로고침
                </Button>
              </div>

              {/* 이미지 목록 */}
              <Row gutter={[16, 16]}>
                {availableImages.map((image) => (
                  <Col key={image.key} xs={12} sm={8} md={6}>
                    <div
                      className="image-item"
                      style={{
                        position: 'relative',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        padding: '8px',
                      }}
                    >
                      <div
                        onClick={() => handleSelectImage(image.url)}
                        style={{
                          cursor: 'pointer',
                        }}
                      >
                        <Image src={image.url} alt={image.fileName} preview={false} />
                        <div style={{ marginTop: '8px', fontSize: '12px', wordBreak: 'break-all' }}>
                          {image.fileName}
                        </div>
                      </div>
                      <Popconfirm
                        title="이미지를 삭제하시겠습니까?"
                        onConfirm={() => handleDeleteImage(image)}
                        okText="삭제"
                        cancelText="취소"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(255, 255, 255, 0.9)',
                          }}
                        />
                      </Popconfirm>
                    </div>
                  </Col>
                ))}
              </Row>
            </Space>
          </Modal>

          {/* 결제 상세 정보 모달 (개발 완료 후 주석 해제) */}
          {/* <Modal
            title="결제 상세 정보"
            open={isPaymentDetailModalVisible}
            onCancel={() => setIsPaymentDetailModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setIsPaymentDetailModalVisible(false)}>
                닫기
              </Button>,
            ]}
            width={800}
          >
            {selectedPayment && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Typography.Text strong>결제 ID:</Typography.Text>
                    <div>{selectedPayment.payment_id}</div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>주문 ID:</Typography.Text>
                    <div>
                      <Typography.Text copyable={{ text: selectedPayment.order_id }}>
                        {selectedPayment.order_id}
                      </Typography.Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>주문명:</Typography.Text>
                    <div>{selectedPayment.order_name}</div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>결제 상태:</Typography.Text>
                    <div>
                      {(() => {
                        const option = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === selectedPayment.payment_status)
                        return <Tag color={option?.color}>{option?.label || selectedPayment.payment_status}</Tag>
                      })()}
                    </div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>결제 유형:</Typography.Text>
                    <div>{selectedPayment.payment_type}</div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>결제 수단:</Typography.Text>
                    <div>{selectedPayment.payment_method || '-'}</div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>통화:</Typography.Text>
                    <div>{selectedPayment.currency}</div>
                  </Col>
                  <Col span={12}>
                    <Typography.Text strong>결제 금액:</Typography.Text>
                    <div>
                      <Typography.Text strong>
                        {selectedPayment.amount?.toLocaleString()} {selectedPayment.currency}
                      </Typography.Text>
                    </div>
                  </Col>
                  {selectedPayment.total_amount && (
                    <>
                      <Col span={12}>
                        <Typography.Text strong>총 금액:</Typography.Text>
                        <div>{selectedPayment.total_amount?.toLocaleString()}</div>
                      </Col>
                      <Col span={12}>
                        <Typography.Text strong>공급가액:</Typography.Text>
                        <div>{selectedPayment.supplied_amount?.toLocaleString()}</div>
                      </Col>
                      <Col span={12}>
                        <Typography.Text strong>부가세:</Typography.Text>
                        <div>{selectedPayment.vat?.toLocaleString()}</div>
                      </Col>
                      <Col span={12}>
                        <Typography.Text strong>면세 금액:</Typography.Text>
                        <div>{selectedPayment.tax_free_amount?.toLocaleString()}</div>
                      </Col>
                    </>
                  )}
                  <Col span={24}>
                    <Typography.Text strong>고객 정보:</Typography.Text>
                    <div>
                      <div>이름: {selectedPayment.customer_name}</div>
                      <div>이메일: {selectedPayment.customer_email}</div>
                      {selectedPayment.customer_mobile_phone && (
                        <div>휴대폰: {selectedPayment.customer_mobile_phone}</div>
                      )}
                    </div>
                  </Col>
                  {selectedPayment.provider && (
                    <Col span={12}>
                      <Typography.Text strong>결제사:</Typography.Text>
                      <div>{selectedPayment.provider}</div>
                    </Col>
                  )}
                  {selectedPayment.card_company && (
                    <Col span={12}>
                      <Typography.Text strong>카드사:</Typography.Text>
                      <div>{selectedPayment.card_company}</div>
                    </Col>
                  )}
                  {selectedPayment.card_number && (
                    <Col span={12}>
                      <Typography.Text strong>카드번호:</Typography.Text>
                      <div>{selectedPayment.card_number}</div>
                    </Col>
                  )}
                  {selectedPayment.installment_months && (
                    <Col span={12}>
                      <Typography.Text strong>할부 개월:</Typography.Text>
                      <div>{selectedPayment.installment_months}개월</div>
                    </Col>
                  )}
                  {selectedPayment.approve_no && (
                    <Col span={12}>
                      <Typography.Text strong>승인번호:</Typography.Text>
                      <div>{selectedPayment.approve_no}</div>
                    </Col>
                  )}
                  {selectedPayment.receipt_url && (
                    <Col span={24}>
                      <Typography.Text strong>영수증 URL:</Typography.Text>
                      <div>
                        <a href={selectedPayment.receipt_url} target="_blank" rel="noopener noreferrer">
                          {selectedPayment.receipt_url}
                        </a>
                      </div>
                    </Col>
                  )}
                  {selectedPayment.requested_at && (
                    <Col span={12}>
                      <Typography.Text strong>결제 요청 시각:</Typography.Text>
                      <div>{dayjs(selectedPayment.requested_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    </Col>
                  )}
                  {selectedPayment.approved_at && (
                    <Col span={12}>
                      <Typography.Text strong>결제 승인 시각:</Typography.Text>
                      <div>{dayjs(selectedPayment.approved_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    </Col>
                  )}
                  {selectedPayment.cancelled_at && (
                    <Col span={12}>
                      <Typography.Text strong>결제 취소 시각:</Typography.Text>
                      <div>{dayjs(selectedPayment.cancelled_at).format('YYYY-MM-DD HH:mm:ss')}</div>
                    </Col>
                  )}
                  {selectedPayment.failure_code && (
                    <Col span={12}>
                      <Typography.Text strong>실패 코드:</Typography.Text>
                      <div>{selectedPayment.failure_code}</div>
                    </Col>
                  )}
                  {selectedPayment.failure_message && (
                    <Col span={24}>
                      <Typography.Text strong>실패 메시지:</Typography.Text>
                      <div>{selectedPayment.failure_message}</div>
                    </Col>
                  )}
                  {selectedPayment.payment_key && (
                    <Col span={24}>
                      <Typography.Text strong>결제 키:</Typography.Text>
                      <div>
                        <Typography.Text copyable={{ text: selectedPayment.payment_key }} style={{ wordBreak: 'break-all' }}>
                          {selectedPayment.payment_key}
                        </Typography.Text>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}
          </Modal> */}
        </Space>
      </Card>
    </div>
  )
}

export default StudyAbroad
