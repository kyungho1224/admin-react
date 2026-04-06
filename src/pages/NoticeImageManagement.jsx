import { useEffect, useState } from 'react'
import { Card, Typography, Button, Space, Upload, message, Image, Row, Col, Popconfirm } from 'antd'
import { UploadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { uploadToS3, listS3Images, deleteS3Image } from '../services/s3Upload'

const { Title, Text } = Typography

function NoticeImageManagement() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState([])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const list = await listS3Images('notices')
      setImages(list || [])
    } catch (error) {
      message.error(error.message || '공지사항 이미지 목록 조회에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      await uploadToS3(file, 'notices')
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

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>공지사항 이미지 관리</Title>
            <Button icon={<ReloadOutlined />} onClick={fetchImages} loading={loading}>
              새로고침
            </Button>
          </div>
          <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload}>
            <Button icon={<UploadOutlined />} loading={uploading}>
              공지사항 이미지 업로드
            </Button>
          </Upload>
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
        </Space>
      </Card>
    </div>
  )
}

export default NoticeImageManagement
