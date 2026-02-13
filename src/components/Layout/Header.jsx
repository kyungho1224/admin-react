import { useState, useEffect } from 'react'
import { Layout, Typography, Space, Avatar, Select, Tag, Button, Modal, Dropdown, Switch, message } from 'antd'
import { UserOutlined, LogoutOutlined, ClockCircleOutlined, MenuOutlined, DownOutlined, GiftOutlined } from '@ant-design/icons'
import { getApiConfig, setApiEnvironment } from '../../services/apiClient'
import { getPromotionStatus, updatePromotionStatus } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const { Header: AntHeader } = Layout
const { Title } = Typography
const { Option } = Select
const { confirm } = Modal

function Header({ isMobile = false, onMenuClick }) {
  const apiConfig = getApiConfig()
  const currentEnv = apiConfig.environment
  const { user, logout, sessionTimeLeft, canExtend, extendSession } = useAuth()
  const navigate = useNavigate()
  const [isPromotionOn, setIsPromotionOn] = useState(false)
  const [promotionLoading, setPromotionLoading] = useState(false)
  const [promotionStatusLoading, setPromotionStatusLoading] = useState(true)

  // 프로모션 상태 조회
  useEffect(() => {
    let cancelled = false
    async function fetchStatus() {
      try {
        const data = await getPromotionStatus()
        if (!cancelled && data && typeof data.is_promotion_on === 'boolean') {
          setIsPromotionOn(data.is_promotion_on)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Header] 프로모션 상태 조회 실패:', err)
        }
      } finally {
        if (!cancelled) setPromotionStatusLoading(false)
      }
    }
    fetchStatus()
    return () => { cancelled = true }
  }, [])

  const handlePromotionToggle = async (checked) => {
    setPromotionLoading(true)
    try {
      await updatePromotionStatus(checked)
      setIsPromotionOn(checked)
      message.success(checked ? '프로모션이 켜졌습니다.' : '프로모션이 꺼졌습니다.')
    } catch (err) {
      message.error(err.message || '프로모션 상태 변경에 실패했습니다.')
    } finally {
      setPromotionLoading(false)
    }
  }

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

  const userMenuItems = [
    {
      key: 'logout',
      label: '로그아웃',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader
      className={`app-header ${isMobile ? 'mobile' : ''}`}
      style={{
        padding: isMobile ? '0 12px' : '0 24px',
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
      <div className="header-left">
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            style={{ marginRight: 12 }}
          />
        )}
        <Title level={4} style={{ margin: 0, fontSize: isMobile ? '16px' : '20px' }}>
          {isMobile ? '관리자' : '관리자 대시보드'}
        </Title>
      </div>
      
      <div className="header-right">
        {!isMobile ? (
          <Space size="middle">
            {!promotionStatusLoading && (
              <Space size="small">
                <GiftOutlined style={{ color: isPromotionOn ? '#52c41a' : '#8c8c8c' }} />
                <span style={{ fontSize: '12px', color: '#8c8c8c' }}>프로모션</span>
                <Switch
                  size="small"
                  checked={isPromotionOn}
                  loading={promotionLoading}
                  onChange={handlePromotionToggle}
                />
              </Space>
            )}
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
        ) : (
          <Space size="small">
            {!promotionStatusLoading && (
              <>
                <GiftOutlined style={{ color: isPromotionOn ? '#52c41a' : '#8c8c8c', fontSize: 14 }} />
                <Switch
                  size="small"
                  checked={isPromotionOn}
                  loading={promotionLoading}
                  onChange={handlePromotionToggle}
                />
              </>
            )}
            <Tag color={currentEnv === 'production' ? 'red' : 'blue'} style={{ margin: 0 }}>
              {currentEnv === 'production' ? '운영' : '개발'}
            </Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space size="small" style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <span style={{ fontSize: '12px' }}>{user?.username || '관리자'}</span>
                <DownOutlined style={{ fontSize: '10px' }} />
              </Space>
            </Dropdown>
          </Space>
        )}
      </div>
    </AntHeader>
  )
}

export default Header
