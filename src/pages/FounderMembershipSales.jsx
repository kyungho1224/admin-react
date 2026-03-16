import React, { useState } from 'react'
import { Card, Table, Typography } from 'antd'
import './FounderMembershipSales.css'

const { Title } = Typography

function FounderMembershipSales() {
  const [loading] = useState(false)
  const columns = [
    { title: '유저 ID', dataIndex: 'user_id', key: 'user_id', width: 120 },
    { title: '유저명', dataIndex: 'user_name', key: 'user_name', width: 150 },
    { title: '판매 수', dataIndex: 'sales_count', key: 'sales_count', width: 100 },
    { title: '매출', dataIndex: 'revenue', key: 'revenue', width: 120 },
  ]

  return (
    <div className="founder-membership-sales">
      <Title level={4}>유저별 판매 실적</Title>
      <Card>
        <Table
          columns={columns}
          dataSource={[]}
          rowKey="user_id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `총 ${t}건` }}
          locale={{ emptyText: '유저별 판매 실적 데이터가 없습니다.' }}
        />
      </Card>
    </div>
  )
}

export default FounderMembershipSales
