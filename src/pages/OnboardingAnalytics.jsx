import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  DatePicker,
  Typography,
  Space,
  message,
  Tag,
  Spin,
  Tabs,
  Row,
  Col,
  Statistic,
  Progress,
} from 'antd'
import { ReloadOutlined, BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getUserTypeStats, getUserTypeDetail } from '../services/api'
import './OnboardingAnalytics.css'

const { Title } = Typography
const { RangePicker } = DatePicker

// current_step_id → 한글 라벨 매핑
// home_quick_quest는 is_completed에 따라 분기: false→온보딩-홈 퀘스트, true→온보딩 완료
export const STEP_ID_MAP = {
  step_01_welcome: '온보딩-웰컴',
  step_02_pageview: '온보딩-페이지뷰',
  step_03_purchase: '온보딩-결제 페이지',
  step_04_level: '온보딩-학습 수준 선택',
  home_quick_quest: '온보딩-퀘스트',
  null: '온보딩 완료',
}

// user_type → 한글 라벨 매핑
export const USER_TYPE_MAP = {
  PAID_USER: '멤버십 전환 유저',
  PROMOTION_USER: '프로모션 멤버십 유저',
  IN_PROGRESS: '진행중',
}

function getStepLabel(stepId, isCompleted) {
  if (stepId === 'home_quick_quest') {
    return isCompleted === 1 || isCompleted === true ? '온보딩 완료' : '온보딩-홈 퀘스트'
  }
  return STEP_ID_MAP[stepId] ?? stepId ?? '온보딩 완료'
}

