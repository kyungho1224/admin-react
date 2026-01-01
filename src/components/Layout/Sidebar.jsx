import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { DashboardOutlined, NotificationOutlined, PictureOutlined, BarChartOutlined, PlayCircleOutlined, DatabaseOutlined, FileImageOutlined } from '@ant-design/icons'
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
    children: [
      {
        key: '/popup',
        label: '팝업 목록',
      },
      {
        key: '/images',
        icon: <PictureOutlined />,
        label: '이미지 관리',
      },
    ],
  },
  {
    key: '/banner',
    icon: <FileImageOutlined />,
    label: '메인 배너 관리',
    children: [
      {
        key: '/banner',
        label: '배너 목록',
      },
      {
        key: '/banner/images',
        icon: <PictureOutlined />,
        label: '이미지 관리',
      },
    ],
  },
  {
    key: '/games',
    icon: <PlayCircleOutlined />,
    label: '게임 관리',
    children: [
      {
        key: '/games',
        label: '게임 규칙',
      },
      {
        key: '/games/data',
        icon: <DatabaseOutlined />,
        label: '게임 데이터',
      },
    ],
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

  // 현재 경로에 따라 선택된 메뉴 키 결정
  const getSelectedKeys = () => {
    const path = location.pathname
    // 하위 메뉴 경로 체크
    if (path.startsWith('/games/data')) {
      return ['/games/data']
    }
    if (path.startsWith('/banner/images')) {
      return ['/banner/images']
    }
    if (path.startsWith('/banner')) {
      return ['/banner']
    }
    if (path.startsWith('/images')) {
      return ['/images']
    }
    if (path.startsWith('/popup')) {
      return ['/popup']
    }
    if (path.startsWith('/games') && !path.startsWith('/games/data')) {
      return ['/games']
    }
    return [path]
  }

  // 열려있는 서브메뉴 키 결정
  const getOpenKeys = () => {
    const path = location.pathname
    const openKeys = []
    if (path.startsWith('/popup') || path.startsWith('/images')) {
      openKeys.push('/popup')
    }
    if (path.startsWith('/banner')) {
      openKeys.push('/banner')
    }
    if (path.startsWith('/games')) {
      openKeys.push('/games')
    }
    return openKeys
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
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default Sidebar
