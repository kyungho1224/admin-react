import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Typography, message, Tag, Select, Image, Modal, Form, Input, Switch, InputNumber, Row, Col } from 'antd'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import { getGameRules, updateGame } from '../services/api'
import './GameManagement.css'

const { Title } = Typography
const { Option } = Select

// 학습 수준 옵션
const TAG_OPTIONS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Basic' },
  { value: 3, label: 'TOPIK' },
]

function GameManagement() {
  const [loading, setLoading] = useState(false)
  const [games, setGames] = useState([])
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingGame, setEditingGame] = useState(null)
  const [form] = Form.useForm()

  // 게임 목록 조회
  const fetchGames = async () => {
    setLoading(true)
    try {
      const data = await getGameRules()
      setGames(data || [])
    } catch (error) {
      console.error('게임 조회 실패:', error)
      message.error('게임 목록을 불러오는데 실패했습니다.')
      setGames([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  // 게임 수정 모달 열기
  const handleEdit = (record) => {
    setEditingGame(record)
    
    // screen_images 배열을 문자열로 변환 (쉼표로 구분)
    const screenImagesStr = Array.isArray(record.screen_images) 
      ? record.screen_images.join(', ') 
      : ''
    
    // 폼에 기존 데이터 채우기
    form.setFieldsValue({
      tag_id: record.tag_id,
      title: record.title,
      screen_images: screenImagesStr,
      init_seconds: record.init_seconds,
      sec_of_revive: record.sec_of_revive,
      is_unlimited: record.is_unlimited === 1,
      limit_count: record.limit_count,
      cost_item_amount: record.cost_item_amount,
      sec_of_correct_answer: record.sec_of_correct_answer,
      sec_of_penalty: record.sec_of_penalty,
      score_per_question: record.score_per_question,
      experience_per_question: record.experience_per_question,
    })
    
    setIsEditModalVisible(true)
  }

  // 게임 수정
  const handleUpdate = async (values) => {
    if (!editingGame) return

    try {
      // screen_images 문자열을 배열로 변환
      let screenImages = []
      if (values.screen_images && typeof values.screen_images === 'string') {
        screenImages = values.screen_images
          .split(',')
          .map(url => url.trim())
          .filter(url => url.length > 0)
      } else if (Array.isArray(values.screen_images)) {
        screenImages = values.screen_images
      }

      // is_unlimited를 0 또는 1로 변환
      const updateData = {
        tag_id: values.tag_id,
        title: values.title,
        screen_images: screenImages,
        init_seconds: values.init_seconds,
        sec_of_revive: values.sec_of_revive,
        is_unlimited: values.is_unlimited ? 1 : 0,
        limit_count: values.limit_count,
        cost_item_amount: values.cost_item_amount,
        sec_of_correct_answer: values.sec_of_correct_answer,
        sec_of_penalty: values.sec_of_penalty,
        score_per_question: values.score_per_question,
        experience_per_question: values.experience_per_question,
      }
      
      await updateGame(editingGame.game_id, updateData)
      message.success('게임 정보가 수정되었습니다.')
      setIsEditModalVisible(false)
      setEditingGame(null)
      form.resetFields()
      fetchGames()
    } catch (error) {
      console.error('게임 수정 실패:', error)
      message.error(error.message || '게임 수정에 실패했습니다.')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'game_id',
      key: 'game_id',
      width: 50,
    },
    {
      title: '학습 수준',
      dataIndex: 'tag_label',
      key: 'tag_label',
      width: 100,
      render: (label, record) => (
        <Tag color={record.tag_id === 1 ? 'green' : record.tag_id === 2 ? 'blue' : 'red'}>
          {label}
        </Tag>
      ),
    },
    {
      title: '게임 제목',
      dataIndex: 'title',
      key: 'title',
      width: 100,
    },
    {
      title: '썸네일',
      key: 'thumbnail',
      width: 120,
      render: (_, record) => {
        if (record.screen_images && record.screen_images.length > 0) {
          return (
            <Image
              width={80}
              height={80}
              src={record.screen_images[0]}
              alt="썸네일"
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
      title: '시작 시간',
      dataIndex: 'init_seconds',
      key: 'init_seconds',
      width: 100,
      render: (seconds) => `${seconds}초`,
    },
    {
      title: '부활 시간',
      dataIndex: 'sec_of_revive',
      key: 'sec_of_revive',
      width: 100,
      render: (seconds) => `${seconds}초`,
    },
    {
      title: '무제한',
      dataIndex: 'is_unlimited',
      key: 'is_unlimited',
      width: 100,
      render: (isUnlimited) => (
        <Tag color={isUnlimited === 1 ? 'success' : 'default'}>
          {isUnlimited === 1 ? '무제한' : '제한'}
        </Tag>
      ),
    },
    {
      title: '일일 횟수',
      dataIndex: 'limit_count',
      key: 'limit_count',
      width: 100,
      render: (count) => count || '-',
    },
    {
      title: '포인트',
      dataIndex: 'score_per_question',
      key: 'score_per_question',
      width: 100,
    },
    {
      title: '경험치',
      dataIndex: 'experience_per_question',
      key: 'experience_per_question',
      width: 100,
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          수정
        </Button>
      ),
    },
  ]

  return (
    <div className="game-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          게임 관리
        </Title>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={games}
          loading={loading}
          rowKey="game_id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* 게임 수정 모달 */}
      <Modal
        title="게임 정보 수정"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          setEditingGame(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tag_id"
                label="학습 수준"
                rules={[{ required: true, message: '학습 수준을 선택해주세요' }]}
              >
                <Select placeholder="학습 수준 선택">
                  {TAG_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="게임 제목"
                rules={[{ required: true, message: '게임 제목을 입력해주세요' }]}
              >
                <Input placeholder="게임 제목" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="screen_images"
            label="썸네일 이미지 URL"
            tooltip="이미지 URL을 쉼표로 구분하여 입력하세요"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="https://example.com/image1.png, https://example.com/image2.png"
            />
          </Form.Item>

          <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>게임 규칙</Title>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="init_seconds"
                label="게임 시작 시간 (초)"
                rules={[{ required: true, message: '게임 시작 시간을 입력해주세요' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sec_of_revive"
                label="부활 시간 (초)"
                rules={[{ required: true, message: '부활 시간을 입력해주세요' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="is_unlimited"
                label="무제한 가능"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.is_unlimited !== currentValues.is_unlimited
                }
              >
                {({ getFieldValue }) => {
                  const isUnlimited = getFieldValue('is_unlimited')
                  return (
                    <Form.Item
                      name="limit_count"
                      label="일일 가능 횟수"
                      rules={[
                        {
                          required: !isUnlimited,
                          message: '일일 가능 횟수를 입력해주세요',
                        },
                      ]}
                    >
                      <InputNumber 
                        min={0} 
                        style={{ width: '100%' }} 
                        disabled={isUnlimited}
                        placeholder={isUnlimited ? '무제한 모드' : '일일 가능 횟수'}
                      />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cost_item_amount"
                label="아이템 필요 수량"
                rules={[{ required: true, message: '아이템 필요 수량을 입력해주세요' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sec_of_correct_answer"
                label="정답 시 추가 시간 (초)"
                rules={[{ required: true, message: '정답 시 추가 시간을 입력해주세요' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sec_of_penalty"
                label="오답 시 차감 시간 (초)"
                rules={[{ required: true, message: '오답 시 차감 시간을 입력해주세요' }]}
                tooltip="음수 값 가능 (예: -10)"
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="score_per_question"
                label="문제당 포인트"
                rules={[{ required: true, message: '문제당 포인트를 입력해주세요' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="experience_per_question"
            label="문제당 경험치"
            rules={[{ required: true, message: '문제당 경험치를 입력해주세요' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                수정
              </Button>
              <Button onClick={() => {
                setIsEditModalVisible(false)
                setEditingGame(null)
                form.resetFields()
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GameManagement

