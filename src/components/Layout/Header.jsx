import { Layout, Typography, Space, Avatar, Select, Tag } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { getApiConfig, setApiEnvironment } from '../../services/apiClient'
import './Header.css'

const { Header: AntHeader } = Layout
const { Title } = Typography
const { Option } = Select

function Header() {
  const apiConfig = getApiConfig()
  const currentEnv = apiConfig.environment

  const handleEnvironmentChange = (value) => {
    if (value !== currentEnv) {
      setApiEnvironment(value)
    }
  }

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Title level={4} style={{ margin: 0 }}>
        관리자 대시보드
      </Title>
      <Space size="middle">
        <Space size="small">
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>환경:</span>
          <Select
            value={currentEnv}
            onChange={handleEnvironmentChange}
            style={{ width: 100 }}
            size="small"
          >
            <Option value="development">개발</Option>
            <Option value="production">운영</Option>
          </Select>
          <Tag color={currentEnv === 'production' ? 'red' : 'blue'} style={{ margin: 0 }}>
            {currentEnv === 'production' ? '운영' : '개발'}
          </Tag>
        </Space>
        <Avatar icon={<UserOutlined />} />
        <span>관리자</span>
      </Space>
    </AntHeader>
  )
}

export default Header
