## Founder Membership - 유저별 판매 실적 화면/API 설계 초안

### 1. 목적

- **목표**: 공유 링크로 유입된 사용자들의 **상품별 유입수/판매수/수익(임시·확정)을 한눈에 보는 어드민 화면**을 만든다.
- **데이터 기준**
  - 방문/판매 성과: `payment.orders`, `payment.promotion_clicks` (선택)
  - 수익/정산: `payment.affiliate_earnings`
  - 상품 메타: `payment.products`, `payment.product_commission_tiers`

---

### 2. 개념 정리 (비즈니스 용어 → DB)

- **공유자(프로모터)**: `payment.users`의 한 명. 자신의 공유 링크로 유입된 주문에 대해 수익을 받는 사용자.
  - 식별 기준
    - DDL 상 추천: `orders.referrer_user_id` (FK: users.id)
    - 기존 설명에 나온 `orders.source = 공유자 닉네임` 방식은 **닉네임 변경, 중복** 문제로 위험 → 실제 구현 시에는 **referrer_user_id + users.nickname** 조합을 쓰는 걸 권장.
- **방문 수(유입수, visits)**:
  - 원칙: `promotion_clicks` 기준
    - `referrer_user_id`, `product_id`, `clicked_at BETWEEN [start, end]`
    - `COUNT(*)` → 방문 수
  - `promotion_clicks` 미사용 시: 임시로 **판매 수 기반 추정** 혹은 0 처리 (현재 문서 기준).
- **판매 수(sales)**:
  - 기준: `payment.orders`
  - 조건:
    - `product_id = ?`
    - 조회 기간: `created_at` 또는 `paid_at` 범위
    - `status IN ('paid','preparing','shipped','delivered','completed')` (취소/환불 제외)
  - 집계: `COUNT(*)`
- **임시 금액(temp_amount)**:
  - 기준: `payment.affiliate_earnings.temp_amount`
  - 의미: 주문 시점 기준 추정 적립금(원, 환율 변동 고려 X).
  - 생성 시점: 주문 결제 완료 후 `affiliate_earnings` INSERT 할 때, 상품 가격 + 수수료율(`products.commission_rate_pct` 또는 `product_commission_tiers`)로 계산.
- **확정 금액(final_amount)**:
  - 기준: `payment.affiliate_earnings.final_amount`
  - 의미: 어드민이 **정산 시점 환율** 등을 반영해 확정한 금액(원).
  - 상태 파생:
    - 집계 중: `final_amount IS NULL`
    - 지급 예정: `final_amount IS NOT NULL AND paid_at IS NULL`
    - 지급 완료: `paid_at IS NOT NULL`

---

### 3. 화면 구성(초안)

#### 3.1 상단 필터 영역

- **공통 필터**
  - 기간: `시작일 ~ 종료일`
  - 상품: `상품 선택 (멀티 선택 가능)` — `products`에서 active 상품 목록 조회
  - 공유자 검색:
    - 검색 인풋 + 자동완성 (`닉네임 / 이메일 / user_id` 기준)
    - 하나 선택 시 “특정 공유자 기준 상세” 모드로 전환
- **보기 모드 토글**
  - `전체 공유자 보기` / `특정 공유자 보기`

#### 3.2 그래프 영역

1) **전체 공유자 기준(또는 특정 공유자 기준) 상품별 성과 그래프**

- X축: 상품
- Y축(왼쪽): 방문 수(바 차트)
- Y축(오른쪽): 판매 수(라인 또는 바)
- 데이터 포인트:
  - `visits` = promotion_clicks COUNT (또는 0/추정)
  - `sales` = orders COUNT

2) **시간 축 그래프 (선택)**

- 토글: `일별 / 주별 / 월별`
- X축: 날짜/주/월
- Y축:
  - 방문 수 (promotion_clicks)
  - 판매 수 (orders)

#### 3.3 하단 테이블 영역 - “유저별 · 상품별 상세”

- 그리드 단위: **[공유자, 상품]** 조합 1행
- 컬럼 예시:
  - 공유자 정보: `user_id`, `닉네임`, `이메일`
  - 상품 정보: `product_id`, `상품명`, `currency`
  - **유입수(Visits)**: `visits`
  - **판매수(Sales)**: `sales`
  - **전환율(%)**: `sales / visits * 100` (visits=0이면 0)
  - **임시 금액 합계 (temp_amount_sum)**:
    - `SUM(temp_amount)` from `affiliate_earnings` (해당 user_id+product_id+기간)
  - **확정 금액 합계 (final_amount_sum)**:
    - `SUM(final_amount)` (NULL일 경우 temp_amount로 대체 여부는 정책에 따라)
  - **지급 상태 요약**:
    - 집계 중 건수: `COUNT(*) WHERE final_amount IS NULL`
    - 지급 예정 건수: `COUNT(*) WHERE final_amount IS NOT NULL AND paid_at IS NULL`
    - 지급 완료 건수: `COUNT(*) WHERE paid_at IS NOT NULL`
  - 액션:
    - “상세 보기” 버튼 → 해당 공유자+상품 기준으로 **개별 affiliate_earnings 레코드 모달** 오픈

#### 3.4 개별 정산 내역 모달 (affiliate_earnings 단위)