function OnboardingAnalytics() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()])
  const [detailDate, setDetailDate] = useState(dayjs())
  const [activeTab, setActiveTab] = useState('stats')

  const [statsData, setStatsData] = useState([])
  const [detailData, setDetailData] = useState([])

  const getDateRange = () => ({
    startDate: dateRange[0]?.format('YYYY-MM-DD'),
    endDate: dateRange[1]?.format('YYYY-MM-DD'),
  })

  const fetchStats = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const data = await getUserTypeStats(startDate, endDate)
      setStatsData(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('유저 타입 통계 조회 실패:', error)
      message.error(error.message || '유저 타입 통계를 불러오는데 실패했습니다.')
      setStatsData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const date = detailDate.format('YYYY-MM-DD')
      const data = await getUserTypeDetail(date)
      setDetailData(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('유저 타입 상세 조회 실패:', error)
      message.error(error.message || '유저 타입 상세를 불러오는데 실패했습니다.')
      setDetailData([])
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (key) => setActiveTab(key)

  const handleFetchStats = () => fetchStats()
  const handleFetchDetail = () => fetchDetail()

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'detail') {
      fetchDetail()
    }
  }, [activeTab])

  const statsColumns = [
    {
      title: '스텝',
      dataIndex: 'current_step_id',
      key: 'current_step_id',
      width: 160,
      render: (val, record) => getStepLabel(val, record.is_completed),
    },
    {
      title: '완료 여부',
      dataIndex: 'is_completed',
      key: 'is_completed',
      width: 100,
      align: 'center',
      render: (val) => (
        <Tag color={val === 1 ? 'green' : 'orange'}>
          {val === 1 ? '완료' : '진행 중'}
        </Tag>
      ),
    },
    {
      title: '유저 타입',
      dataIndex: 'user_type',
      key: 'user_type',
      width: 130,
      render: (val) => {
        const colorMap = {
          PAID_USER: 'blue',
          PROMOTION_USER: 'purple',
          IN_PROGRESS: 'default',
        }
        return (
          <Tag color={colorMap[val] || 'default'}>
            {USER_TYPE_MAP[val] ?? val}
          </Tag>
        )
      },
    },
    {
      title: '유저 수',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 100,
      align: 'right',
      render: (count) => count?.toLocaleString() ?? 0,
    },
  ]

  const detailColumns = [
    {
      title: '활성 일자',
      dataIndex: 'active_date',
      key: 'active_date',
      width: 120,
    },
    {
      title: '유저 ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
    },
    {
      title: '스텝',
      dataIndex: 'current_step_id',
      key: 'current_step_id',
      width: 140,
      render: (val, record) => getStepLabel(val, record.is_completed),
    },
    {
      title: '완료 여부',
      dataIndex: 'is_completed',
      key: 'is_completed',
      width: 100,
      align: 'center',
      render: (val) => (
        <Tag color={val ? 'green' : 'orange'}>
          {val ? '완료' : '진행 중/이탈'}
        </Tag>
      ),
    },
    {
      title: '유저 타입',
      dataIndex: 'user_type',
      key: 'user_type',
      width: 130,
      render: (val) => {
        const colorMap = {
          PAID_USER: 'blue',
          PROMOTION_USER: 'purple',
          IN_PROGRESS: 'default',
        }
        return (
          <Tag color={colorMap[val] || 'default'}>
            {USER_TYPE_MAP[val] ?? val}
          </Tag>
        )
      },
    },
  ]

  const totalStatsUsers = statsData.reduce((sum, row) => sum + (row.user_count || 0), 0)
  const paidCount = statsData
    .filter((r) => r.user_type === 'PAID_USER')
    .reduce((sum, r) => sum + (r.user_count || 0), 0)
  const promotionCount = statsData
    .filter((r) => r.user_type === 'PROMOTION_USER')
    .reduce((sum, r) => sum + (r.user_count || 0), 0)
  const completedCount = paidCount + promotionCount
  const inProgressCount = statsData
    .filter((r) => r.user_type === 'IN_PROGRESS')
    .reduce((sum, r) => sum + (r.user_count || 0), 0)

  const dropoffByStep = statsData
    .filter((r) => r.user_type === 'IN_PROGRESS')
    .reduce((acc, r) => {
      const stepId = r.current_step_id ?? 'unknown'
      acc[stepId] = (acc[stepId] || 0) + (r.user_count || 0)
      return acc
    }, {})
  const dropoffList = Object.entries(dropoffByStep)
    .map(([stepId, count]) => ({
      stepId,
      count,
      pct: inProgressCount > 0 ? (count / inProgressCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="onboarding-analytics">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <Title level={2} style={{ margin: 0 }}>
              온보딩 지표 분석
            </Title>
          </div>

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <Tabs.TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  통계
                </span>
              }
              key="stats"
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => dates && setDateRange(dates)}
                    format="YYYY-MM-DD"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleFetchStats}
                    loading={loading}
                  >
                    조회
                  </Button>
                </div>

                {loading && statsData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
                  </div>
                ) : (
                  <>
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Card>
                          <Statistic
                            title="총 유저 수"
                            value={totalStatsUsers}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card>
                          <Statistic
                            title="완료 유저"
                            value={completedCount}
                            valueStyle={{ color: '#52c41a' }}
                          />
                          <div style={{ marginTop: 12, paddingLeft: 8, borderLeft: '3px solid #d9d9d9' }}>
                            <div style={{ fontSize: 13, color: '#595959' }}>
                              멤버십 전환 유저 <strong>{paidCount.toLocaleString()}</strong>
                            </div>
                            <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                              프로모션 멤버십 유저 <strong>{promotionCount.toLocaleString()}</strong>
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col xs={24} md={8}>
                        <Card>
                          <Statistic
                            title="진행중 (이탈)"
                            value={inProgressCount}
                            valueStyle={{ color: '#faad14' }}
                          />
                          {dropoffList.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              {dropoffList.map(({ stepId, count, pct }) => (
                                <div key={stepId} style={{ marginBottom: 8 }}>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: '#595959',
                                      marginBottom: 2,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <span>{getStepLabel(stepId, 0)}</span>
                                    <span>
                                      {count.toLocaleString()}명 ({pct.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <Progress
                                    percent={pct}
                                    size="small"
                                    showInfo={false}
                                    strokeColor="#faad14"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      </Col>
                    </Row>

                    {(() => {
                      const byDate = statsData.reduce((acc, row) => {
                        const d = row.active_date
                        if (!acc[d]) acc[d] = []
                        acc[d].push(row)
                        return acc
                      }, {})
                      const dates = Object.keys(byDate).sort()
                      return dates.map((date) => (
                        <Card key={date} title={date} style={{ marginBottom: 16 }}>
                          <Table
                            columns={statsColumns}
                            dataSource={byDate[date]}
                            rowKey={(_, i) => `${date}-${_.current_step_id}-${_.user_type}-${_.is_completed}-${i}`}
                            pagination={false}
                            scroll={{ x: 600 }}
                          />
                        </Card>
                      ))
                    })()}
                  </>
                )}
              </Space>
            </Tabs.TabPane>

            <Tabs.TabPane
              tab={
                <span>
                  <UnorderedListOutlined />
                  일자별 상세
                </span>
              }
              key="detail"
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <DatePicker
                    value={detailDate}
                    onChange={(d) => d && setDetailDate(d)}
                    format="YYYY-MM-DD"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleFetchDetail}
                    loading={loading}
                  >
                    조회
                  </Button>
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                    해당 일자에 갱신된 유저 중 완료/이탈 스텝
                  </span>
                </div>

                {loading && detailData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const totalDetail = detailData.length
                      const detailPaid = detailData.filter((r) => r.user_type === 'PAID_USER').length
                      const detailPromo =
                        detailData.filter((r) => r.user_type === 'PROMOTION_USER').length
                      const detailCompleted = detailPaid + detailPromo
                      const detailInProgress =
                        detailData.filter((r) => r.user_type === 'IN_PROGRESS').length
                      const detailDropoff = detailData
                        .filter((r) => r.user_type === 'IN_PROGRESS')
                        .reduce((acc, r) => {
                          const stepId = r.current_step_id ?? 'unknown'
                          acc[stepId] = (acc[stepId] || 0) + 1
                          return acc
                        }, {})
                      const detailDropoffList = Object.entries(detailDropoff)
                        .map(([stepId, count]) => ({
                          stepId,
                          count,
                          pct: detailInProgress > 0 ? (count / detailInProgress) * 100 : 0,
                        }))
                        .sort((a, b) => b.count - a.count)
                      return (
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                          <Col xs={24} md={8}>
                            <Card>
                              <Statistic
                                title="총 유저 수"
                                value={totalDetail}
                                valueStyle={{ color: '#1890ff' }}
                              />
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card>
                              <Statistic
                                title="완료 유저"
                                value={detailCompleted}
                                valueStyle={{ color: '#52c41a' }}
                              />
                              <div
                                style={{
                                  marginTop: 12,
                                  paddingLeft: 8,
                                  borderLeft: '3px solid #d9d9d9',
                                }}
                              >
                                <div style={{ fontSize: 13, color: '#595959' }}>
                                  멤버십 전환 유저 <strong>{detailPaid}</strong>
                                </div>
                                <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
                                  프로모션 멤버십 유저 <strong>{detailPromo}</strong>
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col xs={24} md={8}>
                            <Card>
                              <Statistic
                                title="진행중 (이탈)"
                                value={detailInProgress}
                                valueStyle={{ color: '#faad14' }}
                              />
                              {detailDropoffList.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                  {detailDropoffList.map(({ stepId, count, pct }) => (
                                    <div key={stepId} style={{ marginBottom: 8 }}>
                                      <div
                                        style={{
                                          fontSize: 13,
                                          color: '#595959',
                                          marginBottom: 2,
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                        }}
                                      >
                                        <span>{getStepLabel(stepId, false)}</span>
                                        <span>
                                          {count}명 ({pct.toFixed(1)}%)
                                        </span>
                                      </div>
                                      <Progress
                                        percent={pct}
                                        size="small"
                                        showInfo={false}
                                        strokeColor="#faad14"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card>
                          </Col>
                        </Row>
                      )
                    })()}
                    <Card title={`${detailDate.format('YYYY-MM-DD')} 유저 상세`}>
                      <Table
                        columns={detailColumns}
                        dataSource={detailData}
                        rowKey={(r) => `${r.user_id}-${r.current_step_id}-${r.user_type}`}
                        pagination={{
                          pageSize: 20,
                          showSizeChanger: true,
                          showTotal: (total) => `총 ${total}명`,
                        }}
                        scroll={{ x: 600 }}
                      />
                    </Card>
                  </>
                )}
              </Space>
            </Tabs.TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  )
}

export default OnboardingAnalytics
