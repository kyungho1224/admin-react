import { Layout, Typography, Space, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import './Header.css'

const { Header: AntHeader } = Layout
const { Title } = Typography

function Header() {
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
      <Space>
        <Avatar icon={<UserOutlined />} />
        <span>관리자</span>
      </Space>
    </AntHeader>
  )
}

export default Header
