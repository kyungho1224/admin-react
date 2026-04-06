import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Drawer } from 'antd'
import { DashboardOutlined, NotificationOutlined, PictureOutlined, BarChartOutlined, PlayCircleOutlined, DatabaseOutlined, FileImageOutlined, LineChartOutlined, MessageOutlined, GlobalOutlined, MailOutlined, UserOutlined, BookOutlined, SettingOutlined, GiftOutlined } from '@ant-design/icons'
import './Sidebar.css'

const { Sider } = Layout

// 확장 가능한 메뉴 구조
const menuItems = [
  // {
  //   key: '/',
  //   icon: <DashboardOutlined />,
  //   label: '대시보드',
  // },
  // {
  //   key: '/onboarding-analytics',
  //   icon: <LineChartOutlined />,
  //   label: '온보딩 지표 분석',
  // },
  {
    key: 'partners',
    icon: <GiftOutlined />,
    label: 'Partners',
    children: [
      {
        key: '/voucher-codes/sales',
        label: '파트너 판매 실적',
      },
      {
        key: '/partners/orders/physical',
        label: '주문 관리',
      },
    ],
  },
  {
    key: 'founder-membership',
    icon: <GiftOutlined />,
    label: 'Founder Membership',
    children: [
      {
        key: '/voucher-codes',
        label: '코드 목록',
      },
    ],
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
    key: 'app-events',
    icon: <BarChartOutlined />,
    label: '이벤트 관리',
    children: [
      {
        key: '/app-events',
        label: '이벤트 목록',
      },
      {
        key: '/app-events/images',
        icon: <PictureOutlined />,
        label: '이미지 관리',
      },
    ],
  },
  {
    key: 'app-notices',
    icon: <NotificationOutlined />,
    label: '공지사항 관리',
    children: [
      {
        key: '/app-notices',
        label: '공지사항 목록',
      },
      {
        key: '/app-notices/images',
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
  // {
  //   key: '/ga-events',
  //   icon: <BarChartOutlined />,
  //   label: 'GA 이벤트 조회',
  // },
  {
    key: '/chat',
    icon: <MessageOutlined />,
    label: '채팅 관리',
  },
  // {
  //   key: '/in-app-mail',
  //   icon: <MailOutlined />,
  //   label: '인앱 메일 발송',
  // },
  {
    key: '/active-user-stats',
    icon: <UserOutlined />,
    label: '액티브 전환율',
  },
  // {
  //   key: '/class-reservation',
  //   icon: <BookOutlined />,
  //   label: '1:1 클래스 관리',
  //   children: [
  //     {
  //       key: '/class-reservation/classes',
  //       label: '클래스 관리',
  //     },
  //     {
  //       key: '/class-reservation/reservations',
  //       label: '예약 현황',
  //     },
  //     {
  //       key: '/class-reservation/images',
  //       icon: <PictureOutlined />,
  //       label: '이미지 관리',
  //     },
  //     {
  //       key: '/class-reservation/config',
  //       icon: <SettingOutlined />,
  //       label: '설정',
  //     },
  //   ],
  // },
  // {
  //   key: '/k-life',
  //   icon: <GlobalOutlined />,
  //   label: 'K-Life',
  //   children: [
  //     {
  //       key: '/k-life/info',
  //       label: '정보',
  //     },
  //     {
  //       key: '/k-life/follower-boost',
  //       label: 'FollowerBoost',
  //     },
  //     {
  //       key: '/k-life/post-boost',
  //       label: 'PostBoost',
  //     },
  //     {
  //       key: '/k-life/meetup',
  //       label: '모임',
  //     },
  //     {
  //       key: '/k-life/campaign',
  //       label: '캠페인',
  //     },
  //     {
  //       key: '/k-life/study-abroad',
  //       label: '어학연수',
  //     },
  //   ],
  // },
  // 향후 메뉴 추가 가능
  // {
  //   key: '/users',
  //   icon: <UserOutlined />,
  //   label: '회원 관리',
  // },
]

function Sidebar({ isMobile = false, open = false, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = ({ key }) => {
    if (key === 'founder-membership' || key === 'partners') {
      return
    }
    navigate(key)
    if (isMobile && onClose) {
      onClose()
    }
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
    if (path.startsWith('/app-events/images')) {
      return ['/app-events/images']
    }
    if (path.startsWith('/app-events')) {
      return ['/app-events']
    }
    if (path.startsWith('/app-notices/images')) {
      return ['/app-notices/images']
    }
    if (path.startsWith('/app-notices')) {
      return ['/app-notices']
    }
    if (path.startsWith('/games') && !path.startsWith('/games/data')) {
      return ['/games']
    }
    if (path.startsWith('/k-life')) {
      return [path]
    }
    if (path.startsWith('/in-app-mail')) {
      return ['/in-app-mail']
    }
    if (path.startsWith('/active-user-stats')) {
      return ['/active-user-stats']
    }
    if (path.startsWith('/voucher-codes/sales')) {
      return ['/voucher-codes/sales']
    }
    if (path.startsWith('/partners/orders/physical')) {
      return ['/partners/orders/physical']
    }
    if (path.startsWith('/voucher-codes')) {
      return ['/voucher-codes']
    }
    if (path.startsWith('/class-reservation')) {
      if (path.startsWith('/class-reservation/images')) {
        return ['/class-reservation/images']
      }
      if (path.startsWith('/class-reservation/reservations')) {
        return ['/class-reservation/reservations']
      }
      if (path.startsWith('/class-reservation/config')) {
        return ['/class-reservation/config']
      }
      if (path.startsWith('/class-reservation/classes')) {
        return ['/class-reservation/classes']
      }
      return ['/class-reservation/classes']
    }
    return [path]
  }

  const [userOpenKeys, setUserOpenKeys] = useState([])
  const pathOpenKeys = useMemo(() => {
    const path = location.pathname
    const keys = []
    if (path.startsWith('/popup') || path.startsWith('/images')) keys.push('/popup')
    if (path.startsWith('/banner')) keys.push('/banner')
    if (path.startsWith('/games')) keys.push('/games')
    if (path.startsWith('/app-events')) keys.push('app-events')
    if (path.startsWith('/app-notices')) keys.push('app-notices')
    if (path.startsWith('/k-life')) keys.push('/k-life')
    if (path.startsWith('/class-reservation')) keys.push('/class-reservation')
    if (path.startsWith('/voucher-codes/sales') || path.startsWith('/partners/orders/physical')) keys.push('partners')
    if (path.startsWith('/voucher-codes') && !path.startsWith('/voucher-codes/sales')) keys.push('founder-membership')
    return keys
  }, [location.pathname])
  const openKeys = useMemo(
    () => [...new Set([...pathOpenKeys, ...userOpenKeys])],
    [pathOpenKeys, userOpenKeys]
  )

  const menuContent = (
    <>
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={getSelectedKeys()}
        openKeys={openKeys}
        onOpenChange={(keys) => setUserOpenKeys(keys)}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </>
  )

  if (isMobile) {
    return (
      <Drawer
        title="Admin Panel"
        placement="left"
        onClose={onClose}
        open={open}
        bodyStyle={{ padding: 0 }}
        width={250}
        className="mobile-sidebar-drawer"
        closable={true}
      >
        <div className="sidebar-content">
          {menuContent}
        </div>
      </Drawer>
    )
  }

  return (
    <Sider
      width={250}
      className="desktop-sidebar"
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
      {menuContent}
    </Sider>
  )
}

export default Sidebar
