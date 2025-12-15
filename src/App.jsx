import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PopupManagement from './pages/PopupManagement'
import ImageManagement from './pages/ImageManagement'
import 'antd/dist/reset.css'
import './App.css'

function App() {
  return (
    <ConfigProvider locale={koKR}>
      <Router>
        <Routes>
          {/* 임시: 인증 없이 대시보드 바로 접근 가능 */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/popup" element={<PopupManagement />} />
            <Route path="/images" element={<ImageManagement />} />
          </Route>
          {/* 로그인/회원가입 페이지는 나중에 사용 예정 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
