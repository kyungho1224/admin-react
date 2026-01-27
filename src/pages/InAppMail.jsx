import { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Radio, 
  message, 
  Typography, 
  Space, 
  DatePicker,
  Row,
  Col,
  Divider,
  Table,
  Tag,
  Modal
} from 'antd'
import { SendOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { createInAppMail, getStrategies, searchUsers } from '../services/api'
import './InAppMail.css'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

// 앱 내부 라우터 목록 (팝업 관리와 동일)
const IN_APP_ROUTES = [
  { value: 'HOME', label: '홈' },
  { value: 'MAIN', label: '메인' },
  { value: 'SELECT', label: '선택학습 ' },
  { value: 'STUDY', label: '학습' },
  { value: 'GAME', label: '게임' },
  { value: 'MARKET', label: '마켓' },
  { value: 'MARKET_MEMBERSHIP', label: '마켓-멤버십' },
  { value: 'MARKET_GOODS', label: '마켓-상품' },
  { value: 'MARKET_STUDY', label: '마켓-학습' },
  { value: 'MARKET_BOOKS', label: '마켓-교재' },
  { value: 'GUILD', label: '길드' },
  { value: 'RANKING', label: '랭킹' },
  { value: 'MOCKTEST', label: '모의고사' },
  { value: 'MAILBOX', label: '우편함' },
  { value: 'QUEST', label: '퀘스트' },
  { value: 'CLOSET', label: '옷장' },
  { value: 'BAG', label: '가방' },
  { value: 'INVENTORY', label: '인벤토리' },
  { value: 'VOD', label: 'VOD' },
  { value: 'SETTING', label: '설정' },
  { value: 'SETTING_LANG', label: '설정-언어' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'TREASURE', label: '보물' },
  { value: 'FRIENDS', label: '친구-목록' },
  { value: 'FRIENDS_ADD', label: '친구-추가' },
  { value: 'FRIENDS_INVITE', label: '친구-초대' },
  { value: 'TEST', label: '테스트' },
  { value: 'K_LIFE', label: 'K-Life-메인' },
  { value: 'K_LIFE_INFO', label: 'K-Life-정보' },
  { value: 'K_LIFE_PART_TIME', label: 'K-Life-캠페인' },
  { value: 'K_LIFE_FOLLOW_BOOST', label: 'K-Life-팔로워부스터' },
  { value: 'K_LIFE_POST_BOOST', label: 'K-Life-포스트부스터' },
  { value: 'K_LIFE_K_CREATOR', label: 'K-Life-링크플로러' },
  { value: 'WALLET', label: '지갑' },
  { value: 'PURCHASE_DETAIL', label: '결제-상세페이지' },
  { value: 'NEW_YEAR_GOAL', label: '이벤트-새해 다짐' },
  { value: 'ACCOUNT_LINK', label: '계정 연동' },
]

// 지원 언어 목록
const LANGUAGES = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ja', name: '日本語' },
  { code: 'zh-tw', name: '繁體中文' },
  { code: 'fr', name: 'Français' },
  { code: 'zh-cn', name: '简体中文' },
  { code: 'uz', name: "O'zbek" },
  { code: 'ru', name: 'Русский' },
  { code: 'th', name: 'ไทย' },
  { code: 'kk', name: 'Қазақ' },
  { code: 'mn', name: 'Монгол' },
]

