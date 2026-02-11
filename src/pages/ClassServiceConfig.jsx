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
  InputNumber,
  Switch,
} from 'antd'
import {
  EditOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import {
  getServiceConfigs,
  updateServiceConfig,
} from '../services/api'
import './ClassReservation.css'

const { Title, Text } = Typography
const { TextArea } = Input

function ClassServiceConfig() {
  const [configForm] = Form.useForm()

  // 상태 관리
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState([])
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)

  // 설정 목록 조회
  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const data = await getServiceConfigs()
      setConfigs(data?.items || data || [])
    } catch (error) {
      console.error('설정 목록 조회 실패:', error)
      message.error(error.message || '설정 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  // 설정 수정
  const handleConfigSubmit = async (values) => {
    if (!editingConfig) return

    setLoading(true)
    try {
      // 데이터 타입에 따라 값 변환
      let configValue = values.config_value
      if (editingConfig.data_type === 'boolean') {
        configValue = configValue ? 'true' : 'false'
      } else if (editingConfig.data_type === 'integer') {
        configValue = String(Math.floor(configValue))
      } else if (editingConfig.data_type === 'decimal') {
        configValue = String(configValue)
      } else {
        configValue = String(configValue)
      }

      await updateServiceConfig(
        editingConfig.id,
        configValue,
        values.description
      )
      message.success('설정이 수정되었습니다.')
      setIsEditModalVisible(false)
      configForm.resetFields()
      setEditingConfig(null)
      fetchConfigs()
    } catch (error) {
      console.error('설정 수정 실패:', error)
      message.error(error.message || '설정 수정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }


  // 설정값 표시 (데이터 타입에 따라)
  const formatConfigValue = (value, dataType) => {
    if (value === null || value === undefined) return '-'
    
    switch (dataType) {
      case 'boolean':
        return value === 'true' || value === '1' || value === true ? '활성' : '비활성'
      default:
        return String(value)
    }
  }

  // 설정 테이블 컬럼
  const configColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '설정 키',
      dataIndex: 'config_key',
      key: 'config_key',
      width: 200,
      render: (key) => <Text strong>{key}</Text>,
    },
    {
      title: '설정 값',
      dataIndex: 'config_value',
      key: 'config_value',
      width: 150,
      render: (value, record) => (
        <Text>{formatConfigValue(value, record.data_type)}</Text>
      ),
    },
    {
      title: '데이터 타입',
      dataIndex: 'data_type',
      key: 'data_type',
      width: 120,
      render: (type) => {
        const typeMap = {
          string: { color: 'blue', text: '문자열' },
          integer: { color: 'green', text: '정수' },
          decimal: { color: 'orange', text: '소수' },
          boolean: { color: 'purple', text: '불린' },
        }
        const typeInfo = typeMap[type] || { color: 'default', text: type }
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>
      },
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
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
      title: '작업',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingConfig(record)
            // 데이터 타입에 따라 초기값 설정
            let initialValue = record.config_value
            if (record.data_type === 'boolean') {
              initialValue = initialValue === 'true' || initialValue === '1' || initialValue === true
            } else if (record.data_type === 'integer') {
              initialValue = parseInt(initialValue, 10) || 0
            } else if (record.data_type === 'decimal') {
              initialValue = parseFloat(initialValue) || 0
            }
            
            configForm.setFieldsValue({
              config_value: initialValue,
              description: record.description || '',
            })
            setIsEditModalVisible(true)
          }}
        >
          수정
        </Button>
      ),
    },
  ]

  return (
    <div className="class-service-config">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              <SettingOutlined /> 서비스 설정
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchConfigs}
              loading={loading}
            >
              새로고침
            </Button>
          </div>

          <Table
            dataSource={configs}
            columns={configColumns}
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

      {/* 설정 수정 모달 */}
      <Modal
        title={`설정 수정: ${editingConfig?.config_key || ''}`}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false)
          configForm.resetFields()
          setEditingConfig(null)
        }}
        footer={null}
        width={600}
      >
        {editingConfig && (
          <Form
            form={configForm}
            layout="vertical"
            onFinish={handleConfigSubmit}
          >
            <Form.Item label="설정 키">
              <Input value={editingConfig.config_key} disabled />
            </Form.Item>

            <Form.Item label="데이터 타입">
              <Input value={editingConfig.data_type} disabled />
            </Form.Item>

            {editingConfig.data_type === 'boolean' ? (
              <Form.Item
                label="설정 값"
                name="config_value"
                valuePropName="checked"
                rules={[{ required: true, message: '설정 값을 선택해주세요.' }]}
              >
                <Switch checkedChildren="활성" unCheckedChildren="비활성" />
              </Form.Item>
            ) : (
              <Form.Item
                label="설정 값"
                name="config_value"
                rules={[
                  { required: true, message: '설정 값을 입력해주세요.' },
                  ...(editingConfig.data_type === 'integer' || editingConfig.data_type === 'decimal'
                    ? [{ type: 'number', min: 0, message: '0 이상의 숫자를 입력해주세요.' }]
                    : []),
                ]}
              >
                {editingConfig.data_type === 'integer' ? (
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="숫자 입력"
                    min={0}
                  />
                ) : editingConfig.data_type === 'decimal' ? (
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="소수 입력"
                    min={0}
                    step={0.1}
                  />
                ) : (
                  <Input placeholder="설정 값 입력" />
                )}
              </Form.Item>
            )}

            <Form.Item label="설명" name="description">
              <TextArea rows={3} placeholder="설정 설명 (선택)" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  저장
                </Button>
                <Button
                  onClick={() => {
                    setIsEditModalVisible(false)
                    configForm.resetFields()
                    setEditingConfig(null)
                  }}
                >
                  취소
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default ClassServiceConfig
