# 게임 관리 라우터 구현 가이드

게임 관리 엔드포인트에 인증을 추가하고 라우터를 개선합니다.

## 개선 사항

### 1. 인증 추가
- 모든 게임 관리 엔드포인트에 JWT 토큰 인증 추가
- `get_current_user` 의존성을 사용하여 인증된 사용자만 접근 가능하도록 설정

### 2. 라우터 구조 개선
- 기존 인증 라우터와 동일한 패턴으로 구현
- 의존성 주입을 통한 서비스 분리

## 개선된 라우터 코드

```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dependency_injector.wiring import inject, Provide
from pydantic import BaseModel
from common_models.api import ApiResponse
from di.app_module import AppModule
from usecases.v3_admin.auth_service import AuthService
from usecases.v3_admin.game_service import GameService

router_v3_auth = APIRouter(prefix="/auth", tags=["auth"])
router_v3_game = APIRouter(prefix="/games", tags=["games"])
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


# ============================================================
# 게임 관리 엔드포인트 (인증 추가)
# ============================================================

@router_v3_game.get("/rules", response_model=ApiResponse)
@inject
async def get_game_rules(
    current_user: dict = Depends(get_current_user),
    service: GameService = Depends(Provide[AppModule.game_service])
):
    """
    게임 규칙 조회
    - 인증된 사용자만 접근 가능
    - 모든 게임의 규칙 정보를 반환
    """
    return await service.get_game_rules()
```

## 주요 변경 사항

### 1. 인증 의존성 추가
```python
@router_v3_game.get("/rules", response_model=ApiResponse)
@inject
async def get_game_rules(
    current_user: dict = Depends(get_current_user),  # 인증 추가
    service: GameService = Depends(Provide[AppModule.game_service])
):
```

### 2. 인증 플로우
1. 클라이언트가 `Authorization: Bearer {token}` 헤더로 요청
2. `get_current_user` 의존성이 토큰 검증
3. 토큰이 유효하면 사용자 정보를 `current_user`로 전달
4. 토큰이 유효하지 않으면 401 에러 반환

## 엔드포인트 상세

### 게임 규칙 조회
- **경로**: `GET /v3/games/rules`
- **인증**: 필요 (Bearer Token)
- **요청 헤더**:
  ```
  Authorization: Bearer {access_token}
  Content-Type: application/json
  ```

- **응답**:
```json
{
  "result": {
    "code": 200,
    "body": [
      {
        "game_id": 18,
        "tag_id": 2,
        "tag_label": "Basic",
        "title": "단어 찾기",
        "screen_images": [
          "https://funpik-development-media.s3.ap-northeast-2.amazonaws.com/games/game_9_1.png"
        ],
        "init_seconds": 60,
        "sec_of_revive": 30,
        "is_unlimited": 0,
        "limit_count": 1,
        "cost_item_amount": 3,
        "sec_of_correct_answer": 10,
        "sec_of_penalty": -10,
        "score_per_question": 125,
        "experience_per_question": 2
      },
      ...
    ]
  }
}
```

- **에러 응답 (인증 실패)**:
```json
{
  "detail": "유효하지 않은 토큰입니다."
}
```
HTTP Status: 401 Unauthorized

## 서비스 레이어 코드

### GameService (기존 코드 유지)
```python
from commands.v3_admin.game_repository import GameRepository
from common_models.api import ApiResponse
from common_uow.rds import RDSUoW


class GameService:
    def __init__(self, rdsuow: RDSUoW):
        self.rdsuow = rdsuow

    async def get_game_rules(self):
        async with self.rdsuow as (_, cursor):
            repo = GameRepository(cursor=cursor)
            rules = await repo.find_all_games_rule()
            return ApiResponse.success(data=rules)
```

### GameRepository (기존 코드 유지)
```python
import json


class GameRepository:
    def __init__(self, cursor):
        self.cursor = cursor

    async def find_all_games_rule(self):
        await self.cursor.execute(
            """
            SELECT gi.record_id AS game_id,
                gi.tag_id AS tag_id,
                t.label AS tag_label,
                gi.title_ko AS title,
                gi.screen_images AS screen_images,
                cgr.init_seconds AS init_seconds,
                cgr.sec_of_revive AS sec_of_revive,
                cgr.is_unlimited AS is_unlimited,
                cgr.limit_count AS limit_count,
                cgr.cost_item_amount AS cost_item_amount,
                cgr.sec_of_correct_answer AS sec_of_correct_answer,
                cgr.sec_of_penalty AS sec_of_penalty,
                cgr.score_per_question AS score_per_question,
                cgr.experience_per_question AS experience_per_question
            FROM study_patterns_service.game_info gi
                     JOIN study_patterns_service.game_info_translations git ON git.game_id = gi.record_id
                     JOIN study_patterns_service.common_game_rule cgr ON cgr.record_id = gi.record_id
                     JOIN study_patterns_service.tags t ON t.tag_id = gi.tag_id
            ORDER BY gi.record_id
            """
        )
        records = await self.cursor.fetchall()
        for record in records:
            record['screen_images'] = json.loads(record['screen_images'])
        return records
```

## DI 설정 확인

`di/app_module.py`에 다음이 설정되어 있어야 합니다:

```python
from usecases.v3_admin.game_service import GameService
from usecases.v3_admin.auth_service import AuthService

class AppModule(containers.DeclarativeContainer):
    # ... 기존 설정들 ...
    
    # Auth Service
    auth_service = providers.Factory(
        AuthService,
        rdsuow=providers.Singleton(RDSUoW)
    )
    
    # Game Service
    game_service = providers.Factory(
        GameService,
        rdsuow=providers.Singleton(RDSUoW)
    )
```

## 라우터 등록

메인 앱 파일에서 라우터를 등록해야 합니다:

```python
from routers.v3_admin import router_v3_auth, router_v3_game

app = FastAPI(...)

app.include_router(router_v3_auth, prefix="/v3")
app.include_router(router_v3_game, prefix="/v3")
```

## 프론트엔드 연동

프론트엔드에서 호출 시 인증 토큰을 헤더에 포함해야 합니다:

```javascript
// src/services/api.js에 추가할 함수
export async function getGameRules() {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, '/v3/games/rules'),
    {
      method: 'GET',
      headers: getAuthHeaders(),  // Authorization 헤더 포함
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '게임 규칙 조회 실패'
    )
  }

  return handleResponse(response)
}
```

## 테스트

### 1. 인증 없이 요청 (실패 예상)
```bash
curl -X GET http://localhost:8000/v3/games/rules
```
예상 응답: 401 Unauthorized

### 2. 인증과 함께 요청 (성공 예상)
```bash
curl -X GET http://localhost:8000/v3/games/rules \
  -H "Authorization: Bearer {access_token}"
```
예상 응답: 200 OK with game rules data

## 주의사항

1. **토큰 만료**: 토큰이 만료되면 401 에러가 반환됩니다. 프론트엔드에서 토큰 갱신 로직을 구현해야 합니다.
2. **인증 헤더**: 모든 게임 관리 엔드포인트는 `Authorization: Bearer {token}` 헤더가 필요합니다.
3. **에러 처리**: 인증 실패 시 일관된 에러 메시지를 반환합니다.
4. **보안**: HTTPS를 사용하여 토큰이 노출되지 않도록 주의합니다.

## 다음 단계

라우터 개선이 완료되면 다음 작업을 진행할 수 있습니다:
1. 게임 규칙 수정 엔드포인트 추가
2. 게임 생성/삭제 엔드포인트 추가
3. 게임별 상세 조회 엔드포인트 추가
4. 프론트엔드 게임 관리 페이지 구현