function InAppMail() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [notificationTarget, setNotificationTarget] = useState('ALL')
  const [linkType, setLinkType] = useState(null)
  const [labelLanguages, setLabelLanguages] = useState(['ko', 'en'])
  const [contentLanguages, setContentLanguages] = useState(['ko', 'en'])
  const [strategies, setStrategies] = useState([])
  const [loadingStrategies, setLoadingStrategies] = useState(false)
  const [userSearchKeyword, setUserSearchKeyword] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [isUserModalVisible, setIsUserModalVisible] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([]) // 선택된 사용자 정보 저장

  // 전략 목록 로드
  useEffect(() => {
    loadStrategies()
  }, [])

  const loadStrategies = async () => {
    setLoadingStrategies(true)
    try {
      const data = await getStrategies()
      setStrategies(data || [])
    } catch (error) {
      console.error('보상 목록 로드 실패:', error)
      message.error('보상 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoadingStrategies(false)
    }
  }

  // 사용자 검색
  const handleUserSearch = async () => {
    if (!userSearchKeyword.trim()) {
      message.warning('검색어를 입력해주세요.')
      return
    }

    setLoadingUsers(true)
    try {
      const data = await searchUsers(userSearchKeyword.trim(), 100, 0)
      setUserSearchResults(data || [])
    } catch (error) {
      console.error('사용자 검색 실패:', error)
      message.error('사용자 검색에 실패했습니다.')
      setUserSearchResults([])
    } finally {
      setLoadingUsers(false)
    }
  }

  // 사용자 선택
  const handleUserSelect = (selectedRowKeys) => {
    setSelectedUserIds(selectedRowKeys)
  }

  // 선택한 사용자 ID를 폼에 설정
  const handleConfirmUserSelection = () => {
    if (selectedUserIds.length === 0) {
      message.warning('사용자를 선택해주세요.')
      return
    }
    
    // 선택된 사용자 정보 저장
    const newUsers = userSearchResults.filter(user => selectedUserIds.includes(user.user_id))
    const existingUserIds = selectedUsers.map(u => u.user_id)
    const uniqueNewUsers = newUsers.filter(user => !existingUserIds.includes(user.user_id))
    setSelectedUsers([...selectedUsers, ...uniqueNewUsers])
    
    // 폼에 업데이트
    const allUserIds = [...selectedUsers.map(u => u.user_id), ...selectedUserIds]
    form.setFieldValue('group_ids', allUserIds.join(','))
    
    setIsUserModalVisible(false)
    setSelectedUserIds([])
    setUserSearchKeyword('')
    setUserSearchResults([])
  }

  // 사용자 태그 제거
  const handleRemoveUser = (userId) => {
    const updatedUsers = selectedUsers.filter(u => u.user_id !== userId)
    setSelectedUsers(updatedUsers)
    form.setFieldValue('group_ids', updatedUsers.map(u => u.user_id).join(','))
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      // labels와 contents 객체 생성
      const labels = {}
      const contents = {}
      
      // labels 수집
      labelLanguages.forEach(lang => {
        if (values[`label_${lang}`]) {
          labels[lang] = values[`label_${lang}`]
        }
      })
      
      // contents 수집
      contentLanguages.forEach(lang => {
        if (values[`content_${lang}`]) {
          contents[lang] = values[`content_${lang}`]
        }
      })

      // group_ids 처리
      let groupIds = []
      if (notificationTarget === 'GROUP') {
        if (values.group_ids) {
          // 쉼표로 구분된 문자열을 배열로 변환
          if (typeof values.group_ids === 'string') {
            groupIds = values.group_ids
              .split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id))
          } else if (Array.isArray(values.group_ids)) {
            groupIds = values.group_ids
          }
        }
        
        if (groupIds.length === 0) {
          message.error('notification_target이 GROUP일 때는 group_ids가 필수입니다.')
          setLoading(false)
          return
        }
      }

      // strategy_ids 처리
      let strategyIds = []
      if (values.strategy_ids) {
        if (typeof values.strategy_ids === 'string') {
          strategyIds = values.strategy_ids
            .split(',')
            .map(id => parseInt(id.trim()))
            .filter(id => !isNaN(id))
        } else if (Array.isArray(values.strategy_ids)) {
          strategyIds = values.strategy_ids
        }
      }

      // expired_at 처리
      let expiredAt = null
      if (values.expired_at) {
        expiredAt = dayjs(values.expired_at).format('YYYY-MM-DD HH:mm:ss')
      }

      const mailData = {
        notification_type: values.notification_type,
        notification_target: notificationTarget,
        labels,
        contents,
        link_type: linkType || null,
        link_target: values.link_target || null,
        strategy_ids: strategyIds,
        group_ids: groupIds,
        ads_reward_flag: values.ads_reward_flag !== false,
        expired_at: expiredAt,
      }

      console.log('[InAppMail] 발송 데이터:', mailData)

      const result = await createInAppMail(mailData)
      
      message.success('인앱 메일이 성공적으로 발송되었습니다.')
      form.resetFields()
      setNotificationTarget('ALL')
      setLinkType(null)
      setLabelLanguages(['ko', 'en'])
      setContentLanguages(['ko', 'en'])
    } catch (error) {
      console.error('인앱 메일 발송 실패:', error)
      message.error(error.message || '인앱 메일 발송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const addLanguage = (type) => {
    const availableLanguages = LANGUAGES.filter(
      lang => !(type === 'label' ? labelLanguages : contentLanguages).includes(lang.code)
    )
    
    if (availableLanguages.length === 0) {
      message.info('추가할 수 있는 언어가 없습니다.')
      return
    }

    // 첫 번째 사용 가능한 언어 추가
    const newLang = availableLanguages[0].code
    if (type === 'label') {
      setLabelLanguages([...labelLanguages, newLang])
    } else {
      setContentLanguages([...contentLanguages, newLang])
    }
  }

  const removeLanguage = (type, langCode) => {
    if (type === 'label') {
      if (labelLanguages.length <= 1) {
        message.warning('최소 하나의 언어는 필요합니다.')
        return
      }
      setLabelLanguages(labelLanguages.filter(lang => lang !== langCode))
      form.setFieldValue(`label_${langCode}`, undefined)
    } else {
      if (contentLanguages.length <= 1) {
        message.warning('최소 하나의 언어는 필요합니다.')
        return
      }
      setContentLanguages(contentLanguages.filter(lang => lang !== langCode))
      form.setFieldValue(`content_${langCode}`, undefined)
    }
  }

  return (
    <div className="in-app-mail">
      <Title level={2}>인앱 메일 발송</Title>
      
      <Card style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            notification_type: 'ANNOUNCEMENT',
            notification_target: 'ALL',
            ads_reward_flag: true,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="알림 타입"
                name="notification_type"
                rules={[{ required: true, message: '알림 타입을 선택해주세요.' }]}
              >
                <Select>
                  <Option value="SYSTEM_GIFT">SYSTEM_GIFT</Option>
                  <Option value="ANNOUNCEMENT">ANNOUNCEMENT</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="수신 대상"
                name="notification_target"
                rules={[{ required: true, message: '수신 대상을 선택해주세요.' }]}
              >
                <Radio.Group
                  onChange={(e) => setNotificationTarget(e.target.value)}
                  value={notificationTarget}
                >
                  <Radio value="ALL">전체 사용자 (ALL)</Radio>
                  <Radio value="GROUP">특정 그룹 (GROUP)</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          {notificationTarget === 'GROUP' && (
            <Form.Item
              label="사용자 선택"
              name="group_ids"
              rules={[{ required: true, message: '사용자를 선택해주세요.' }]}
              tooltip="사용자 검색 후 선택하거나, 직접 user_id를 입력할 수 있습니다."
            >
              <div>
                <Input.Group compact style={{ marginBottom: 8 }}>
                  <Input
                    style={{ width: 'calc(100% - 120px)' }}
                    placeholder="user_id를 직접 입력하거나 검색 버튼을 클릭하세요"
                    value={form.getFieldValue('group_ids') || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      form.setFieldValue('group_ids', value)
                      // 직접 입력한 경우 selectedUsers 업데이트
                      if (value) {
                        const ids = value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        const existingIds = selectedUsers.map(u => u.user_id)
                        const newIds = ids.filter(id => !existingIds.includes(id))
                        if (newIds.length > 0) {
                          // 새로 추가된 ID는 기본 정보로 추가
                          const newUsers = newIds.map(id => ({
                            user_id: id,
                            nickname: null,
                            email: null,
                            external_identifier: null
                          }))
                          setSelectedUsers([...selectedUsers, ...newUsers])
                        }
                        // 제거된 사용자 처리
                        const removedUsers = selectedUsers.filter(u => !ids.includes(u.user_id))
                        if (removedUsers.length > 0) {
                          setSelectedUsers(selectedUsers.filter(u => ids.includes(u.user_id)))
                        }
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                  />
                  <Button
                    icon={<SearchOutlined />}
                    onClick={() => setIsUserModalVisible(true)}
                    style={{ width: '120px' }}
                  >
                    사용자 검색
                  </Button>
                </Input.Group>
                {selectedUsers.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {selectedUsers.map(user => (
                        <Tag
                          key={user.user_id}
                          closable
                          onClose={() => handleRemoveUser(user.user_id)}
                          color="blue"
                        >
                          {user.nickname || user.email || `User ${user.user_id}`} ({user.user_id})
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            </Form.Item>
          )}

          <Divider>제목 (다국어)</Divider>
          
          {labelLanguages.map((langCode) => {
            const langInfo = LANGUAGES.find(l => l.code === langCode)
            return (
              <Form.Item
                key={`label_${langCode}`}
                label={`제목 (${langInfo?.name || langCode})`}
                name={`label_${langCode}`}
                rules={[{ required: true, message: `${langInfo?.name || langCode} 제목을 입력해주세요.` }]}
              >
                <Input.Group compact>
                  <Input
                    style={{ width: 'calc(100% - 40px)' }}
                    placeholder={`${langInfo?.name || langCode} 제목을 입력하세요`}
                  />
                  {labelLanguages.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeLanguage('label', langCode)}
                      style={{ width: '40px' }}
                    />
                  )}
                </Input.Group>
              </Form.Item>
            )
          })}
          
          <Form.Item>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => addLanguage('label')}
              block
            >
              언어 추가
            </Button>
          </Form.Item>

          <Divider>내용 (다국어)</Divider>
          
          {contentLanguages.map((langCode) => {
            const langInfo = LANGUAGES.find(l => l.code === langCode)
            return (
              <Form.Item
                key={`content_${langCode}`}
                label={`내용 (${langInfo?.name || langCode})`}
                name={`content_${langCode}`}
                rules={[{ required: true, message: `${langInfo?.name || langCode} 내용을 입력해주세요.` }]}
              >
                <Input.Group compact>
                  <TextArea
                    style={{ width: 'calc(100% - 40px)' }}
                    rows={4}
                    placeholder={`${langInfo?.name || langCode} 내용을 입력하세요`}
                    showCount
                    maxLength={5000}
                  />
                  {contentLanguages.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeLanguage('content', langCode)}
                      style={{ width: '40px', height: '100%' }}
                    />
                  )}
                </Input.Group>
              </Form.Item>
            )
          })}
          
          <Form.Item>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => addLanguage('content')}
              block
            >
              언어 추가
            </Button>
          </Form.Item>

          <Divider>링크 설정</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="링크 타입"
                name="link_type"
              >
                <Select
                  placeholder="선택 안 함"
                  allowClear
                  onChange={(value) => setLinkType(value)}
                >
                  <Option value="IN_APP">IN_APP</Option>
                  <Option value="EXTERNAL">EXTERNAL</Option>
                  <Option value="OVERLAY">OVERLAY</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              {linkType && (
                <Form.Item
                  label="링크 대상"
                  name="link_target"
                  tooltip={linkType === 'IN_APP' ? '앱 내부 라우터 선택' : linkType === 'OVERLAY' ? 'OVERLAY 타입 (예: TUTORIAL)' : '외부 URL'}
                >
                  {linkType === 'IN_APP' ? (
                    <Select placeholder="앱 내부 라우터 선택">
                      {IN_APP_ROUTES.map(route => (
                        <Option key={route.value} value={route.value}>
                          {route.label}
                        </Option>
                      ))}
                    </Select>
                  ) : linkType === 'OVERLAY' ? (
                    <Input placeholder="예: TUTORIAL" />
                  ) : (
                    <Input placeholder="외부 URL 입력" />
                  )}
                </Form.Item>
              )}
            </Col>
          </Row>

          <Divider>기타 설정</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="보상 선택"
                name="strategy_ids"
                tooltip="보상을 줄 전략을 선택하세요"
              >
                <Select
                  mode="multiple"
                  placeholder="보상을 선택하세요"
                  loading={loadingStrategies}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={strategies.map(s => ({
                    value: s.strategy_id,
                    label: `${s.strategy_id} - ${s.label} (${s.reward_amount})`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="광고 보상 플래그"
                name="ads_reward_flag"
                valuePropName="checked"
              >
                <Radio.Group>
                  <Radio value={true}>활성화</Radio>
                  <Radio value={false}>비활성화</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="만료일"
            name="expired_at"
            tooltip="기본값: 현재 시간 + 3일"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
              placeholder="만료일 선택 (선택 안 하면 기본값 사용)"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
                size="large"
              >
                발송
              </Button>
              <Button
                onClick={() => {
                  form.resetFields()
                  setNotificationTarget('ALL')
                  setLinkType(null)
                  setLabelLanguages(['ko', 'en'])
                  setContentLanguages(['ko', 'en'])
                  setSelectedUsers([])
                }}
                size="large"
              >
                초기화
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 사용자 검색 모달 */}
      <Modal
        title="사용자 검색 및 선택"
        open={isUserModalVisible}
        onCancel={() => {
          setIsUserModalVisible(false)
          setSelectedUserIds([])
          setUserSearchKeyword('')
          setUserSearchResults([])
        }}
        onOk={handleConfirmUserSelection}
        okText="선택 완료"
        cancelText="취소"
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 100px)' }}
              placeholder="user_id, 닉네임, 이메일로 검색"
              value={userSearchKeyword}
              onChange={(e) => setUserSearchKeyword(e.target.value)}
              onPressEnter={handleUserSearch}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleUserSearch}
              loading={loadingUsers}
              style={{ width: '100px' }}
            >
              검색
            </Button>
          </Input.Group>

          <Table
            dataSource={userSearchResults}
            loading={loadingUsers}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedUserIds,
              onChange: handleUserSelect,
            }}
            rowKey="user_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `총 ${total}개`,
            }}
            columns={[
              {
                title: 'User ID',
                dataIndex: 'user_id',
                key: 'user_id',
                width: 100,
              },
              {
                title: '닉네임',
                dataIndex: 'nickname',
                key: 'nickname',
                width: 150,
              },
              {
                title: '이메일',
                dataIndex: 'email',
                key: 'email',
                width: 200,
              },
              {
                title: 'External ID',
                dataIndex: 'external_identifier',
                key: 'external_identifier',
                ellipsis: true,
              },
            ]}
          />

          {selectedUserIds.length > 0 && (
            <div>
              <Typography.Text strong>선택된 사용자: </Typography.Text>
              <Tag color="blue">{selectedUserIds.length}명</Tag>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  )
}

export default InAppMail
