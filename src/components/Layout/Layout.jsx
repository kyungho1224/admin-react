import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout as AntLayout } from 'antd'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'

const { Content } = AntLayout

function Layout() {
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sidebar 
        isMobile={isMobile} 
        open={sidebarOpen} 
        onClose={closeSidebar}
      />
      <AntLayout 
        className={`main-layout ${isMobile ? 'mobile' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : 250,
          transition: 'margin-left 0.2s'
        }}
      >
        <Header isMobile={isMobile} onMenuClick={toggleSidebar} />
        <Content 
          className="main-content"
          style={{ 
            margin: isMobile ? '16px 8px' : '24px 16px', 
            padding: isMobile ? 16 : 24, 
            background: '#fff', 
            borderRadius: 8 
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
