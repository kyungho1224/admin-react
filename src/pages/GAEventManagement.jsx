import { useState, useEffect } from 'react'
import { Card, Table, Button, DatePicker, Typography, Space, message, Tag, Spin } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getGAEvents } from '../services/api'
import { GA_CUSTOM_EVENT_INFO } from '../constants/gaCustomEventInfo'
import * as XLSX from 'xlsx'
import './GAEventManagement.css'

const { Title } = Typography

function GAEventManagement() {
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(dayjs().subtract(1, 'day'))

  // 증감률 포맷팅
  const formatPct = (value) => {
    if (value > 0) {
      return `📈 +${value.toFixed(1)}%`
    } else if (value < 0) {
      return `📉 ${value.toFixed(1)}%`
    } else {
      return '➖ 0.0%'
    }
  }

  // 이벤트 데이터 조회
  const fetchEvents = async (date) => {
    setLoading(true)
    try {
      const dateStr = date.format('YYYY-MM-DD')
      const response = await getGAEvents(dateStr)
      
      if (!response.events || response.events.length === 0) {
        message.warning('선택한 날짜에 대한 커스텀 이벤트 데이터가 없습니다.')
        setEvents([])
        return
      }

      // 이벤트 데이터에 한글명과 카테고리 추가
      const processedEvents = response.events.map(event => {
        const eventInfo = GA_CUSTOM_EVENT_INFO[event.event_name] || [event.event_name, '기타']
        return {
          ...event,
          event_name_ko: eventInfo[0],
          category: eventInfo[1],
          event_count_pct_str: formatPct(event.event_count_pct),
          user_count_pct_str: formatPct(event.user_count_pct),
        }
      })

      // 카테고리별로 그룹화
      const groupedByCategory = {}
      processedEvents.forEach(event => {
        if (!groupedByCategory[event.category]) {
          groupedByCategory[event.category] = []
        }
        groupedByCategory[event.category].push(event)
      })

      // 카테고리별로 정렬된 이벤트 목록 생성
      const sortedCategories = Object.keys(groupedByCategory).sort()
      const finalEvents = []
      sortedCategories.forEach(category => {
        finalEvents.push(...groupedByCategory[category].sort((a, b) => b.event_count - a.event_count))
      })

      setEvents(finalEvents)
    } catch (error) {
      console.error('이벤트 조회 실패:', error)
      message.error(error.message || '이벤트 데이터를 불러오는데 실패했습니다.')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents(selectedDate)
  }, [])

  // 날짜 변경 핸들러
  const handleDateChange = (date) => {
    setSelectedDate(date)
    fetchEvents(date)
  }

  // 엑셀 다운로드
  const handleDownloadExcel = () => {
    if (events.length === 0) {
      message.warning('다운로드할 데이터가 없습니다.')
      return
    }

    // 엑셀용 데이터 준비
    const excelData = events.map(event => ({
      '이벤트 키': event.event_name,
      '이벤트 이름': event.event_name_ko,
      '카테고리': event.category,
      '이벤트 수': event.event_count,
      '이벤트 증감률(%)': event.event_count_pct,
      '사용자 수': event.user_count,
      '사용자 증감률(%)': event.user_count_pct,
    }))

    // 워크북 생성
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    XLSX.utils.book_append_sheet(wb, ws, 'Event Stats')

    // 파일 다운로드
    const fileName = `event_stats_${selectedDate.format('YYYY-MM-DD')}.xlsx`
    XLSX.writeFile(wb, fileName)
    message.success('엑셀 파일이 다운로드되었습니다.')
  }

  // 테이블 컬럼 정의
  const columns = [
    {
      title: '이벤트 키',
      dataIndex: 'event_name',
      key: 'event_name',
      width: 200,
    },
    {
      title: '이벤트 이름',
      dataIndex: 'event_name_ko',
      key: 'event_name_ko',
      width: 250,
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '이벤트 수',
      dataIndex: 'event_count',
      key: 'event_count',
      width: 120,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '전일 대비 이벤트 증감률',
      dataIndex: 'event_count_pct_str',
      key: 'event_count_pct_str',
      width: 180,
      align: 'center',
    },
    {
      title: '사용자 수',
      dataIndex: 'user_count',
      key: 'user_count',
      width: 120,
      align: 'right',
      render: (count) => count.toLocaleString(),
    },
    {
      title: '전일 대비 사용자 증감률',
      dataIndex: 'user_count_pct_str',
      key: 'user_count_pct_str',
      width: 180,
      align: 'center',
    },
  ]

  return (
    <div className="ga-event-management">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              🛠️ Google Analytics Events
            </Title>
            <Space>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                placeholder="조회할 날짜 선택"
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchEvents(selectedDate)}
                loading={loading}
              >
                새로고침
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadExcel}
                disabled={events.length === 0}
              >
                엑셀 다운로드
              </Button>
            </Space>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>데이터 불러오는 중...</div>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#8c8c8c' }}>
              선택한 날짜에 대한 커스텀 이벤트 데이터가 없습니다.
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={events}
              rowKey="event_name"
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개 이벤트`,
              }}
              scroll={{ x: 1200 }}
            />
          )}
        </Space>
      </Card>
    </div>
  )
}

export default GAEventManagement





