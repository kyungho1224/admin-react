import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Space, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { login as loginAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

const { Title } = Typography

function Login() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login: setAuthUser } = useAuth()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const { username, password } = values
      const response = await loginAPI(username, password)
      
      // 응답에서 사용자 정보 추출 (백엔드 응답 구조에 맞게 조정 필요)
      const userData = {
        username,
        ...response.user, // 백엔드에서 반환하는 사용자 정보
      }
      
      setAuthUser(userData)
      message.success('로그인 성공!')
      navigate('/')
    } catch (error) {
      console.error('로그인 실패:', error)
      message.error(error.message || '로그인 정보가 잘못되었거나 승인되지 않은 계정입니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
            🔐 로그인
          </Title>
          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label="아이디"
              rules={[{ required: true, message: '아이디를 입력해주세요' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="아이디를 입력하세요"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="비밀번호"
              rules={[{ required: true, message: '비밀번호를 입력해주세요' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                로그인
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#8c8c8c' }}>
              계정이 없으신가요?{' '}
              <Link to="/signup" style={{ color: '#1890ff' }}>
                회원가입
              </Link>
            </span>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Login
