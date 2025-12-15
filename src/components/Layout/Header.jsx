import { Layout, Typography, Space, Avatar, Select, Tag, Button, Modal } from 'antd'
import { UserOutlined, LogoutOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { getApiConfig, setApiEnvironment } from '../../services/apiClient'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const { Header: AntHeader } = Layout
const { Title } = Typography
const { Option } = Select
const { confirm } = Modal

function Header() {
  const apiConfig = getApiConfig()
  const currentEnv = apiConfig.environment
  const { user, logout, sessionTimeLeft, canExtend, extendSession } = useAuth()
  const navigate = useNavigate()

  // 세션 시간 포맷팅 (분:초)
  const formatSessionTime = (seconds) => {
    if (!seconds || seconds <= 0) return '만료됨'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleEnvironmentChange = (value) => {
    if (value !== currentEnv) {
      confirm({
        title: '환경 변경',
        content: '환경을 변경하면 다시 로그인해야 합니다. 계속하시겠습니까?',
        okText: '확인',
        cancelText: '취소',
        onOk() {
          logout()
          setApiEnvironment(value)
          navigate('/login')
        },
      })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        {sessionTimeLeft !== null && (
          <Space size="small">
            <ClockCircleOutlined />
            <span style={{ fontSize: '12px', color: canExtend ? '#ff4d4f' : '#8c8c8c' }}>
              {formatSessionTime(sessionTimeLeft)}
            </span>
            {canExtend && (
              <Button
                type="link"
                size="small"
                onClick={extendSession}
                style={{ padding: 0, height: 'auto' }}
              >
                연장
              </Button>
            )}
          </Space>
        )}
        <Avatar icon={<UserOutlined />} />
        <span>{user?.username || '관리자'}</span>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          size="small"
        >
          로그아웃
        </Button>
      </Space>
    </AntHeader>
  )
}

export default Header
