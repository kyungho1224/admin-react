import { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  InputNumber, 
  Button, 
  Select, 
  message, 
  Typography, 
  DatePicker,
  Row,
  Col,
  Table
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getActiveStatsSummary, getActiveStatsDaily, insertDownloadStats } from '../services/api'
import './ActiveUserStats.css'

const { Title } = Typography
const { Option } = Select

function ActiveUserStats() {
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [downloadForm] = Form.useForm()
  const [downloadLoading, setDownloadLoading] = useState(false)

  // 년도 옵션 생성 (2022년부터 현재 년도까지)
  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = 2022; y <= currentYear; y++) {
    yearOptions.push(y)
  }

  // 데이터 조회
  const fetchData = async () => {
    setLoading(true)
    try {
      const [summary, daily] = await Promise.all([
        getActiveStatsSummary(year, month),
        getActiveStatsDaily(year, month)
      ])
      
      setSummaryData(summary || [])
      setDailyData(daily || [])
    } catch (error) {
      console.error('데이터 조회 실패:', error)
      message.error('데이터를 불러오는데 실패했습니다.')
      setSummaryData([])
      setDailyData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [year, month])

  // 다운로드 수 저장
  const handleDownloadSubmit = async (values) => {
    setDownloadLoading(true)
    try {
      const statDate = dayjs(values.stat_date).format('YYYY-MM-DD')
      const result = await insertDownloadStats(statDate, values.total_count)
      
      // 백엔드에서 반환한 메시지 사용
      if (result.is_updated) {
        message.success(`${statDate}의 다운로드 수가 ${values.total_count}으로 업데이트되었습니다!`)
      } else {
        message.success(`${statDate}의 다운로드 수가 ${values.total_count}으로 저장되었습니다!`)
      }
      
      downloadForm.resetFields()
      // 데이터 새로고침
      fetchData()
    } catch (error) {
      console.error('다운로드 수 저장 실패:', error)
      message.error(error.message || '다운로드 수 저장에 실패했습니다.')
    } finally {
      setDownloadLoading(false)
    }
  }

  // Summary 테이블 컬럼
  const summaryColumns = [
    {
      title: '기준',
      dataIndex: '기준',
      key: '기준',
    },
    {
      title: '일수',
      dataIndex: '일수',
      key: '일수',
      align: 'right',
    },
    {
      title: '앱 다운로드 수',
      dataIndex: '앱_다운로드_수',
      key: '앱_다운로드_수',
      align: 'right',
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: '회원 전환 수',
      dataIndex: '회원_전환_수',
      key: '회원_전환_수',
      align: 'right',
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: '회원 전환율 (%)',
      dataIndex: '회원_전환율',
      key: '회원_전환율',
      align: 'right',
      render: (value) => value?.toFixed(2) || '0.00',
    },
    {
      title: '액티브 유저 수',
      dataIndex: '액티브_유저_수',
      key: '액티브_유저_수',
      align: 'right',
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: '액티브 전환율 (%)',
      dataIndex: '액티브_전환율',
      key: '액티브_전환율',
      align: 'right',
      render: (value) => value?.toFixed(2) || '0.00',
    },
  ]

  // Daily 테이블 컬럼
  const dailyColumns = [
    {
      title: '날짜',
      dataIndex: '날짜',
      key: '날짜',
      render: (value) => value ? dayjs(value).format('YYYY-MM-DD') : '-',
    },
    {
      title: '앱 다운로드 수',
      dataIndex: '앱_다운로드_수',
      key: '앱_다운로드_수',
      align: 'right',
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: '전일 대비 앱 다운로드 증감률 (%)',
      dataIndex: '전일_대비_앱_다운로드_증감률',
      key: '전일_대비_앱_다운로드_증감률',
      align: 'right',
      render: (value) => {
        if (value === null || value === undefined) return '-'
        const numValue = parseFloat(value)
        const color = numValue > 0 ? '#1890ff' : numValue < 0 ? '#ff4d4f' : undefined
        return <span style={{ color }}>{numValue.toFixed(2)}</span>
      },
    },
    {
      title: '회원 전환 수',
      dataIndex: '회원_전환_수',
      key: '회원_전환_수',
      align: 'right',
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: '앱 다운로드 기준 회원 전환율',
      dataIndex: '앱_다운로드_기준_회원_전환률',
      key: '앱_다운로드_기준_회원_전환률',
      align: 'right',
      render: (value) => value?.toFixed(2) || '0.00',
    },
    {
      title: '전일 대비 회원 전환 증감율',
      dataIndex: '전일_대비_회원_전환_증감률',
      key: '전일_대비_회원_전환_증감률',
      align: 'right',
      render: (value) => {
        if (value === null || value === undefined) return '-'
        const numValue = parseFloat(value)
        const color = numValue > 0 ? '#1890ff' : numValue < 0 ? '#ff4d4f' : undefined
        return <span style={{ color }}>{numValue.toFixed(2)}</span>
      },
    },
    {
      title: '액티브 유저 수',
      dataIndex: '액티브_유저_수',
      key: '액티브_유저_수',
      align: 'right',
      render: (value) => value?.toLocaleString() || 0,
    },
    {
      title: '앱 다운로드 기준 액티브 유저 전환율',
      dataIndex: '앱_다운로드_기준_액티브_유저_전환률',
      key: '앱_다운로드_기준_액티브_유저_전환률',
      align: 'right',
      render: (value) => value?.toFixed(2) || '0.00',
    },
    {
      title: '전일 대비 액티브 전환 증감율',
      dataIndex: '전일_대비_액티브_전환_증감률',
      key: '전일_대비_액티브_전환_증감률',
      align: 'right',
      render: (value) => {
        if (value === null || value === undefined) return '-'
        const numValue = parseFloat(value)
        const color = numValue > 0 ? '#1890ff' : numValue < 0 ? '#ff4d4f' : undefined
        return <span style={{ color }}>{numValue.toFixed(2)}</span>
      },
    },
  ]

  return (
    <div className="active-user-stats">
      <Title level={2}>📊 다운로드 기준 액티브 전환율</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Row gutter={16} align="middle">
              <Col>
                <span style={{ marginRight: 8, fontWeight: 500 }}>필터:</span>
              </Col>
              <Col>
                <span style={{ marginRight: 8 }}>년도:</span>
                <Select
                  value={year}
                  onChange={setYear}
                  style={{ width: 120 }}
                >
                  {yearOptions.map(y => (
                    <Option key={y} value={y}>{y}</Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <span style={{ marginRight: 8 }}>월:</span>
                <Select
                  value={month}
                  onChange={setMonth}
                  style={{ width: 120 }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <Option key={m} value={m}>{m}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Form
              form={downloadForm}
              onFinish={handleDownloadSubmit}
              initialValues={{
                stat_date: dayjs(),
                total_count: 0,
              }}
            >
              <Row gutter={16} align="middle">
                <Col>
                  <span style={{ marginRight: 8, fontWeight: 500 }}>다운로드 수 입력:</span>
                </Col>
                <Col>
                  <Form.Item
                    name="stat_date"
                    rules={[{ required: true, message: '날짜를 선택해주세요.' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <DatePicker placeholder="날짜 선택" style={{ width: 150 }} />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item
                    name="total_count"
                    rules={[{ required: true, message: '다운로드 수를 입력해주세요.' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      placeholder="다운로드 수"
                      style={{ width: 150 }}
                      min={0}
                      step={1}
                      controls={{
                        upIcon: '+',
                        downIcon: '-',
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={downloadLoading}
                    >
                      저장
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>✓ Summary</Title>
        <Table
          columns={summaryColumns}
          dataSource={summaryData}
          loading={loading}
          rowKey="기준"
          pagination={false}
        />
      </Card>

      <Card>
        <Title level={4} className="daily-title">✓ Daily</Title>
        <Table
          columns={dailyColumns}
          dataSource={dailyData}
          loading={loading}
          rowKey="날짜"
          pagination={{
            pageSize: 31,
            showSizeChanger: true,
            showTotal: (total) => `총 ${total}개`,
          }}
          scroll={{ x: 'max-content', y: 600 }}
        />
      </Card>
    </div>
  )
}

export default ActiveUserStats
