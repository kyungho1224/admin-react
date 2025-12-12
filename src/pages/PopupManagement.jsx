import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Space, Typography, message, Tag, Select, Image, Modal, Form, Input, Switch, DatePicker, InputNumber, Carousel, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PictureOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPopupsByScreen, createPopup } from '../services/api'
import { listS3Images } from '../services/s3Upload'
import './PopupManagement.css'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

// 화면 목록 (필요에 따라 추가)
const SCREEN_OPTIONS = [
  { value: 'ranking', label: '랭킹' },
  { value: 'home', label: '홈' },
  // 필요시 추가
]

function PopupManagement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [popups, setPopups] = useState([])
  const [selectedScreen, setSelectedScreen] = useState('ranking')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false)
  const [isImageSelectModalVisible, setIsImageSelectModalVisible] = useState(false)
  const [previewSlides, setPreviewSlides] = useState([])
  const [availableImages, setAvailableImages] = useState([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [currentImageField, setCurrentImageField] = useState(null) // 현재 이미지를 선택할 슬라이드 필드
  const [form] = Form.useForm()

  // 팝업 목록 조회
  const fetchPopups = async (screen) => {
    setLoading(true)
    try {
      const data = await getPopupsByScreen(screen)
      
      // 응답 구조에 따라 팝업 목록 구성
      const popupList = []
      
      // SINGLE 팝업들 추가
      if (data.singles && data.singles.length > 0) {
        data.singles.forEach(popup => {
          popupList.push({
            ...popup,
            screen: screen,
            displayType: 'SINGLE'
          })
        })
      }
      
      // MULTI 팝업 추가
      if (data.multi) {
        popupList.push({
          ...data.multi,
          screen: screen,
          displayType: 'MULTI'
        })
      }
      
      setPopups(popupList)
    } catch (error) {
      console.error('팝업 조회 실패:', error)
      message.error('팝업 목록을 불러오는데 실패했습니다.')
      setPopups([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPopups(selectedScreen)
  }, [selectedScreen])

  // 이미지 목록 조회
  const fetchAvailableImages = async () => {
    setLoadingImages(true)
    try {
      const imageList = await listS3Images('image/popup')
      setAvailableImages(imageList)
    } catch (error) {
      console.error('이미지 목록 조회 실패:', error)
      message.error('이미지 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoadingImages(false)
    }
  }

  // 이미지 선택 모달 열기
  const openImageSelectModal = (fieldName) => {
    setCurrentImageField(fieldName)
    setIsImageSelectModalVisible(true)
    fetchAvailableImages()
  }

  // 이미지 선택
  const handleImageSelect = (imageUrl) => {
    if (currentImageField !== null) {
      form.setFieldValue(['slides', currentImageField, 'image_url'], imageUrl)
      setIsImageSelectModalVisible(false)
      setCurrentImageField(null)
      message.success('이미지가 선택되었습니다.')
    }
  }

  // 팝업 생성
  const handleCreate = async (values) => {
    try {
      // 날짜 변환 (dayjs 객체를 ISO 문자열로)
      const popupData = {
        popup_type: values.popup_type,
        is_active: values.is_active,
        start_at: values.start_at ? values.start_at.toISOString() : null,
        end_at: values.end_at ? values.end_at.toISOString() : null,
        screen_key: selectedScreen,
        priority: values.priority,
        slides: (values.slides || []).map(slide => ({
          sort_order: slide.sort_order,
          image_url: slide.image_url,
          title: slide.title || null,
          body: slide.body || null,
          link_type: slide.link_type || null,
          link_target: slide.link_target || null,
        })),
      }
      
      await createPopup(popupData)
      message.success('팝업이 생성되었습니다.')
      setIsModalVisible(false)
      form.resetFields()
      fetchPopups(selectedScreen)
    } catch (error) {
      console.error('팝업 생성 실패:', error)
      message.error(error.message || '팝업 생성에 실패했습니다.')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '타입',
      dataIndex: 'popup_type',
      key: 'popup_type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'MULTI' ? 'blue' : 'green'}>
          {type === 'MULTI' ? '멀티' : '싱글'}
        </Tag>
      ),
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
      title: '대표 이미지',
      key: 'thumbnail',
      width: 120,
      render: (_, record) => {
        if (record.slides && record.slides.length > 0) {
          const firstSlide = record.slides.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0]
          return (
            <Image
              width={80}
              height={80}
              src={firstSlide.image_url}
              alt="대표 이미지"
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={{
                mask: <EyeOutlined />,
              }}
            />
          )
        }
        return '-'
      },
    },
    {
      title: '슬라이드 수',
      key: 'slideCount',
      width: 100,
      render: (_, record) => record.slides?.length || 0,
    },
    {
      title: '시작일',
      dataIndex: 'start_at',
      key: 'start_at',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '종료일',
      dataIndex: 'end_at',
      key: 'end_at',
      width: 120,
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '미리보기',
      key: 'preview',
      width: 100,
      render: (_, record) => {
        if (record.slides && record.slides.length > 0) {
          return (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setPreviewSlides(record.slides)
                setIsPreviewModalVisible(true)
              }}
            >
              보기 ({record.slides.length})
            </Button>
          )
        }
        return '-'
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: () => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => message.info('수정 기능은 준비 중입니다.')}
          >
            수정
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => message.info('삭제 기능은 준비 중입니다.')}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="popup-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={2} style={{ margin: 0 }}>
            팝업 관리
          </Title>
          <Select
            value={selectedScreen}
            onChange={setSelectedScreen}
            style={{ width: 150 }}
          >
            {SCREEN_OPTIONS.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
        >
          팝업 추가
        </Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={popups}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* 팝업 생성 모달 */}
      <Modal
        title="팝업 생성"
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
          initialValues={{
            popup_type: 'SINGLE',
            is_active: true,
            priority: 1,
            slides: [{ sort_order: 1 }],
          }}
        >
          <Form.Item
            name="popup_type"
            label="팝업 타입"
            rules={[{ required: true, message: '팝업 타입을 선택해주세요' }]}
          >
            <Select>
              <Option value="SINGLE">싱글</Option>
              <Option value="MULTI">멀티</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="활성 상태"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="start_at"
            label="시작일"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="end_at"
            label="종료일"
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="priority"
            label="우선순위"
            rules={[{ required: true, message: '우선순위를 입력해주세요' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.List name="slides">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    title={`슬라이드 ${index + 1}`}
                    extra={
                      fields.length > 1 && (
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          삭제
                        </Button>
                      )
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, 'sort_order']}
                      label="순서"
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'image_url']}
                      label="이미지"
                      rules={[{ required: true, message: '이미지를 선택해주세요' }]}
                    >
                      <div>
                        {form.getFieldValue(['slides', field.name, 'image_url']) ? (
                          <div style={{ marginBottom: 8 }}>
                            <Image
                              src={form.getFieldValue(['slides', field.name, 'image_url'])}
                              alt="선택된 이미지"
                              width={200}
                              height={200}
                              style={{ objectFit: 'cover', borderRadius: 4 }}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Button
                                type="link"
                                onClick={() => {
                                  form.setFieldValue(['slides', field.name, 'image_url'], undefined)
                                }}
                              >
                                이미지 제거
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="dashed"
                            icon={<PictureOutlined />}
                            onClick={() => openImageSelectModal(field.name)}
                            style={{ width: '100%', height: 200 }}
                          >
                            이미지 선택
                          </Button>
                        )}
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
                          이미지 관리에서 업로드된 이미지를 선택할 수 있습니다.
                        </div>
                      </div>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'title']}
                      label="제목"
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'body']}
                      label="본문"
                    >
                      <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'link_type']}
                      label="링크 타입"
                    >
                      <Select placeholder="선택">
                        <Option value="IN_APP">앱 내부</Option>
                        <Option value="EXTERNAL">외부 링크</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, 'link_target']}
                      label="링크 타겟"
                    >
                      <Input placeholder="route 또는 URL" />
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ sort_order: fields.length + 1 })}
                  block
                  style={{ marginBottom: 16 }}
                >
                  슬라이드 추가
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                생성
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

      {/* 슬라이드 미리보기 모달 */}
      <Modal
        title="슬라이드 미리보기"
        open={isPreviewModalVisible}
        onCancel={() => setIsPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsPreviewModalVisible(false)}>
            닫기
          </Button>
        ]}
        width={800}
        centered
      >
        {previewSlides.length > 0 && (
          <Carousel autoplay={false} dots>
            {previewSlides
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((slide, index) => (
                <div key={slide.id || index}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Image
                      src={slide.image_url}
                      alt={`슬라이드 ${index + 1}`}
                      style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                      preview={false}
                    />
                    {(slide.title || slide.body) && (
                      <div style={{ marginTop: 16, padding: '0 20px' }}>
                        {slide.title && (
                          <Typography.Title level={4} style={{ marginBottom: 8 }}>
                            {slide.title}
                          </Typography.Title>
                        )}
                        {slide.body && (
                          <Typography.Paragraph>{slide.body}</Typography.Paragraph>
                        )}
                      </div>
                    )}
                    <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: '12px' }}>
                      슬라이드 {index + 1} / {previewSlides.length}
                    </div>
                  </div>
                </div>
              ))}
          </Carousel>
        )}
      </Modal>

      {/* 이미지 선택 모달 */}
      <Modal
        title="이미지 선택"
        open={isImageSelectModalVisible}
        onCancel={() => {
          setIsImageSelectModalVisible(false)
          setCurrentImageField(null)
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsImageSelectModalVisible(false)
            setCurrentImageField(null)
          }}>
            취소
          </Button>,
        ]}
        width={900}
        centered
      >
        {loadingImages ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            이미지 목록을 불러오는 중...
          </div>
        ) : availableImages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            업로드된 이미지가 없습니다.
            <div style={{ marginTop: 16 }}>
              <Button
                type="link"
                onClick={() => {
                  setIsImageSelectModalVisible(false)
                  setCurrentImageField(null)
                  navigate('/images')
                }}
              >
                이미지 관리 페이지에서 업로드하기
              </Button>
            </div>
          </div>
        ) : (
          <Row gutter={[16, 16]} style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {availableImages.map((image) => (
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
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Meta
                    title={
                      <Typography.Text ellipsis style={{ width: '100%', display: 'block', fontSize: '12px' }}>
                        {image.fileName}
                      </Typography.Text>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Modal>
    </div>
  )
}

export default PopupManagement
