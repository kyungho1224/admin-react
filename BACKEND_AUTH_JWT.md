# 백엔드 JWT 인증 구현 가이드

Streamlit에서 사용했던 계정을 그대로 사용하면서 JWT 토큰 기반 인증을 구현합니다.

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
      "access_token": "JWT 토큰",
      "token_type": "bearer",
      "expires_in": 3600,
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

### 2. 토큰 갱신 엔드포인트
- **경로**: `POST /v3/auth/refresh`
- **헤더**: `Authorization: Bearer {token}`
- **응답**:
```json
{
  "result": {
    "code": 200,
    "body": {
      "access_token": "새로운 JWT 토큰",
      "token_type": "bearer",
      "expires_in": 3600
    }
  }
}
```

### 3. 토큰 검증 엔드포인트
- **경로**: `GET /v3/auth/verify`
- **헤더**: `Authorization: Bearer {token}`
- **응답**:
```json
{
  "result": {
    "code": 200,
    "body": {
      "valid": true,
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

### 4. 회원가입 엔드포인트
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

팝업 관리와 동일한 구조로 Router, Service, Repository 패턴을 사용합니다.

### 1. Router에 엔드포인트 추가

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dependency_injector.wiring import inject, Provide
from pydantic import BaseModel
from common_models.api import ApiResponse
from di.app_module import AppModule
from usecases.v3_auth.auth_service import AuthService

router_v3_auth = APIRouter(prefix="/v3/auth", tags=["auth"])
security = HTTPBearer()

# 요청 모델
class LoginRequest(BaseModel):
    username: str
    password: str  # 원본 비밀번호 (백엔드에서 SHA256으로 해싱)

class SignupRequest(BaseModel):
    username: str
    password: str  # 원본 비밀번호 (백엔드에서 SHA256으로 해싱)

# 토큰에서 사용자 정보 추출 (의존성)
@inject
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    service: AuthService = Depends(Provide[AppModule.auth_service])
):
    token = credentials.credentials
    payload = service.verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    return payload

@router_v3_auth.post("/login", response_model=ApiResponse)
@inject
async def login(
    req: LoginRequest,
    service: AuthService = Depends(Provide[AppModule.auth_service])
):
    """
    로그인
    - 첫 번째 활성 회사의 사용자만 로그인 가능
    - is_active = True인 사용자만 로그인 가능
    - JWT 토큰 발급 (60분 만료)
    """
    return await service.login(req.username, req.password)

@router_v3_auth.post("/refresh", response_model=ApiResponse)
@inject
async def refresh_token(
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(Provide[AppModule.auth_service])
):
    """
    토큰 갱신
    - 현재 토큰이 유효한 경우 30분 연장
    """
    return await service.refresh_token(current_user)

@router_v3_auth.get("/verify", response_model=ApiResponse)
@inject
async def verify_token_endpoint(
    current_user: dict = Depends(get_current_user),
    service: AuthService = Depends(Provide[AppModule.auth_service])
):
    """
    토큰 검증
    - 토큰이 유효한지 확인하고 사용자 정보 반환
    """
    return await service.verify_token_endpoint(current_user)

@router_v3_auth.post("/signup", response_model=ApiResponse)
@inject
async def signup(
    req: SignupRequest,
    service: AuthService = Depends(Provide[AppModule.auth_service])
):
    """
    회원가입
    - 첫 번째 활성 회사에 자동으로 가입
    - is_active = False로 설정 (관리자 승인 필요)
    """
    return await service.signup(req.username, req.password)
```

### 2. AuthService 구현

