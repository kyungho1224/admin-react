import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Table, Typography, message, Space, Button, Modal, Form, Input, DatePicker, Select } from 'antd'
import { PlusOutlined, ReloadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getGameData, createGameData, exportGameData } from '../services/api'
import { getGameTypeByKey } from '../constants/gameTypes'
import './GameDataManagement.css'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

function GameDataDetail() {
  const { gameType } = useParams()
  const [loading, setLoading] = useState(false)
  const [gameData, setGameData] = useState([])
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isExportModalVisible, setIsExportModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [exportForm] = Form.useForm()

  const gameInfo = getGameTypeByKey(gameType)

  // 게임 데이터 목록 조회
  const fetchGameData = async () => {
    if (!gameType) return
    
    setLoading(true)
    try {
      // TODO: API 연동
      // const data = await getGameData(gameType)
      // setGameData(data || [])
      message.info(`${gameInfo?.label || '게임'} 데이터 목록 조회 기능은 준비 중입니다.`)
      setGameData([])
    } catch (error) {
      console.error('게임 데이터 조회 실패:', error)
      message.error('게임 데이터 목록을 불러오는데 실패했습니다.')
      setGameData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGameData()
  }, [gameType])

  // 게임 데이터 추가
  const handleAdd = async (values) => {
    if (!gameType) return

    try {
      // TODO: API 연동
      // await createGameData(gameType, values)
      message.success('게임 데이터가 추가되었습니다.')
      setIsAddModalVisible(false)
      form.resetFields()
      fetchGameData()
    } catch (error) {
      console.error('게임 데이터 추가 실패:', error)
      message.error(error.message || '게임 데이터 추가에 실패했습니다.')
    }
  }

  // 게임 데이터 내보내기
  const handleExport = async (values) => {
    if (!gameType) return

    try {
      const exportOptions = {
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        format: values.format,
      }

      // TODO: API 연동
      // const result = await exportGameData(gameType, exportOptions)
      // 파일 다운로드 처리
      message.success('게임 데이터 내보내기가 완료되었습니다.')
      setIsExportModalVisible(false)
      exportForm.resetFields()
    } catch (error) {
      console.error('게임 데이터 내보내기 실패:', error)
      message.error(error.message || '게임 데이터 내보내기에 실패했습니다.')
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
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: '내용',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
    },
    {
      title: '생성일',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              // TODO: 수정 기능 구현
              message.info('수정 기능은 준비 중입니다.')
            }}
          >
            수정
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              // TODO: 삭제 기능 구현
              message.info('삭제 기능은 준비 중입니다.')
            }}
          >
            삭제
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="game-data-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          {gameInfo?.label || '게임'} 데이터 관리
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
          >
            데이터 추가
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={() => setIsExportModalVisible(true)}
          >
            내보내기
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchGameData} loading={loading}>
            새로고침
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={gameData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
        />
      </Card>

      {/* 데이터 추가 모달 */}
      <Modal
        title={`${gameInfo?.label || '게임'} 데이터 추가`}
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdd}
        >
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요' }]}
          >
            <Input placeholder="제목을 입력하세요" />
          </Form.Item>

          <Form.Item
            name="content"
            label="내용"
            rules={[{ required: true, message: '내용을 입력해주세요' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="내용을 입력하세요"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                추가
              </Button>
              <Button onClick={() => {
                setIsAddModalVisible(false)
                form.resetFields()
              }}>
                취소
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 데이터 내보내기 모달 */}
      <Modal
        title={`${gameInfo?.label || '게임'} 데이터 내보내기`}
        open={isExportModalVisible}
        onCancel={() => {
          setIsExportModalVisible(false)
          exportForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            dateRange: [dayjs().subtract(7, 'day'), dayjs()],
            format: 'csv',
          }}
        >
          <Form.Item
            name="dateRange"
            label="기간 선택"
            rules={[{ required: true, message: '기간을 선택해주세요' }]}
          >
            <RangePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="format"
            label="파일 형식"
            rules={[{ required: true, message: '파일 형식을 선택해주세요' }]}
          >
            <Select placeholder="파일 형식 선택">
              <Option value="csv">CSV</Option>
              <Option value="excel">Excel</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<DownloadOutlined />}
              >
                내보내기
              </Button>
              <Button onClick={() => {
                setIsExportModalVisible(false)
                exportForm.resetFields()
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

export default GameDataDetail

