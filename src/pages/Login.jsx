import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import './Login.css'

const { Title } = Typography

function Login() {
  const [form] = Form.useForm()

  const handleLogin = (values) => {
    // TODO: 백엔드 API 연동 시 구현
    console.log('로그인 시도:', values)
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
            로그인
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
              name="email"
              label="이메일"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="이메일을 입력하세요"
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
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
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