- 목록 컬럼:
  - 주문 ID (`orders.id`, `orders.order_id_toss`)
  - 주문일, 결제일
  - 주문 금액, 통화
  - temp_amount
  - final_amount (편집 가능 인라인 인풋 또는 Form)
  - 상태(집계중/지급예정/지급완료)
- 기능:
  - **final_amount 일괄 입력**:
    - 선택된 행들에 대해 “임시 금액 × 환율값”으로 일괄 채우기
  - **지급 완료 처리**:
    - 선택된 행들에 대해 `paid_at = NOW()` 설정 요청

---

### 4. 백엔드 API 설계(어드민 전용, 초안)

실제 패스/쿼리는 notification-service 내 새로운 router 또는 기존 router에 추가. 아래는 **형태만 합의용**으로 제안.

#### 4.1 유저별 상품 성과 집계 API

- **Endpoint (예시)**  
  - `GET /v3_admin/store/performance/by-user-product`
- **Query 파라미터 (예시)**:
  - `start_date`: YYYY-MM-DD
  - `end_date`: YYYY-MM-DD
  - `product_ids`: 쉼표 구분 ID 리스트 (옵션)
  - `user_keyword`: 공유자 검색 키워드 (닉네임/이메일/user_id) (옵션)
  - `limit`, `offset`: 페이지네이션
- **Response (예시)**:

```json
{
  "data": [
    {
      "user_id": 123,
      "nickname": "홍길동",
      "email": "test@example.com",
      "product_id": 1,
      "product_title": "Founder Membership",
      "currency": "USD",
      "visits": 120,
      "sales": 15,
      "conversion_rate": 12.5,
      "temp_amount_sum": 450000,
      "final_amount_sum": 420000,
      "aggregating_count": 3,
      "scheduled_count": 5,
      "paid_count": 7
    }
  ],
  "pagination": {
    "total": 123,
    "limit": 20,
    "offset": 0
  }
}
```

- **쿼리 개념**
  - 기준 테이블: `affiliate_earnings` (user_id, product_id, temp_amount, final_amount, paid_at)
  - 기간 필터:
    - 우선 `orders.paid_at` 기준으로 기간 필터 → `orders.id = affiliate_earnings.order_id` 조인
  - 방문 수:
    - `promotion_clicks` 있으면: `referrer_user_id=user_id AND product_id` 기준 집계
    - 없으면 0 또는 추정

#### 4.2 개별 affiliate_earnings 목록/수정 API

1) **목록 조회**

- `GET /v3_admin/store/earnings`
- Query:
  - `user_id`, `product_id`, `start_date`, `end_date`, `status`(집계중/지급예정/지급완료), `limit`, `offset`
- Response: `affiliate_earnings` + `orders` 일부 조인 정보

2) **final_amount 입력/수정**

- `PATCH /v3_admin/store/earnings/{earning_id}/final-amount`
- Body:

```json
{
  "final_amount": 12345
}
```

- 로직:
  - `final_amount` 업데이트
  - 상태는 컬럼 조합으로 파생 (별도 status 컬럼 없음)

3) **지급 완료 처리**

- `POST /v3_admin/store/earnings/mark-paid`
- Body:

```json
{
  "earning_ids": [1, 2, 3]
}
```

- 로직:
  - 지정된 id들에 대해 `paid_at = NOW()` 업데이트

---

### 5. 프론트엔드 구현 방향 (admin-react 기준)

#### 5.1 페이지 구조

- 파일: `src/pages/FounderMembershipSales.jsx` (이미 생성된 베이스에 확장)
- 주요 섹션:
  1. 필터 폼 (날짜 범위, 상품, 공유자 검색, 보기 모드)
  2. 상단 그래프 영역 (상품별 유입/판매)
  3. 하단 테이블 (유저별·상품별 성과)
  4. affiliate_earnings 상세 모달 (final_amount 편집/지급 처리)

#### 5.2 서비스 모듈

- 파일: `src/services/api/storePerformance.js` (예시)
  - `listUserProductPerformance(params)` → §4.1 API 호출
  - `listAffiliateEarnings(params)` → §4.2-1 API 호출
  - `updateEarningFinalAmount(id, body)` → §4.2-2
  - `markEarningsPaid(body)` → §4.2-3

---

### 6. 남은 의사 결정 포인트

- [ ] **공유자 식별을 source(닉네임 문자열)로 할지, referrer_user_id로 할지**  
      → 문서/DDL 기준으론 `referrer_user_id` + `users.nickname` 사용이 더 안전. 현재 구현 상태 확인 필요.
- [ ] 방문 수를 **promotion_clicks로 바로 쓸 수 있는지**, 아니면 우선 판매 수 기반 추정으로 시작할지.
- [ ] final_amount를 **개별 earning 단위로만 수정할지**, 아니면 “월별 합계만 입력하고 내부에서 배분” 같은 추가 정책이 필요한지.

---

이 문서는 일단 “유저별 판매 실적” 페이지의 **데이터 흐름 + 화면 구성 + 어드민 API 모양**을 맞추기 위한 초안입니다.  
실제 엔드포인트 경로/파라미터/응답 스키마는 notification-service 구현 상황을 보면서 이 문서를 업데이트하면 됩니다.

