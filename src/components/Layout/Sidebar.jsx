import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { DashboardOutlined, NotificationOutlined, PictureOutlined, BarChartOutlined, PlayCircleOutlined } from '@ant-design/icons'
import './Sidebar.css'

const { Sider } = Layout

// 확장 가능한 메뉴 구조
const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '대시보드',
  },
  {
    key: '/popup',
    icon: <NotificationOutlined />,
    label: '팝업 관리',
  },
  {
    key: '/images',
    icon: <PictureOutlined />,
    label: '팝업 이미지 관리',
  },
  {
    key: '/games',
    icon: <PlayCircleOutlined />,
    label: '게임 관리',
  },
  {
    key: '/ga-events',
    icon: <BarChartOutlined />,
    label: 'GA 이벤트 조회',
  },
  // 향후 메뉴 추가 가능
  // {
  //   key: '/users',
  //   icon: <UserOutlined />,
  //   label: '회원 관리',
  // },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Sider
      width={250}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
      theme="dark"
    >
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default Sidebar
