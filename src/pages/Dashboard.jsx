import { Card, Row, Col, Statistic, Typography } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import './Dashboard.css'

const { Title } = Typography

function Dashboard() {
  return (
    <div className="dashboard">
      <Title level={2}>대시보드</Title>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="총 사용자"
              value={1128}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="이번 달 방문자"
              value={8934}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="전환율"
              value={9.3}
              precision={1}
              suffix="%"
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="최근 활동" style={{ minHeight: 300 }}>
            <p>최근 활동 내역이 여기에 표시됩니다.</p>
            {/* 향후 차트나 테이블 추가 가능 */}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="빠른 액션" style={{ minHeight: 300 }}>
            <p>자주 사용하는 기능을 빠르게 접근할 수 있습니다.</p>
            {/* 향후 버튼 그룹 추가 가능 */}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