```python
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
from jwt.exceptions import InvalidTokenError
import os
from common_models.api import ApiResponse
from infrastructure.rds_uow import RDSUoW
from repositories.auth_repository import AuthRepository

# JWT 설정
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60  # 60분
JWT_REFRESH_THRESHOLD_MINUTES = 30  # 30분 미만일 때 갱신 가능

class AuthService:
    def __init__(self, rdsuow: RDSUoW):
        self.rdsuow = rdsuow

    # JWT 토큰 생성
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
        to_encode.update({"exp": expire, "iat": datetime.utcnow()})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return encoded_jwt

    # JWT 토큰 검증
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except InvalidTokenError:
            return None

    # -------------------------------------------------
    # 로그인
    # -------------------------------------------------
    async def login(self, username: str, password: str) -> dict:
        """
        로그인
        - 첫 번째 활성 회사의 사용자만 로그인 가능
        - is_active = True인 사용자만 로그인 가능
        - JWT 토큰 발급 (60분 만료)
        
        주의: password는 원본 비밀번호입니다. 백엔드에서 SHA256으로 해싱합니다.
        DB에 저장된 비밀번호는 SHA256 해싱된 형태입니다.
        (Streamlit에서 hashlib.sha256(password.encode()).hexdigest() 사용)
        """
        import hashlib
        
        # 원본 비밀번호를 SHA256으로 해싱
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        async with self.rdsuow as (conn, cursor):
            repo = AuthRepository(cursor)

            # 첫 번째 활성 회사 조회
            company = await repo.find_first_active_company()
            if not company:
                raise HTTPException(
                    status_code=400,
                    detail="등록된 활성 회사가 없습니다."
                )

            company_id = company['company_id']

            # 사용자 조회 (비밀번호 비교 전에 먼저 조회)
            user = await repo.find_user_by_username_and_company(company_id, username)
            if not user:
                # 디버깅: 사용자가 존재하지 않음
                print(f"[DEBUG] 사용자를 찾을 수 없음: company_id={company_id}, username={username}")
                raise HTTPException(
                    status_code=401,
                    detail="로그인 정보가 잘못되었거나 승인되지 않은 계정입니다."
                )

            # is_active 체크
            if not user.get('is_active'):
                print(f"[DEBUG] 비활성화된 사용자: username={username}, is_active={user.get('is_active')}")
                raise HTTPException(
                    status_code=401,
                    detail="로그인 정보가 잘못되었거나 승인되지 않은 계정입니다."
                )

            # 비밀번호 비교
            stored_password = user.get('password', '').strip()  # 공백 제거
            
            # 디버깅 로그 (프로덕션에서는 제거하거나 로깅 레벨로 제어)
            print(f"[DEBUG] 로그인 시도:")
            print(f"  - username: {username}")
            print(f"  - company_id: {company_id}")
            print(f"  - 입력된 원본 비밀번호 (길이: {len(password)}): {'*' * len(password)}")
            print(f"  - 해싱된 비밀번호 (길이: {len(hashed_password)}): {hashed_password[:20]}...{hashed_password[-10:]}")
            print(f"  - 저장된 비밀번호 (길이: {len(stored_password)}): {stored_password[:20]}...{stored_password[-10:]}")
            print(f"  - 일치 여부: {stored_password == hashed_password}")
            
            # 비밀번호 비교 (SHA256 해싱된 값끼리 비교)
            # SHA256은 대소문자를 구분하므로 정확히 일치해야 함
            if stored_password != hashed_password:
                print(f"[DEBUG] 비밀번호 불일치 - 로그인 실패")
                raise HTTPException(
                    status_code=401,
                    detail="로그인 정보가 잘못되었거나 승인되지 않은 계정입니다."
                )
            
            print(f"[DEBUG] 비밀번호 일치 - 로그인 성공")

            # JWT 토큰 생성
            token_data = {
                "sub": user["username"],
                "user_id": user["record_id"],  # record_id 사용
                "company_id": user["company_id"],
                "user_role": user["user_role"],
                "company_type": user["company_type"],
                "company_name": user["company_name"]
            }
            access_token = self.create_access_token(token_data)

            return ApiResponse.success({
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": JWT_EXPIRATION_MINUTES * 60,  # 초 단위
                "user": {
                    "username": user["username"],
                    "user_role": user["user_role"],
                    "company_type": user["company_type"],
                    "company_id": user["company_id"],
                    "company_name": user["company_name"]
                }
            })

    # -------------------------------------------------
    # 토큰 갱신
    # -------------------------------------------------
    async def refresh_token(self, current_user: dict) -> dict:
        """
        토큰 갱신
        - 현재 토큰이 유효한 경우 30분 연장
        """
        # 토큰에서 만료 시간 확인
        exp = current_user.get("exp")
        if exp:
            expire_time = datetime.fromtimestamp(exp)
            time_remaining = expire_time - datetime.utcnow()

            # 30분 이상 남았으면 갱신 불필요
            if time_remaining.total_seconds() > 30 * 60:
                raise HTTPException(
                    status_code=400,
                    detail="토큰이 아직 유효합니다. 30분 미만일 때만 갱신할 수 있습니다."
                )

        # 새 토큰 생성 (30분 추가)
        token_data = {
            "sub": current_user["sub"],
            "user_id": current_user.get("user_id"),
            "company_id": current_user.get("company_id"),
            "user_role": current_user.get("user_role"),
            "company_type": current_user.get("company_type"),
            "company_name": current_user.get("company_name")
        }
        access_token = self.create_access_token(token_data, timedelta(minutes=JWT_EXPIRATION_MINUTES))

        return ApiResponse.success({
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRATION_MINUTES * 60
        })

    # -------------------------------------------------
    # 토큰 검증
    # -------------------------------------------------
    async def verify_token_endpoint(self, current_user: dict) -> dict:
        """
        토큰 검증
        - 토큰이 유효한지 확인하고 사용자 정보 반환
        """
        async with self.rdsuow as (conn, cursor):
            repo = AuthRepository(cursor)

            # 사용자 정보 조회
            user = await repo.find_user_by_id(current_user.get("user_id"))
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="사용자를 찾을 수 없습니다."
                )

            return ApiResponse.success({
                "valid": True,
                "user": {
                    "username": user["username"],
                    "user_role": user["user_role"],
                    "company_type": user["company_type"],
                    "company_id": user["company_id"],
                    "company_name": user["company_name"]
                }
            })

    # -------------------------------------------------
    # 회원가입
    # -------------------------------------------------
    async def signup(self, username: str, password: str) -> dict:
        """
        회원가입
        - 첫 번째 활성 회사에 자동으로 가입
        - is_active = False로 설정 (관리자 승인 필요)
        
        주의: password는 원본 비밀번호입니다. 백엔드에서 SHA256으로 해싱합니다.
        """
        import hashlib
        
        if not username or not password:
            raise HTTPException(
                status_code=400,
                detail="아이디와 비밀번호를 모두 입력해주세요."
            )

        # 원본 비밀번호를 SHA256으로 해싱
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        async with self.rdsuow as (conn, cursor):
            repo = AuthRepository(cursor)

            # 첫 번째 활성 회사 조회
            company = await repo.find_first_active_company()
            if not company:
                raise HTTPException(
                    status_code=400,
                    detail="등록된 활성 회사가 없습니다."
                )

            company_id = company['company_id']

            # 중복 체크
            existing_user = await repo.find_user_by_username(company_id, username)
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요."
                )

            # 회원가입 처리 (해싱된 비밀번호 저장)
            # user_role 기본값은 'GUEST' (DB 스키마에 따라)
            await repo.create_user(company_id, username, hashed_password, False, 'GUEST')
            await conn.commit()

            return ApiResponse.success({
                "message": "회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.",
                "username": username
            })
```

