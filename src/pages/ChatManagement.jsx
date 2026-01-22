import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, Button, Space, Typography, message, Tag, Select, Input, Image, Row, Col, Upload, Popconfirm } from 'antd'
import { ReloadOutlined, SendOutlined, PaperClipOutlined, DeleteOutlined, PictureOutlined, PlayCircleOutlined, FileOutlined, MessageOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getRoomMessages, getGlobalMessages, uploadMedia, createAdminMessage, deleteMessage } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import './ChatManagement.css'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

function ChatManagement() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [roomId, setRoomId] = useState(null)
  const [preferredLang, setPreferredLang] = useState('ko')
  const [nextBeforeId, setNextBeforeId] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [viewType, setViewType] = useState('global') // 'global' or 'room'
  
  // 메시지 전송 관련
  const [messageText, setMessageText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [selectedAdminId, setSelectedAdminId] = useState('admin')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState(null) // 영상 썸네일 파일
  const [replyingTo, setReplyingTo] = useState(null) // 답장할 메시지
  
  const chatEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  // 채팅 목록 조회
  const fetchMessages = useCallback(async (beforeId = null) => {
    setLoading(true)
    try {
      let response
      if (viewType === 'room' && roomId) {
        response = await getRoomMessages(roomId, preferredLang, beforeId, 50)
      } else {
        response = await getGlobalMessages(preferredLang, beforeId, 50)
      }

      const newMessages = response.items || []
      
      if (beforeId) {
        // 더 보기: 기존 메시지 앞에 추가
        setMessages((prev) => [...newMessages, ...prev])
      } else {
        // 초기 로드 또는 새로고침: 기존 메시지 교체 (시간순 정렬)
        const sorted = newMessages.sort((a, b) => {
          const timeA = new Date(a.ts).getTime()
          const timeB = new Date(b.ts).getTime()
          return timeA - timeB
        })
        setMessages(sorted)
      }

      setNextBeforeId(response.nextBeforeId || null)
      setHasMore(!!response.nextBeforeId)
    } catch (error) {
      console.error('채팅 목록 조회 실패:', error)
      message.error(error.message || '채팅 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [viewType, roomId, preferredLang])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // 메시지가 업데이트되면 스크롤을 맨 아래로
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 더 보기 버튼 클릭
  const handleLoadMore = () => {
    if (nextBeforeId) {
      fetchMessages(nextBeforeId)
    }
  }

  // 영상 썸네일 생성
  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      let videoUrl = null

      // 타임아웃 설정 (10초)
      const timeout = setTimeout(() => {
        if (videoUrl) URL.revokeObjectURL(videoUrl)
        reject(new Error('썸네일 생성 타임아웃'))
      }, 10000)

      const cleanup = () => {
        clearTimeout(timeout)
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl)
          videoUrl = null
        }
      }

      video.preload = 'metadata'
      video.muted = true // 음소거하여 자동 재생 가능하게
      video.playsInline = true

      video.onloadedmetadata = () => {
        try {
          // 비디오 길이 확인 (1초 미만이면 0초로)
          const seekTime = video.duration > 1 ? 1 : 0
          video.currentTime = seekTime
          console.log('[ChatManagement] 비디오 메타데이터 로드 완료:', {
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            seekTime
          })
        } catch (error) {
          cleanup()
          reject(new Error(`메타데이터 로드 실패: ${error.message}`))
        }
      }

      video.onseeked = () => {
        try {
          // 캔버스 크기 설정 (최대 800px)
          const maxSize = 800
          let width = video.videoWidth
          let height = video.videoHeight

          if (width === 0 || height === 0) {
            cleanup()
            reject(new Error('비디오 크기를 가져올 수 없습니다'))
            return
          }

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          // 프레임을 캔버스에 그리기
          ctx.drawImage(video, 0, 0, width, height)

          // 캔버스를 Blob으로 변환
          canvas.toBlob(
            (blob) => {
              cleanup()
              if (blob) {
                // File 객체로 변환
                const thumbnailFile = new File([blob], `thumb_${videoFile.name.replace(/\.[^/.]+$/, '')}.jpg`, {
                  type: 'image/jpeg',
                })
                console.log('[ChatManagement] 썸네일 파일 생성 완료:', {
                  name: thumbnailFile.name,
                  size: thumbnailFile.size,
                  type: thumbnailFile.type
                })
                resolve(thumbnailFile)
              } else {
                reject(new Error('썸네일 Blob 생성 실패'))
              }
            },
            'image/jpeg',
            0.85
          )
        } catch (error) {
          cleanup()
          reject(error)
        }
      }

      video.onerror = (e) => {
        cleanup()
        console.error('[ChatManagement] 비디오 로드 에러:', e)
        reject(new Error('영상 로드 실패'))
      }

      // 비디오 URL 생성
      videoUrl = URL.createObjectURL(videoFile)
      video.src = videoUrl
    })
  }

  // 파일 선택
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 검증
      const maxSize = file.type.startsWith('image/') 
        ? 10 * 1024 * 1024  // 10MB
        : file.type.startsWith('video/')
        ? 100 * 1024 * 1024 // 100MB
        : 50 * 1024 * 1024  // 50MB

      if (file.size > maxSize) {
        message.error(`파일 크기가 너무 큽니다. (최대 ${maxSize / 1024 / 1024}MB)`)
        // input value 초기화
        e.target.value = ''
        return
      }

      setSelectedFile(file)
      setThumbnailFile(null) // 기존 썸네일 초기화

      // 영상인 경우 썸네일 생성
      if (file.type.startsWith('video/')) {
        try {
          const thumbnail = await generateVideoThumbnail(file)
          setThumbnailFile(thumbnail)
          console.log('[ChatManagement] 영상 썸네일 생성 완료:', thumbnail.name)
        } catch (error) {
          console.error('[ChatManagement] 썸네일 생성 실패:', error)
          message.warning('썸네일 생성에 실패했습니다. 영상은 업로드되지만 썸네일이 없을 수 있습니다.')
        }
      }
    }
    // 같은 파일을 다시 선택할 수 있도록 value 초기화
    e.target.value = null
  }

  // 미디어 타입 감지
  const detectMediaType = (file) => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    return 'file'
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedFile) {
      message.warning('메시지 또는 파일을 입력해주세요.')
      return
    }

    if (viewType === 'room' && !roomId) {
      message.warning('방 ID를 입력해주세요.')
      return
    }

    setSending(true)

    try {
      let mediaData = null

      // 현재 방 ID 결정
      const currentRoomId = viewType === 'room' ? roomId : 1 // 글로벌은 roomId 1

      // 1. 파일이 있으면 먼저 업로드
      if (selectedFile) {
        setUploading(true)
        try {
          const userId = user?.username || selectedAdminId
          console.log('[ChatManagement] 파일 업로드 시작:', {
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            roomId: currentRoomId,
            userId
          })
          
          // 메인 파일 업로드
          const uploadResult = await uploadMedia(selectedFile, currentRoomId, userId)
          console.log('[ChatManagement] 파일 업로드 성공:', uploadResult)
          
          // 영상인 경우 썸네일도 업로드
          let thumbnailUrl = uploadResult.thumbnailUrl || null
          console.log('[ChatManagement] 썸네일 체크:', {
            isVideo: selectedFile.type.startsWith('video/'),
            hasThumbnailFile: !!thumbnailFile,
            thumbnailFile: thumbnailFile ? { name: thumbnailFile.name, size: thumbnailFile.size, type: thumbnailFile.type } : null
          })
          
          if (selectedFile.type.startsWith('video/') && thumbnailFile) {
            try {
              console.log('[ChatManagement] 썸네일 업로드 시작:', {
                name: thumbnailFile.name,
                size: thumbnailFile.size,
                type: thumbnailFile.type,
                roomId: currentRoomId,
                userId
              })
              const thumbnailResult = await uploadMedia(thumbnailFile, currentRoomId, userId)
              thumbnailUrl = thumbnailResult.fileUrl
              console.log('[ChatManagement] 썸네일 업로드 성공:', thumbnailUrl)
            } catch (thumbError) {
              console.error('[ChatManagement] 썸네일 업로드 실패:', thumbError)
              message.warning('썸네일 업로드에 실패했습니다. 영상은 업로드되었습니다.')
            }
          } else if (selectedFile.type.startsWith('video/') && !thumbnailFile) {
            console.warn('[ChatManagement] 영상이지만 썸네일 파일이 없습니다.')
          }
          
          // 백엔드 MediaInfo 모델과 동일한 형식으로 생성
          mediaData = {
            type: detectMediaType(selectedFile),
            // 링크 전용 (null)
            linkUrl: null,
            linkTitle: null,
            linkDescription: null,
            linkImageUrl: null,
            linkSiteName: null,
            // 파일 공통
            fileUrl: uploadResult.fileUrl,
            thumbnailUrl: thumbnailUrl,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            fileName: uploadResult.fileName,
            // 이미지/영상 전용
            width: uploadResult.width || null,
            height: uploadResult.height || null,
            duration: uploadResult.duration || null,
          }
          console.log('[ChatManagement] mediaData 생성 완료:', {
            ...mediaData,
            thumbnailUrl: mediaData.thumbnailUrl ? `${mediaData.thumbnailUrl.substring(0, 50)}...` : 'null'
          })
        } catch (uploadError) {
          console.error('[ChatManagement] 파일 업로드 실패:', uploadError)
          setUploading(false)
          throw uploadError
        }
        setUploading(false)
      }

      // 2. 메시지 생성
      console.log('[ChatManagement] 메시지 생성 시작:', {
        roomId: currentRoomId,
        text: messageText.trim() || (mediaData ? '📎' : ''),
        srcLang: preferredLang,
        adminId: selectedAdminId,
        media: mediaData
      })
      
      const response = await createAdminMessage(
        currentRoomId,
        messageText.trim() || (mediaData ? '📎' : ''),
        preferredLang,
        null,
        replyingTo?.id || null, // 답장할 메시지의 ID를 parentId로 전달
        selectedAdminId,
        mediaData
      )
      
      console.log('[ChatManagement] 메시지 생성 완료, 응답:', response)
      console.log('[ChatManagement] 응답에 media 포함 여부:', !!response?.media)

      // 성공 시 초기화 및 새로고침
      setMessageText('')
      setSelectedFile(null)
      setThumbnailFile(null)
      setReplyingTo(null) // 답장 모드 해제
      // 파일 input value 초기화 (같은 파일을 다시 선택할 수 있도록)
      const imageInput = document.getElementById('image-input')
      const videoInput = document.getElementById('video-input')
      const fileInput = document.getElementById('file-input')
      if (imageInput) imageInput.value = ''
      if (videoInput) videoInput.value = ''
      if (fileInput) fileInput.value = ''
      await fetchMessages()
      message.success('메시지가 전송되었습니다.')
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      message.error(error.message || '메시지 전송에 실패했습니다.')
    } finally {
      setUploading(false)
      setSending(false)
    }
  }

  // 메시지 렌더링
  const renderMessage = (msg) => {
    const isAdmin = msg.messageType === 'admin'
    const isSystem = msg.messageType === 'system'
    const time = dayjs(msg.ts).format('HH:mm')
    const hasParent = msg.parentId || msg.parentPreview
    
    // 원본 메시지 찾기
    const parentMessage = msg.parentId ? messages.find(m => m.id === msg.parentId) : null

    return (
      <div
        key={msg.id}
        className={`message-item ${isAdmin ? 'message-admin' : isSystem ? 'message-system' : 'message-user'}`}
      >
        <div className="message-content">
          {/* 답장 메시지인 경우 원본 메시지 정보 표시 */}
          {hasParent && (
            <div style={{ 
              padding: '6px 10px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              marginBottom: '8px',
              borderLeft: '3px solid #1890ff',
              fontSize: '12px'
            }}>
              <Text type="secondary">답장: </Text>
              {msg.parentPreview ? (
                <Text style={{ fontSize: '12px' }}>
                  {msg.parentPreview.nickname || msg.parentPreview.userId || '유저'}: {msg.parentPreview.displayText || msg.parentPreview.text || (msg.parentPreview.media ? '📎' : '')}
                </Text>
              ) : parentMessage ? (
                <Text style={{ fontSize: '12px' }}>
                  {parentMessage.nickname || parentMessage.userId || '유저'}: {parentMessage.displayText || parentMessage.text || (parentMessage.media ? '📎' : '')}
                </Text>
              ) : (
                <Text style={{ fontSize: '12px' }}>메시지 ID: {msg.parentId}</Text>
              )}
            </div>
          )}

          {!isAdmin && !isSystem && (
            <div className="message-header">
              <span className="message-nickname">{msg.nickname || msg.userId}</span>
              {msg.isPremium && <Tag color="gold" size="small">프리미엄</Tag>}
              {msg.achievementName && <Tag color="blue" size="small">{msg.achievementName}</Tag>}
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined />}
                onClick={() => setReplyingTo(msg)}
                style={{ marginLeft: '8px', padding: '0 4px' }}
                title="답장"
              />
            </div>
          )}
          
          {isAdmin && <div className="message-header"><span className="message-nickname">관리자</span></div>}
          {isSystem && <div className="message-header"><span className="message-nickname">시스템</span></div>}

          {/* 미디어 렌더링 */}
          {msg.media && (
            <div className="message-media">
              {msg.media.type === 'image' && (
                <Image
                  src={msg.media.thumbnailUrl || msg.media.fileUrl}
                  alt={msg.media.fileName || '이미지'}
                  style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '8px' }}
                  preview={{
                    src: msg.media.fileUrl,
                  }}
                />
              )}
              
              {msg.media.type === 'video' && (
                <div className="video-container">
                  <video
                    controls
                    style={{
                      maxWidth: '400px',
                      maxHeight: '400px',
                      borderRadius: '8px',
                      backgroundColor: '#000',
                    }}
                    preload="metadata"
                  >
                    <source src={msg.media.fileUrl} type={msg.media.mimeType || 'video/mp4'} />
                    <Text type="secondary">브라우저가 비디오 태그를 지원하지 않습니다.</Text>
                    <br />
                    <a href={msg.media.fileUrl} target="_blank" rel="noopener noreferrer">
                      다운로드
                    </a>
                  </video>
                </div>
              )}
              
              {msg.media.type === 'file' && (
                <div className="file-container">
                  <PaperClipOutlined />
                  <a href={msg.media.fileUrl} target="_blank" rel="noopener noreferrer">
                    {msg.media.fileName || '파일'}
                  </a>
                  <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                    ({(msg.media.fileSize / 1024 / 1024).toFixed(2)} MB)
                  </Text>
                </div>
              )}
              
              {msg.media.type === 'link' && (
                <div className="link-container">
                  <a href={msg.media.linkUrl} target="_blank" rel="noopener noreferrer">
                    <div className="link-preview">
                      {msg.media.linkImageUrl && (
                        <img src={msg.media.linkImageUrl} alt="링크 미리보기" className="link-image" />
                      )}
                      <div className="link-info">
                        <div className="link-title">{msg.media.linkTitle || msg.media.linkUrl}</div>
                        {msg.media.linkDescription && (
                          <div className="link-description">{msg.media.linkDescription}</div>
                        )}
                        {msg.media.linkSiteName && (
                          <div className="link-site">{msg.media.linkSiteName}</div>
                        )}
                      </div>
                    </div>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* 텍스트 메시지 */}
          {msg.displayText && (
            <div className="message-text">{msg.displayText}</div>
          )}

          <div className="message-footer">
            <div className="message-time">{time}</div>
            {!msg.isDeleted && (
              <Popconfirm
                title="메시지를 삭제하시겠습니까?"
                onConfirm={() => handleDeleteMessage(msg.id)}
                okText="삭제"
                cancelText="취소"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  style={{ marginLeft: '8px', padding: '0 4px' }}
                />
              </Popconfirm>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 메시지 삭제
  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId)
      message.success('메시지가 삭제되었습니다.')
      // 메시지 목록 새로고침
      await fetchMessages()
    } catch (error) {
      console.error('메시지 삭제 실패:', error)
      message.error(error.message || '메시지 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="chat-management">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>채팅 관리</Title>

          {/* 필터 영역 */}
          <Card>
            <Row gutter={16} align="middle">
              <Col>
                <Space>
                  <span>조회 타입:</span>
                  <Select
                    value={viewType}
                    onChange={setViewType}
                    style={{ width: 120 }}
                  >
                    <Option value="global">글로벌</Option>
                    <Option value="room">방별</Option>
                  </Select>
                </Space>
              </Col>

              {viewType === 'room' && (
                <Col>
                  <Space>
                    <span>방 ID:</span>
                    <Input
                      type="number"
                      placeholder="방 ID 입력"
                      value={roomId || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setRoomId(value ? parseInt(value, 10) : null)
                      }}
                      style={{ width: 150 }}
                    />
                  </Space>
                </Col>
              )}

              <Col>
                <Space>
                  <span>선호 언어:</span>
                  <Select
                    value={preferredLang}
                    onChange={setPreferredLang}
                    style={{ width: 120 }}
                  >
                    <Option value="ko">한국어</Option>
                    <Option value="en">영어</Option>
                    <Option value="ja">일본어</Option>
                    <Option value="zh-Hant">중국어(번체)</Option>
                  </Select>
                </Space>
              </Col>

              <Col>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => fetchMessages()}
                  loading={loading}
                >
                  새로고침
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 채팅창 영역 */}
          <Card className="chat-window-card">
            <div className="chat-container" ref={chatContainerRef}>
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Button onClick={handleLoadMore} loading={loading} size="small">
                    이전 메시지 더 보기
                  </Button>
                </div>
              )}
              
              {messages.map(renderMessage)}
              <div ref={chatEndRef} />
            </div>

            {/* 메시지 입력 영역 */}
            <div className="message-input-area">
              {/* 파일 버튼 영역 */}
              <div className="file-buttons-row">
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading || sending}
                />
                <input
                  type="file"
                  id="video-input"
                  accept="video/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading || sending}
                />
                <input
                  type="file"
                  id="file-input"
                  accept="application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading || sending}
                />
                <Button
                  icon={<PictureOutlined />}
                  disabled={uploading || sending}
                  onClick={() => {
                    const fileInput = document.getElementById('image-input')
                    if (fileInput) {
                      fileInput.click()
                    }
                  }}
                >
                  이미지
                </Button>
                <Button
                  icon={<PlayCircleOutlined />}
                  disabled={uploading || sending}
                  onClick={() => {
                    const fileInput = document.getElementById('video-input')
                    if (fileInput) {
                      fileInput.click()
                    }
                  }}
                >
                  동영상
                </Button>
                <Button
                  icon={<FileOutlined />}
                  disabled={uploading || sending}
                  onClick={() => {
                    const fileInput = document.getElementById('file-input')
                    if (fileInput) {
                      fileInput.click()
                    }
                  }}
                >
                  파일
                </Button>
              </div>

              {selectedFile && (
                <div className="file-preview">
                  <Space>
                    <Text>{selectedFile.name}</Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setSelectedFile(null)
                        setThumbnailFile(null)
                        // 파일 input value 초기화
                        const imageInput = document.getElementById('image-input')
                        const videoInput = document.getElementById('video-input')
                        const fileInput = document.getElementById('file-input')
                        if (imageInput) imageInput.value = ''
                        if (videoInput) videoInput.value = ''
                        if (fileInput) fileInput.value = ''
                      }}
                    />
                  </Space>
                </div>
              )}

              {/* 답장 모드 표시 */}
              {replyingTo && (
                <div className="reply-preview" style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '4px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>답장:</Text>
                    <Text style={{ marginLeft: '8px', fontSize: '12px' }}>
                      {replyingTo.nickname || replyingTo.userId}: {replyingTo.displayText || (replyingTo.media ? '📎' : '')}
                    </Text>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setReplyingTo(null)}
                    style={{ padding: '0 4px' }}
                  >
                    ✕
                  </Button>
                </div>
              )}

              <div className="input-row">
                <Select
                  value={selectedAdminId}
                  onChange={setSelectedAdminId}
                  style={{ width: 100 }}
                  disabled={uploading || sending}
                >
                  <Option value="admin">관리자</Option>
                  <Option value="ido">이도</Option>
                  <Option value="isoon">이순</Option>
                </Select>
                
                <TextArea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={uploading || sending}
                  style={{ flex: 1, margin: '0 8px' }}
                />
                
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={uploading || sending}
                  disabled={(!messageText.trim() && !selectedFile) || (viewType === 'room' && !roomId)}
                >
                  전송
                </Button>
              </div>
            </div>
          </Card>
        </Space>
      </Card>
    </div>
  )
}

export default ChatManagement
