import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Space, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { signup as signupAPI } from '../services/api'
import './Signup.css'

const { Title } = Typography

function Signup() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (values) => {
    const { username, password } = values
    
    if (!username || !password) {
      message.warning('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      await signupAPI(username, password)
      message.success('회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.')
      form.resetFields()
      // 회원가입 성공 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      console.error('회원가입 실패:', error)
      const errorMessage = error.message || '회원가입에 실패했습니다.'
      
      if (errorMessage.includes('이미 존재') || errorMessage.includes('중복')) {
        message.warning('이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.')
      } else {
        message.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page">
      <Card className="signup-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
            📝 회원가입
          </Title>
          <Form
            form={form}
            name="signup"
            onFinish={handleSignup}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              label="아이디"
              rules={[
                { required: true, message: '아이디를 입력해주세요' },
                { min: 3, message: '아이디는 최소 3자 이상이어야 합니다' },
              ]}
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
              rules={[
                { required: true, message: '비밀번호를 입력해주세요' },
                { min: 6, message: '비밀번호는 최소 6자 이상이어야 합니다' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호를 입력하세요"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="passwordConfirm"
              label="비밀번호 확인"
              dependencies={['password']}
              rules={[
                { required: true, message: '비밀번호를 다시 입력해주세요' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('비밀번호가 일치하지 않습니다'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                회원가입
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#8c8c8c' }}>
              이미 계정이 있으신가요?{' '}
              <Link to="/login" style={{ color: '#1890ff' }}>
                로그인
              </Link>
            </span>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default Signup