### 3. AuthRepository 구현

```python
from typing import Optional, Dict, Any

class AuthRepository:
    def __init__(self, cursor):
        self.cursor = cursor

    # ------------------------------
    # 첫 번째 활성 회사 조회
    # ------------------------------
    async def find_first_active_company(self) -> Optional[Dict[str, Any]]:
        """
        첫 번째 활성 회사 조회
        """
        await self.cursor.execute("""
            SELECT company_id, company_name, company_type
            FROM admin_service.company
            WHERE is_active = 1
            ORDER BY company_id ASC
            LIMIT 1
        """)
        return await self.cursor.fetchone()

    # ------------------------------
    # 사용자명과 회사로 조회 (비밀번호 비교 전)
    # ------------------------------
    async def find_user_by_username_and_company(
        self, 
        company_id: int, 
        username: str
    ) -> Optional[Dict[str, Any]]:
        """
        사용자명과 회사로 조회 (비밀번호 포함)
        - is_active 체크는 Service에서 수행
        """
        await self.cursor.execute("""
            SELECT m.*, c.company_type, c.company_name
            FROM admin_service.company_members m
            JOIN admin_service.company c ON m.company_id = c.company_id
            WHERE m.company_id = %s 
              AND m.username = %s
        """, (company_id, username))
        return await self.cursor.fetchone()

    # ------------------------------
    # 사용자 ID로 조회
    # ------------------------------
    async def find_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        사용자 ID로 조회
        - is_active = True인 사용자만 조회
        - record_id 사용 (실제 DB 컬럼명)
        """
        await self.cursor.execute("""
            SELECT m.*, c.company_type, c.company_name
            FROM admin_service.company_members m
            JOIN admin_service.company c ON m.company_id = c.company_id
            WHERE m.record_id = %s AND m.is_active = 1
        """, (user_id,))
        return await self.cursor.fetchone()

    # ------------------------------
    # 사용자명으로 조회 (중복 체크용)
    # ------------------------------
    async def find_user_by_username(
        self, 
        company_id: int, 
        username: str
    ) -> Optional[Dict[str, Any]]:
        """
        사용자명으로 조회 (중복 체크용)
        """
        await self.cursor.execute("""
            SELECT 1 FROM admin_service.company_members
            WHERE company_id = %s AND username = %s
        """, (company_id, username))
        return await self.cursor.fetchone()

    # ------------------------------
    # 사용자 생성
    # ------------------------------
    async def create_user(
        self,
        company_id: int,
        username: str,
        password: str,
        is_active: bool,
        user_role: str
    ) -> int:
        """
        사용자 생성
        - user_role: 'GUEST', 'VIEWER', 'EDITOR', 'MANAGER', 'MASTER' 중 하나
        - 기본값은 'GUEST'
        """
        await self.cursor.execute("""
            INSERT INTO admin_service.company_members 
            (company_id, username, password, is_active, user_role)
            VALUES (%s, %s, %s, %s, %s)
        """, (company_id, username, password, is_active, user_role))
        return self.cursor.lastrowid
```

