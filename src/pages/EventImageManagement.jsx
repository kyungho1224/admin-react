import { useEffect, useState } from 'react'
import { Card, Typography, Button, Space, Upload, message, Image, Row, Col, Popconfirm, Tabs } from 'antd'
import { UploadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { uploadToS3, listS3Images, deleteS3Image } from '../services/s3Upload'

const { Title, Text } = Typography

function EventImageManagement() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [thumbnailImages, setThumbnailImages] = useState([])
  const [eventImages, setEventImages] = useState([])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const [thumbs, events] = await Promise.all([
        listS3Images('events/thumbnails'),
        listS3Images('events'),
      ])
      setThumbnailImages(thumbs || [])
      setEventImages(events?.filter((img) => !img.key.includes('events/thumbnails/')) || [])
    } catch (error) {
      message.error(error.message || '이벤트 이미지 목록 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleUpload = async (file, folder) => {
    setUploading(true)
    try {
      await uploadToS3(file, folder)
      message.success('이미지 업로드가 완료되었습니다.')
      await fetchImages()
    } catch (error) {
      message.error(error.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleDelete = async (key) => {
    try {
      await deleteS3Image(key)
      message.success('이미지를 삭제했습니다.')
      await fetchImages()
    } catch (error) {
      message.error(error.message || '이미지 삭제에 실패했습니다.')
    }
  }

  const renderGrid = (images) => (
    <Row gutter={[16, 16]}>
      {images.map((image) => (
        <Col xs={12} sm={8} md={6} key={image.key}>
          <Card
            cover={<Image src={image.url} alt={image.fileName} style={{ height: 160, objectFit: 'cover' }} preview />}
            actions={[
              <Popconfirm
                key="delete"
                title="이미지를 삭제하시겠습니까?"
                onConfirm={() => handleDelete(image.key)}
                okText="삭제"
                cancelText="취소"
              >
                <DeleteOutlined />
              </Popconfirm>,
            ]}
          >
            <Text ellipsis style={{ display: 'block' }}>{image.fileName}</Text>
          </Card>
        </Col>
      ))}
    </Row>
  )

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>이벤트 이미지 관리</Title>
            <Button icon={<ReloadOutlined />} onClick={fetchImages} loading={loading}>
              새로고침
            </Button>
          </div>
          <Tabs
            items={[
              {
                key: 'thumbnails',
                label: '썸네일 (events/thumbnails)',
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => handleUpload(file, 'events/thumbnails')}
                    >
                      <Button icon={<UploadOutlined />} loading={uploading}>
                        썸네일 업로드
                      </Button>
                    </Upload>
                    {renderGrid(thumbnailImages)}
                  </Space>
                ),
              },
              {
                key: 'items',
                label: '이벤트 본문 (events)',
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => handleUpload(file, 'events')}
                    >
                      <Button icon={<UploadOutlined />} loading={uploading}>
                        본문 이미지 업로드
                      </Button>
                    </Upload>
                    {renderGrid(eventImages)}
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Card>
    </div>
  )
}

export default EventImageManagement
