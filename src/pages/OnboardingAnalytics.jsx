import { useState, useEffect } from 'react'
import { Card, Table, Button, DatePicker, Typography, Space, message, Tag, Spin, Tabs, Statistic, Row, Col, Progress } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getModeSelectionStats, getQuickStartDropoff, getAiModeDropoff, getCategoryViewStats } from '../services/api'
import './OnboardingAnalytics.css'

const { Title } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs

function OnboardingAnalytics() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()])
  const [activeTab, setActiveTab] = useState('mode-selection')

  // 각 탭별 데이터 상태
  const [modeSelectionData, setModeSelectionData] = useState(null)
  const [quickStartData, setQuickStartData] = useState(null)
  const [aiModeData, setAiModeData] = useState(null)
  const [categoryData, setCategoryData] = useState(null)

  // 날짜 범위 포맷팅
  const getDateRange = () => {
    return {
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
    }
  }

  // 모드 선택 통계 조회
  const fetchModeSelectionStats = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const data = await getModeSelectionStats(startDate, endDate)
      setModeSelectionData(data)
    } catch (error) {
      console.error('모드 선택 통계 조회 실패:', error)
      message.error(error.message || '모드 선택 통계를 불러오는데 실패했습니다.')
      setModeSelectionData(null)
    } finally {
      setLoading(false)
    }
  }

  // 퀵스타트 이탈 통계 조회
  const fetchQuickStartDropoff = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const data = await getQuickStartDropoff(startDate, endDate)
      setQuickStartData(data)
    } catch (error) {
      console.error('퀵스타트 이탈 통계 조회 실패:', error)
      message.error(error.message || '퀵스타트 이탈 통계를 불러오는데 실패했습니다.')
      setQuickStartData(null)
    } finally {
      setLoading(false)
    }
  }

  // AI 모드 이탈 통계 조회
  const fetchAiModeDropoff = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const data = await getAiModeDropoff(startDate, endDate)
      setAiModeData(data)
    } catch (error) {
      console.error('AI 모드 이탈 통계 조회 실패:', error)
      message.error(error.message || 'AI 모드 이탈 통계를 불러오는데 실패했습니다.')
      setAiModeData(null)
    } finally {
      setLoading(false)
    }
  }

  // 카테고리별 조회 통계
  const fetchCategoryViewStats = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()
      const data = await getCategoryViewStats(startDate, endDate)
      setCategoryData(data)
    } catch (error) {
      console.error('카테고리별 조회 통계 실패:', error)
      message.error(error.message || '카테고리별 조회 통계를 불러오는데 실패했습니다.')
      setCategoryData(null)
    } finally {
      setLoading(false)
    }
  }

  // 활성 탭에 따라 데이터 조회
  const fetchDataByTab = () => {
    switch (activeTab) {
      case 'mode-selection':
        fetchModeSelectionStats()
        break
      case 'quick-start':
        fetchQuickStartDropoff()
        break
      case 'ai-mode':
        fetchAiModeDropoff()
        break
      case 'category':
        fetchCategoryViewStats()
        break
      default:
        break
    }
  }

  // 날짜 범위 변경 핸들러
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates)
    }
  }

  // 탭 변경 핸들러
  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  // 조회 버튼 클릭
  const handleFetch = () => {
    fetchDataByTab()
  }

  // 초기 로드
  useEffect(() => {
    fetchModeSelectionStats()
  }, [])

  // 탭 변경 시 데이터 조회 (데이터가 없는 경우에만)
  useEffect(() => {
    if (activeTab === 'quick-start' && !quickStartData) {
      fetchQuickStartDropoff()
    } else if (activeTab === 'ai-mode' && !aiModeData) {
      fetchAiModeDropoff()
    } else if (activeTab === 'category' && !categoryData) {
      fetchCategoryViewStats()
    }
  }, [activeTab])

  // 스텝 이름 한글화
  const getStepNameKo = (stepName) => {
    const stepMap = {
      welcome_shown: '환영 화면',
      mode_selected: '모드 선택',
      category_selected: '카테고리 선택',
      category_completed: '카테고리 완료',
      category_carousel_viewed: '카테고리 캐러셀 조회',
      study_level_selected: '학습 수준 선택',
      quest_highlight_shown: '퀘스트 하이라이트',
      purchase_shown: '구매 화면',
      completed: '완료',
    }
    return stepMap[stepName] || stepName
  }

  // 퀵스타트 이탈 테이블 컬럼
  const quickStartColumns = [
    {
      title: '순서',
      dataIndex: 'step_order',
      key: 'step_order',
      width: 80,
      align: 'center',
    },
    {
      title: '스텝',
      dataIndex: 'step_name',
      key: 'step_name',
      width: 200,
      render: (name) => getStepNameKo(name),
    },
    {
      title: '이탈 유저수',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 150,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '누적 이탈 유저수',
      dataIndex: 'cumulative_count',
      key: 'cumulative_count',
      width: 150,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '이탈률',
      key: 'dropoff_rate',
      width: 200,
      render: (_, record) => {
        const rate = quickStartData?.total_users > 0
          ? (record.cumulative_count / quickStartData.total_users) * 100
          : 0
        return (
          <Progress
            percent={rate.toFixed(2)}
            strokeColor={rate > 20 ? '#ff4d4f' : rate > 10 ? '#faad14' : '#52c41a'}
            format={(percent) => `${percent}%`}
          />
        )
      },
    },
  ]

  // AI 모드 이탈 테이블 컬럼
  const aiModeColumns = [
    {
      title: '순서',
      dataIndex: 'step_order',
      key: 'step_order',
      width: 80,
      align: 'center',
    },
    {
      title: '스텝',
      dataIndex: 'step_name',
      key: 'step_name',
      width: 200,
      render: (name) => getStepNameKo(name),
    },
    {
      title: '이탈 유저수',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 150,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '누적 이탈 유저수',
      dataIndex: 'cumulative_count',
      key: 'cumulative_count',
      width: 150,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '이탈률',
      key: 'dropoff_rate',
      width: 200,
      render: (_, record) => {
        const rate = aiModeData?.total_users > 0
          ? (record.cumulative_count / aiModeData.total_users) * 100
          : 0
        return (
          <Progress
            percent={rate.toFixed(2)}
            strokeColor={rate > 20 ? '#ff4d4f' : rate > 10 ? '#faad14' : '#52c41a'}
            format={(percent) => `${percent}%`}
          />
        )
      },
    },
  ]

  // 카테고리 조회 테이블 컬럼
  const categoryColumns = [
    {
      title: '카테고리 ID',
      dataIndex: 'category_id',
      key: 'category_id',
      width: 120,
      align: 'center',
    },
    {
      title: '카테고리 코드',
      dataIndex: 'category_code',
      key: 'category_code',
      width: 200,
    },
    {
      title: '카테고리명',
      key: 'title',
      width: 300,
      render: (_, record) => {
        const titleI18n = record.title_i18n
        if (typeof titleI18n === 'object' && titleI18n.ko) {
          return titleI18n.ko
        } else if (typeof titleI18n === 'string') {
          try {
            const parsed = JSON.parse(titleI18n)
            return parsed.ko || titleI18n
          } catch {
            return titleI18n
          }
        }
        return '-'
      },
    },
    {
      title: '조회 유저수',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 150,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '조회 비율',
      key: 'view_rate',
      width: 200,
      render: (_, record) => {
        const rate = categoryData?.total_views > 0
          ? (record.user_count / categoryData.total_views) * 100
          : 0
        return (
          <Progress
            percent={rate.toFixed(2)}
            format={(percent) => `${percent}%`}
          />
        )
      },
    },
    {
      title: '표시 순서',
      dataIndex: 'display_order',
      key: 'display_order',
      width: 120,
      align: 'center',
    },
  ]

  return (
    <div className="onboarding-analytics">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              📊 온보딩 지표 분석
            </Title>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleFetch}
                loading={loading}
              >
                조회
              </Button>
            </Space>
          </div>

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            {/* 모드 선택 통계 */}
            <TabPane tab="모드 선택 통계" key="mode-selection">
              {loading && !modeSelectionData ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
                </div>
              ) : modeSelectionData ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="전체 선택 인원수"
                          value={modeSelectionData.total_count || 0}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="AI 모드 선택"
                          value={modeSelectionData.ai_mode_count || 0}
                          valueStyle={{ color: '#52c41a' }}
                          suffix={`(${((modeSelectionData.ai_mode_ratio || 0) * 100).toFixed(1)}%)`}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="퀵스타트 선택"
                          value={modeSelectionData.quick_start_count || 0}
                          valueStyle={{ color: '#faad14' }}
                          suffix={`(${((modeSelectionData.quick_start_ratio || 0) * 100).toFixed(1)}%)`}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="완료율"
                          value={((modeSelectionData.total_count > 0 ? 1 : 0) * 100).toFixed(1)}
                          valueStyle={{ color: '#722ed1' }}
                          suffix="%"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="모드 선택 비율">
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span>AI 모드</span>
                            <span>{((modeSelectionData.ai_mode_ratio || 0) * 100).toFixed(2)}%</span>
                          </div>
                          <Progress
                            percent={(modeSelectionData.ai_mode_ratio || 0) * 100}
                            strokeColor="#52c41a"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span>퀵스타트</span>
                            <span>{((modeSelectionData.quick_start_ratio || 0) * 100).toFixed(2)}%</span>
                          </div>
                          <Progress
                            percent={(modeSelectionData.quick_start_ratio || 0) * 100}
                            strokeColor="#faad14"
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Space>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#8c8c8c' }}>
                  데이터가 없습니다. 날짜 범위를 선택하고 조회 버튼을 클릭하세요.
                </div>
              )}
            </TabPane>

            {/* 퀵스타트 이탈 분석 */}
            <TabPane tab="퀵스타트 이탈 분석" key="quick-start">
              {loading && !quickStartData ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
                </div>
              ) : quickStartData ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="전체 유저수"
                          value={quickStartData.total_users || 0}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="완료 유저수"
                          value={quickStartData.completed_users || 0}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="완료율"
                          value={quickStartData.total_users > 0
                            ? ((quickStartData.completed_users / quickStartData.total_users) * 100).toFixed(1)
                            : 0}
                          valueStyle={{ color: '#722ed1' }}
                          suffix="%"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="스텝별 이탈 통계">
                    <Table
                      columns={quickStartColumns}
                      dataSource={quickStartData.dropoff_by_step || []}
                      rowKey="step_order"
                      pagination={false}
                      scroll={{ x: 800 }}
                    />
                  </Card>
                </Space>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#8c8c8c' }}>
                  데이터가 없습니다. 날짜 범위를 선택하고 조회 버튼을 클릭하세요.
                </div>
              )}
            </TabPane>

            {/* AI 모드 이탈 분석 */}
            <TabPane tab="AI 모드 이탈 분석" key="ai-mode">
              {loading && !aiModeData ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
                </div>
              ) : aiModeData ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="전체 유저수"
                          value={aiModeData.total_users || 0}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="완료 유저수"
                          value={aiModeData.completed_users || 0}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="완료율"
                          value={aiModeData.total_users > 0
                            ? ((aiModeData.completed_users / aiModeData.total_users) * 100).toFixed(1)
                            : 0}
                          valueStyle={{ color: '#722ed1' }}
                          suffix="%"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="스텝별 이탈 통계">
                    <Table
                      columns={aiModeColumns}
                      dataSource={aiModeData.dropoff_by_step || []}
                      rowKey="step_order"
                      pagination={false}
                      scroll={{ x: 800 }}
                    />
                  </Card>
                </Space>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#8c8c8c' }}>
                  데이터가 없습니다. 날짜 범위를 선택하고 조회 버튼을 클릭하세요.
                </div>
              )}
            </TabPane>

            {/* 카테고리별 조회 통계 */}
            <TabPane tab="카테고리별 조회 통계" key="category">
              {loading && !categoryData ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
                </div>
              ) : categoryData ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Card>
                        <Statistic
                          title="총 조회수"
                          value={categoryData.total_views || 0}
                          valueStyle={{ color: '#1890ff' }}
                          suffix="명"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="카테고리별 조회 통계">
                    <Table
                      columns={categoryColumns}
                      dataSource={categoryData.categories || []}
                      rowKey="category_id"
                      pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `총 ${total}개 카테고리`,
                      }}
                      scroll={{ x: 1000 }}
                    />
                  </Card>
                </Space>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px', color: '#8c8c8c' }}>
                  데이터가 없습니다. 날짜 범위를 선택하고 조회 버튼을 클릭하세요.
                </div>
              )}
            </TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  )
}

export default OnboardingAnalytics
