import { useEffect, useState } from 'react'
import { Card, Typography, Table, Button, Space, Tag, message, Modal, Descriptions, Image } from 'antd'
import { ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { getAdminNotices, getAdminNoticeDetail } from '../services/api'

const { Title } = Typography

function AppNoticeManagement() {
  const [loading, setLoading] = useState(false)
  const [notices, setNotices] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const fetchNotices = async () => {
    setLoading(true)
    try {
      const data = await getAdminNotices(true)
      setNotices(data || [])
    } catch (error) {
      message.error(error.message || '앱내 공지사항 목록 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [])

  const openDetail = async (noticeId) => {
    setDetailLoading(true)
    setIsDetailOpen(true)
    try {
      const detail = await getAdminNoticeDetail(noticeId)
      setSelectedNotice(detail)
    } catch (error) {
      message.error(error.message || '공지사항 상세 조회에 실패했습니다.')
      setIsDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'notice_id', key: 'notice_id', width: 80 },
    { title: '순서', dataIndex: 'display_order', key: 'display_order', width: 80 },
    {
      title: '제목(ko)',
      key: 'title_ko',
      render: (_, row) => row.titles?.ko || row.titles?.en || '-',
    },
    {
      title: '상태',
      key: 'is_active',
      width: 100,
      render: (_, row) => (
        <Tag color={row.is_active ? 'success' : 'default'}>
          {row.is_active ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '상세',
      key: 'detail',
      width: 100,
      render: (_, row) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(row.notice_id)}>
          보기
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>앱내 공지사항 관리</Title>
            <Button icon={<ReloadOutlined />} onClick={fetchNotices} loading={loading}>
              새로고침
            </Button>
          </div>
          <Table
            rowKey="notice_id"
            columns={columns}
            dataSource={notices}
            loading={loading}
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Space>
      </Card>
      <Modal
        title="공지사항 상세"
        open={isDetailOpen}
        onCancel={() => {
          setIsDetailOpen(false)
          setSelectedNotice(null)
        }}
        footer={null}
        width={900}
      >
        {selectedNotice && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ID">{selectedNotice.notice_id}</Descriptions.Item>
              <Descriptions.Item label="제목(ko)">{selectedNotice.titles?.ko || '-'}</Descriptions.Item>
              <Descriptions.Item label="아이템 수">{selectedNotice.items?.length || 0}</Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="item_id"
              loading={detailLoading}
              dataSource={selectedNotice.items || []}
              pagination={false}
              columns={[
                { title: '아이템 ID', dataIndex: 'item_id', key: 'item_id', width: 90 },
                { title: '순서', dataIndex: 'display_order', key: 'display_order', width: 80 },
                {
                  title: '제목(ko)',
                  key: 'title_ko',
                  render: (_, item) => item.titles?.ko || item.titles?.en || '-',
                },
                {
                  title: '이미지',
                  key: 'img_url',
                  width: 120,
                  render: (_, item) => (
                    item.img_url ? <Image src={item.img_url} width={80} height={80} style={{ objectFit: 'cover' }} /> : '-'
                  ),
                },
                {
                  title: '상태',
                  key: 'is_active',
                  width: 90,
                  render: (_, item) => (
                    <Tag color={item.is_active ? 'success' : 'default'}>
                      {item.is_active ? '활성' : '비활성'}
                    </Tag>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default AppNoticeManagement
