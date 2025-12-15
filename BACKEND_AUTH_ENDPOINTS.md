# 백엔드 인증 엔드포인트 구현 가이드

Streamlit 코드를 기반으로 FastAPI 백엔드에 로그인/회원가입 엔드포인트를 추가해야 합니다.

## 필요한 엔드포인트

### 1. 로그인 엔드포인트
- **경로**: `POST /v3/auth/login`
- **요청 본문**:
```json
{
  "username": "사용자아이디",
  "password": "해싱된비밀번호(SHA256 hex)"
}
```

- **응답**:
```json
{
  "result": {
    "code": 200,
    "body": {
      "user": {
        "username": "사용자아이디",
        "user_role": "ADMIN",
        "company_type": "INTERNAL",
        "company_id": 1,
        "company_name": "회사명"
      }
    }
  }
}
```

### 2. 회원가입 엔드포인트
- **경로**: `POST /v3/auth/signup`
- **요청 본문**:
```json
{
  "username": "사용자아이디",
  "password": "해싱된비밀번호(SHA256 hex)"
}
```

- **응답**:
```json
{
  "result": {
    "code": 200,
    "body": {
      "message": "회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.",
      "username": "사용자아이디"
    }
  }
}
```

## FastAPI 구현 예시

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import hashlib
from typing import Optional
from datetime import datetime

router_v3_auth = APIRouter(prefix="/v3/auth", tags=["auth"])

# 요청 모델
class LoginRequest(BaseModel):
    username: str
    password: str  # 이미 해싱된 비밀번호 (SHA256 hex)

class SignupRequest(BaseModel):
    username: str
    password: str  # 이미 해싱된 비밀번호 (SHA256 hex)

# 응답 모델
class UserResponse(BaseModel):
    username: str
    user_role: str
    company_type: str
    company_id: int
    company_name: str

@router_v3_auth.post("/login", response_model=ApiResponse)
async def login(req: LoginRequest):
    """
    로그인
    - 첫 번째 활성 회사의 사용자만 로그인 가능
    - is_active = True인 사용자만 로그인 가능
    """
    async with get_db_connection() as (conn, cursor):
        # 첫 번째 활성 회사 조회
        await cursor.execute("""
            SELECT company_id, company_name, company_type
            FROM admin_service.company
            WHERE is_active = TRUE
            ORDER BY company_id ASC
            LIMIT 1
        """)
        company = await cursor.fetchone()
        
        if not company:
            raise HTTPException(status_code=400, detail="등록된 활성 회사가 없습니다.")
        
        company_id = company['company_id']
        
        # 사용자 조회 및 인증
        await cursor.execute("""
            SELECT m.*, c.company_type, c.company_name
            FROM admin_service.company_members m
            JOIN admin_service.company c ON m.company_id = c.company_id
            WHERE m.company_id = %s 
              AND m.username = %s 
              AND m.password = %s 
              AND m.is_active = TRUE
        """, (company_id, req.username, req.password))
        
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=401, 
                detail="로그인 정보가 잘못되었거나 승인되지 않은 계정입니다."
            )
        
        return ApiResponse.success({
            "user": {
                "username": user["username"],
                "user_role": user["user_role"],
                "company_type": user["company_type"],
                "company_id": user["company_id"],
                "company_name": user["company_name"]
            }
        })

@router_v3_auth.post("/signup", response_model=ApiResponse)
async def signup(req: SignupRequest):
    """
    회원가입
    - 첫 번째 활성 회사에 자동으로 가입
    - is_active = False로 설정 (관리자 승인 필요)
    """
    if not req.username or not req.password:
        raise HTTPException(status_code=400, detail="아이디와 비밀번호를 모두 입력해주세요.")
    
    async with get_db_connection() as (conn, cursor):
        # 첫 번째 활성 회사 조회
        await cursor.execute("""
            SELECT company_id, company_name
            FROM admin_service.company
            WHERE is_active = TRUE
            ORDER BY company_id ASC
            LIMIT 1
        """)
        company = await cursor.fetchone()
        
        if not company:
            raise HTTPException(status_code=400, detail="등록된 활성 회사가 없습니다.")
        
        company_id = company['company_id']
        company_name = company['company_name']
        
        # 중복 체크
        await cursor.execute("""
            SELECT 1 FROM admin_service.company_members
            WHERE company_id = %s AND username = %s
        """, (company_id, req.username))
        
        existing_user = await cursor.fetchone()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요."
            )
        
        # 회원가입 처리
        await cursor.execute("""
            INSERT INTO admin_service.company_members 
            (company_id, username, password, is_active, user_role)
            VALUES (%s, %s, %s, %s, %s)
        """, (company_id, req.username, req.password, False, 'USER'))
        
        await conn.commit()
        
        # Slack 알림 (선택사항)
        # send_slack_notification(...)
        
        return ApiResponse.success({
            "message": "회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.",
            "username": req.username
        })
```

## 데이터베이스 스키마 참고

```sql
-- company 테이블
CREATE TABLE admin_service.company (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    company_type ENUM('INTERNAL', 'EXTERNAL') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- company_members 테이블
CREATE TABLE admin_service.company_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,  -- SHA256 해싱된 비밀번호
    is_active BOOLEAN DEFAULT FALSE,
    user_role VARCHAR(50) DEFAULT 'USER',
    FOREIGN KEY (company_id) REFERENCES company(company_id),
    UNIQUE KEY unique_company_username (company_id, username)
);
```

## 주의사항

1. **비밀번호 해싱**: 클라이언트에서 이미 SHA256으로 해싱된 비밀번호를 받습니다.
2. **첫 번째 회사**: `ORDER BY company_id ASC LIMIT 1`로 첫 번째 활성 회사를 자동 선택합니다.
3. **회원가입 승인**: `is_active = False`로 설정하여 관리자 승인이 필요합니다.
4. **에러 처리**: 적절한 HTTP 상태 코드와 에러 메시지를 반환합니다.

## 테스트

엔드포인트가 구현되면 프론트엔드에서 자동으로 사용됩니다. 
로컬에서 테스트하려면:
1. 백엔드 서버 실행
2. React 앱에서 로그인/회원가입 시도
3. 브라우저 개발자 도구의 Network 탭에서 요청/응답 확인



