import { useState, useEffect } from 'react'
import { Card, Button, Space, Typography, message, Image, Modal, Upload, Row, Col, Popconfirm, Tabs } from 'antd'
import { PlusOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons'
import { uploadToS3, listS3Images, deleteS3Image } from '../services/s3Upload'
import './ImageManagement.css'

const { Title } = Typography
const { TabPane } = Tabs

function ClassImageManagement() {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState({ thumbnail: false, detail: false })
  const [thumbnailImages, setThumbnailImages] = useState([])
  const [detailImages, setDetailImages] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [activeTab, setActiveTab] = useState('thumbnail')

  // 이미지 목록 조회
  const fetchImages = async (type) => {
    setLoading(true)
    try {
      const folder = `class-reservation/${type}`
      const imageList = await listS3Images(folder)
      if (type === 'thumbnail') {
        setThumbnailImages(imageList)
      } else {
        setDetailImages(imageList)
      }
      if (imageList.length === 0) {
        message.info('업로드된 이미지가 없습니다.')
      }
    } catch (error) {
      console.error('이미지 목록 조회 실패:', error)
      const errorMessage = error.message || '이미지 목록을 불러오는데 실패했습니다.'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages('thumbnail')
    fetchImages('detail')
  }, [])

  // 이미지 업로드
  const handleUpload = async (file, type) => {
    setUploading({ ...uploading, [type]: true })
    try {
      const folder = `class-reservation/${type}`
      await uploadToS3(file, folder)
      message.success('이미지가 업로드되었습니다.')
      fetchImages(type) // 목록 새로고침
    } catch (error) {
      message.error(error.message || '이미지 업로드에 실패했습니다.')
    } finally {
      setUploading({ ...uploading, [type]: false })
    }
    return false // 자동 업로드 방지
  }

  // 이미지 삭제
  const handleDelete = async (image, type) => {
    try {
      await deleteS3Image(image.key)
      message.success('이미지가 삭제되었습니다.')
      fetchImages(type) // 목록 새로고침
    } catch (error) {
      message.error(error.message || '이미지 삭제에 실패했습니다.')
    }
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderImageGrid = (images, type) => {
    if (images.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
          업로드된 이미지가 없습니다.
        </div>
      )
    }

    return (
      <Row gutter={[16, 16]}>
        {images.map((image) => (
          <Col xs={12} sm={8} md={6} lg={4} key={image.key}>
            <Card
              hoverable
              cover={
                <Image
                  src={image.url}
                  alt={image.fileName}
                  style={{ height: 200, objectFit: 'cover' }}
                  preview={false}
                  onClick={() => setPreviewImage(image)}
                />
              }
              actions={[
                <Popconfirm
                  title="이미지를 삭제하시겠습니까?"
                  description="이 작업은 되돌릴 수 없습니다."
                  onConfirm={() => handleDelete(image, type)}
                  okText="삭제"
                  cancelText="취소"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  >
                    삭제
                  </Button>
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={
                  <Typography.Text ellipsis style={{ width: '100%', display: 'block' }}>
                    {image.fileName}
                  </Typography.Text>
                }
                description={
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {formatFileSize(image.size)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4 }}>
                      {image.lastModified
                        ? new Date(image.lastModified).toLocaleDateString('ko-KR')
                        : '-'}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <div className="image-management">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          클래스 이미지 관리
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => {
          fetchImages('thumbnail')
          fetchImages('detail')
        }} loading={loading}>
          새로고침
        </Button>
      </div>

      <Card loading={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab="썸네일 이미지"
            key="thumbnail"
          >
            <div style={{ marginBottom: 16 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => handleUpload(file, 'thumbnail')}
                disabled={uploading.thumbnail}
              >
                <Button
                  type="primary"
                  icon={uploading.thumbnail ? <LoadingOutlined /> : <UploadOutlined />}
                  loading={uploading.thumbnail}
                >
                  썸네일 이미지 업로드
                </Button>
              </Upload>
            </div>
            {renderImageGrid(thumbnailImages, 'thumbnail')}
          </TabPane>

          <TabPane
            tab="상세 이미지"
            key="detail"
          >
            <div style={{ marginBottom: 16 }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => handleUpload(file, 'detail')}
                disabled={uploading.detail}
              >
                <Button
                  type="primary"
                  icon={uploading.detail ? <LoadingOutlined /> : <UploadOutlined />}
                  loading={uploading.detail}
                >
                  상세 이미지 업로드
                </Button>
              </Upload>
            </div>
            {renderImageGrid(detailImages, 'detail')}
          </TabPane>
        </Tabs>
      </Card>

      {/* 이미지 미리보기 모달 */}
      <Modal
        open={!!previewImage}
        onCancel={() => setPreviewImage(null)}
        footer={null}
        width={800}
        centered
      >
        {previewImage && (
          <div>
            <Image
              src={previewImage.url}
              alt={previewImage.fileName}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 16 }}>
              <Typography.Text strong>파일명: </Typography.Text>
              <Typography.Text copyable={{ text: previewImage.fileName }}>
                {previewImage.fileName}
              </Typography.Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Typography.Text strong>URL: </Typography.Text>
              <Typography.Text copyable={{ text: previewImage.url }} ellipsis>
                {previewImage.url}
              </Typography.Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Typography.Text strong>크기: </Typography.Text>
              <Typography.Text>{formatFileSize(previewImage.size)}</Typography.Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ClassImageManagement