## 필요한 패키지 설치

```bash
pip install python-jose[cryptography] PyJWT
```

또는

```bash
pip install PyJWT
```

## 환경 변수 설정

```bash
JWT_SECRET_KEY=your-secret-key-change-in-production
```

## 데이터베이스 스키마

기존 Streamlit에서 사용하던 테이블 구조를 그대로 사용합니다:

```sql
-- company 테이블 (실제 스키마)
CREATE TABLE admin_service.company (
    company_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    company_type ENUM('INTERNAL', 'EXTERNAL') DEFAULT 'INTERNAL' NOT NULL,
    is_active TINYINT(1) DEFAULT 0 NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
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

1. **JWT_SECRET_KEY**: 프로덕션 환경에서는 반드시 강력한 시크릿 키를 사용하세요.
2. **토큰 만료 시간**: 60분으로 설정되어 있으며, 필요에 따라 조정 가능합니다.
3. **토큰 갱신**: 30분 미만일 때만 갱신 가능하도록 제한되어 있습니다.
4. **비밀번호 해싱**: 클라이언트에서 이미 SHA256으로 해싱된 비밀번호를 받습니다.
5. **첫 번째 회사**: `ORDER BY company_id ASC LIMIT 1`로 첫 번째 활성 회사를 자동 선택합니다.

## 비밀번호 형식 문제 해결

### 문제 상황
- Streamlit에서는 암호화/복호화를 사용했을 수 있음
- 현재는 SHA256 해싱을 사용
- DB에 저장된 비밀번호 형식이 다를 수 있음

### 해결 방법

#### 방법 1: DB 비밀번호를 SHA256으로 마이그레이션 (권장)

기존 암호화된 비밀번호를 SHA256 해싱으로 변환하는 마이그레이션 스크립트:

```python
import hashlib
# Streamlit에서 사용한 복호화 함수가 있다면 사용
# from your_decrypt_module import decrypt_password

async def migrate_passwords_to_sha256():
    """
    기존 암호화된 비밀번호를 SHA256 해싱으로 변환
    주의: 이 스크립트는 한 번만 실행해야 합니다.
    """
    async with get_db_connection() as (conn, cursor):
        # 모든 사용자 조회
        await cursor.execute("""
            SELECT id, username, password
            FROM admin_service.company_members
        """)
        users = await cursor.fetchall()
        
        for user in users:
            old_password = user['password']
            
            # 만약 암호화된 비밀번호라면 복호화 후 재해싱
            # decrypted = decrypt_password(old_password)  # Streamlit 복호화 함수
            # new_password = hashlib.sha256(decrypted.encode()).hexdigest()
            
            # 또는 이미 해싱된 비밀번호라면 그대로 사용
            # SHA256 해시는 64자리 hex 문자열
            if len(old_password) == 64 and all(c in '0123456789abcdef' for c in old_password.lower()):
                print(f"이미 SHA256 형식: {user['username']}")
                continue
            
            # 암호화된 비밀번호를 복호화 후 SHA256으로 재해싱
            # decrypted = decrypt_password(old_password)
            # new_password = hashlib.sha256(decrypted.encode()).hexdigest()
            
            # await cursor.execute("""
            #     UPDATE admin_service.company_members
            #     SET password = %s
            #     WHERE id = %s
            # """, (new_password, user['id']))
        
        # await conn.commit()
        print("비밀번호 마이그레이션 완료")
