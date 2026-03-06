import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PopupManagement from './pages/PopupManagement'
import ImageManagement from './pages/ImageManagement'
import BannerManagement from './pages/BannerManagement'
import BannerImageManagement from './pages/BannerImageManagement'
import GAEventManagement from './pages/GAEventManagement'
import GameManagement from './pages/GameManagement'
import GameDataDetail from './pages/GameDataDetail'
import OnboardingAnalytics from './pages/OnboardingAnalytics'
import ChatManagement from './pages/ChatManagement'
import StudyAbroad from './pages/StudyAbroad'
import InAppMail from './pages/InAppMail'
import ActiveUserStats from './pages/ActiveUserStats'
import VoucherCodesManagement from './pages/VoucherCodesManagement'
import ClassManagement from './pages/ClassManagement'
import ReservationManagement from './pages/ReservationManagement'
import ClassImageManagement from './pages/ClassImageManagement'
import ClassServiceConfig from './pages/ClassServiceConfig'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/voucher-codes" replace />} />
            <Route path="popup" element={<PopupManagement />} />
            <Route path="images" element={<ImageManagement />} />
            <Route path="banner" element={<BannerManagement />} />
            <Route path="banner/images" element={<BannerImageManagement />} />
            <Route path="ga-events" element={<GAEventManagement />} />
            <Route path="onboarding-analytics" element={<OnboardingAnalytics />} />
            <Route path="chat" element={<ChatManagement />} />
            <Route path="in-app-mail" element={<InAppMail />} />
            <Route path="active-user-stats" element={<ActiveUserStats />} />
            <Route path="voucher-codes" element={<VoucherCodesManagement />} />
            <Route path="class-reservation/classes" element={<ClassManagement />} />
            <Route path="class-reservation/reservations" element={<ReservationManagement />} />
            <Route path="class-reservation/images" element={<ClassImageManagement />} />
            <Route path="class-reservation/config" element={<ClassServiceConfig />} />
            <Route path="k-life/study-abroad" element={<StudyAbroad />} />
            <Route path="games" element={<GameManagement />} />
            <Route path="games/data" element={<GameDataDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App