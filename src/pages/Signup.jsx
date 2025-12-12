import { Link } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import './Signup.css'

const { Title } = Typography

function Signup() {
  const [form] = Form.useForm()

  const handleSignup = (values) => {
    // TODO: 백엔드 API 연동 시 구현
    console.log('회원가입 시도:', values)
  }

  return (
    <div className="signup-page">
      <Card className="signup-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 0 }}>
            회원가입
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
              name="name"
              label="이름"
              rules={[{ required: true, message: '이름을 입력해주세요' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="이름을 입력하세요"
              />
            </Form.Item>
            <Form.Item
              name="email"
              label="이메일"
              rules={[
                { required: true, message: '이메일을 입력해주세요' },
                { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="이메일을 입력하세요"
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
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
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