```

#### 방법 2: 백엔드에서 암호화/복호화 지원 (임시)

Streamlit의 암호화 방식을 그대로 사용하려면:

```python
# auth_service.py에 추가
import hashlib
# from your_encrypt_module import encrypt_password, decrypt_password

async def login(self, username: str, password: str) -> dict:
    # ... 기존 코드 ...
    
    stored_password = user.get('password', '')
    
    # 방법 2-1: 저장된 비밀번호가 암호화된 경우 복호화 후 비교
    # decrypted_stored = decrypt_password(stored_password)
    # if decrypted_stored != password:  # password는 원본이 아니라 해싱된 값
    #     return ApiResponse.error(...)
    
    # 방법 2-2: 입력된 해싱된 비밀번호를 암호화해서 비교
    # encrypted_input = encrypt_password(password)
    # if encrypted_input != stored_password:
    #     return ApiResponse.error(...)
    
    # 방법 2-3: 저장된 암호화된 비밀번호를 복호화 후 SHA256 해싱해서 비교
    # decrypted_stored = decrypt_password(stored_password)
    # hashed_decrypted = hashlib.sha256(decrypted_stored.encode()).hexdigest()
    # if hashed_decrypted != password:
    #     return ApiResponse.error(...)
```

### 디버깅

현재 코드에 디버깅 로그가 포함되어 있습니다. 로그를 확인하여:
1. DB에 저장된 비밀번호 형식 확인
2. 입력된 비밀번호 해시 형식 확인
3. 두 값의 길이와 형식 비교

로그 예시:
```
[DEBUG] 비밀번호 비교:
  - 입력된 해시 (길이: 64): 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8...
  - 저장된 비밀번호 (길이: 32): abc123def456...
  - 일치 여부: False
```

이 로그를 통해 DB에 저장된 비밀번호 형식을 확인할 수 있습니다.

### 4. DI (Dependency Injection) 설정

`di/app_module.py`에 AuthService를 추가해야 합니다:

```python
from dependency_injector import containers, providers
from infrastructure.rds_uow import RDSUoW
from usecases.v3_auth.auth_service import AuthService
from usecases.v3_popups.popup_service import PopupService

class AppModule(containers.DeclarativeContainer):
    # ... 기존 설정들 ...
    
    # Auth Service
    auth_service = providers.Factory(
        AuthService,
        rdsuow=providers.Singleton(RDSUoW)
    )
```

그리고 `main.py`에서 wiring을 설정:

```python
from dependency_injector.wiring import Provide, inject
from di.app_module import AppModule

# ... 기존 코드 ...

app.include_router(router_v3_auth)

# Wiring 설정
AppModule.wire(modules=[__name__, "routers.v3_auth"])
```

## 보호된 엔드포인트 사용 예시

다른 엔드포인트에서 인증이 필요한 경우:

```python
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dependency_injector.wiring import inject, Provide
from di.app_module import AppModule
from usecases.v3_auth.auth_service import AuthService

security = HTTPBearer()

@inject
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    service: AuthService = Depends(Provide[AppModule.auth_service])
):
    token = credentials.credentials
    payload = service.verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")
    return payload

@router_v3.get("/protected", response_model=ApiResponse)
@inject
async def protected_endpoint(
    current_user: dict = Depends(get_current_user),
    service: PopupService = Depends(Provide[AppModule.popup_service])
):
    # current_user에는 JWT 토큰에서 추출한 사용자 정보가 들어있습니다
    username = current_user["sub"]
    company_id = current_user["company_id"]
    # ... 로직 수행
    return ApiResponse.success({"message": "인증된 사용자만 접근 가능"})
```

