# 게임 정보 수정 엔드포인트 구현 가이드

게임 정보와 규칙을 수정하는 엔드포인트를 구현합니다.

## 엔드포인트 개요

### 게임 정보 수정
- **경로**: `PUT /v3/games/{game_id}`
- **인증**: 필요 (Bearer Token)
- **설명**: 특정 게임의 정보와 규칙을 수정합니다.

## 데이터 구조 이해

### 수정 가능한 필드

#### game_info 테이블
- `tag_id`: 학습 수준 (1: Beginner, 2: Basic, 3: TOPIK)
- `title_ko`: 게임 제목 (한국어)
- `screen_images`: 썸네일 이미지 배열 (JSON)

#### common_game_rule 테이블
- `init_seconds`: 게임 시작 시간 (초)
- `sec_of_revive`: 부활 시 주어지는 시간 (초)
- `is_unlimited`: 무제한 가능 여부 (0 또는 1)
- `limit_count`: 일일 가능 횟수 (is_unlimited가 0일 때)
- `cost_item_amount`: 아이템으로 추가 진행 시 필요한 아이템 수
- `sec_of_correct_answer`: 정답 시 추가 시간 (초)
- `sec_of_penalty`: 오답 시 차감 시간 (초, 음수 가능)
- `score_per_question`: 문제당 포인트
- `experience_per_question`: 문제당 경험치

### 주의사항
- `tag_id`는 수정 가능하지만, 프론트엔드에서는 `tag_label`로 표시
- `game_info.score_per_question`과 `common_game_rule.score_per_question`은 별도 필드
- `screen_images`는 JSON 배열 형식

## 라우터 코드

```python
from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dependency_injector.wiring import inject, Provide
from pydantic import BaseModel, Field
from typing import Optional, List
from common_models.api import ApiResponse
from di.app_module import AppModule
from usecases.v3_admin.auth_service import AuthService
from usecases.v3_admin.game_service import GameService

router_v3_game = APIRouter(prefix="/games", tags=["games"])
security = HTTPBearer()

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

# 게임 수정 요청 모델
class UpdateGameRequest(BaseModel):
    # game_info 테이블 필드
    tag_id: Optional[int] = Field(None, description="학습 수준 (1: Beginner, 2: Basic, 3: TOPIK)")
    title: Optional[str] = Field(None, description="게임 제목 (한국어)")
    screen_images: Optional[List[str]] = Field(None, description="썸네일 이미지 URL 배열")
    
    # common_game_rule 테이블 필드
    init_seconds: Optional[int] = Field(None, description="게임 시작 시간 (초)")
    sec_of_revive: Optional[int] = Field(None, description="부활 시 주어지는 시간 (초)")
    is_unlimited: Optional[int] = Field(None, description="무제한 가능 여부 (0 또는 1)")
    limit_count: Optional[int] = Field(None, description="일일 가능 횟수")
    cost_item_amount: Optional[int] = Field(None, description="아이템으로 추가 진행 시 필요한 아이템 수")
    sec_of_correct_answer: Optional[int] = Field(None, description="정답 시 추가 시간 (초)")
    sec_of_penalty: Optional[int] = Field(None, description="오답 시 차감 시간 (초, 음수 가능)")
    score_per_question: Optional[int] = Field(None, description="문제당 포인트")
    experience_per_question: Optional[int] = Field(None, description="문제당 경험치")

@router_v3_game.put("/{game_id}", response_model=ApiResponse)
@inject
async def update_game(
    game_id: int = Path(..., description="게임 ID", gt=0),
    req: UpdateGameRequest = ...,
    current_user: dict = Depends(get_current_user),
    service: GameService = Depends(Provide[AppModule.game_service])
):
    """
    게임 정보 및 규칙 수정
    - 인증된 사용자만 접근 가능
    - game_info와 common_game_rule 두 테이블을 모두 업데이트
    """
    return await service.update_game(game_id, req.dict(exclude_none=True))
```

## 서비스 레이어 코드

### GameService에 메서드 추가

```python
from commands.v3_admin.game_repository import GameRepository
from common_models.api import ApiResponse
from common_uow.rds import RDSUoW
from typing import Dict, Any


class GameService:
    def __init__(self, rdsuow: RDSUoW):
        self.rdsuow = rdsuow

    async def get_game_rules(self):
        async with self.rdsuow as (_, cursor):
            repo = GameRepository(cursor=cursor)
            rules = await repo.find_all_games_rule()
            return ApiResponse.success(data=rules)

    async def update_game(self, game_id: int, update_data: Dict[str, Any]):
        """
        게임 정보 및 규칙 수정
        """
        async with self.rdsuow as (conn, cursor):
            repo = GameRepository(cursor=cursor)
            
            # 게임 존재 여부 확인
            game_exists = await repo.check_game_exists(game_id)
            if not game_exists:
                raise HTTPException(status_code=404, detail=f"게임 ID {game_id}를 찾을 수 없습니다.")
            
            # game_info 테이블 업데이트
            game_info_fields = ['tag_id', 'title', 'screen_images']
            game_info_data = {k: v for k, v in update_data.items() if k in game_info_fields}
            if game_info_data:
                # title을 title_ko로 매핑
                if 'title' in game_info_data:
                    game_info_data['title_ko'] = game_info_data.pop('title')
                await repo.update_game_info(game_id, game_info_data)
            
            # common_game_rule 테이블 업데이트
            rule_fields = [
                'init_seconds', 'sec_of_revive', 'is_unlimited', 'limit_count',
                'cost_item_amount', 'sec_of_correct_answer', 'sec_of_penalty',
                'score_per_question', 'experience_per_question'
            ]
            rule_data = {k: v for k, v in update_data.items() if k in rule_fields}
            if rule_data:
                await repo.update_game_rule(game_id, rule_data)
            
            await conn.commit()
            
            # 업데이트된 게임 정보 조회
            updated_game = await repo.find_game_by_id(game_id)
            return ApiResponse.success(data=updated_game)
```

## 리포지토리 레이어 코드

### GameRepository에 메서드 추가

```python
import json
from typing import Dict, Any, Optional


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

    async def check_game_exists(self, game_id: int) -> bool:
        """게임 존재 여부 확인"""
        await self.cursor.execute(
            """
            SELECT 1 FROM study_patterns_service.game_info
            WHERE record_id = %s AND is_deleted_flag = 0
            """,
            (game_id,)
        )
        result = await self.cursor.fetchone()
        return result is not None

    async def update_game_info(self, game_id: int, data: Dict[str, Any]):
        """game_info 테이블 업데이트"""
        if not data:
            return
        
        # screen_images를 JSON 문자열로 변환
        if 'screen_images' in data and isinstance(data['screen_images'], list):
            data['screen_images'] = json.dumps(data['screen_images'], ensure_ascii=False)
        
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        values = list(data.values()) + [game_id]
        
        await self.cursor.execute(
            f"""
            UPDATE study_patterns_service.game_info
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE record_id = %s
            """,
            values
        )

    async def update_game_rule(self, game_id: int, data: Dict[str, Any]):
        """common_game_rule 테이블 업데이트"""
        if not data:
            return
        
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        values = list(data.values()) + [game_id]
        
        await self.cursor.execute(
            f"""
            UPDATE study_patterns_service.common_game_rule
            SET {set_clause}, updated_at = CURRENT_TIMESTAMP
            WHERE record_id = %s
            """,
            values
        )

    async def find_game_by_id(self, game_id: int) -> Optional[Dict[str, Any]]:
        """게임 ID로 게임 정보 조회"""
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
            WHERE gi.record_id = %s
            """,
            (game_id,)
        )
        record = await self.cursor.fetchone()
        if record:
            record['screen_images'] = json.loads(record['screen_images'])
        return record
```

## 요청/응답 예시

### 요청 예시

```json
PUT /v3/games/18
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "tag_id": 2,
  "title": "단어 찾기 (수정)",
  "init_seconds": 90,
  "sec_of_revive": 30,
  "is_unlimited": 0,
  "limit_count": 2,
  "cost_item_amount": 5,
  "sec_of_correct_answer": 15,
  "sec_of_penalty": -15,
  "score_per_question": 150,
  "experience_per_question": 3
}
```

### 성공 응답

```json
{
  "result": {
    "code": 200,
    "body": {
      "game_id": 18,
      "tag_id": 2,
      "tag_label": "Basic",
      "title": "단어 찾기 (수정)",
      "screen_images": [
        "https://funpik-development-media.s3.ap-northeast-2.amazonaws.com/games/game_9_1.png"
      ],
      "init_seconds": 90,
      "sec_of_revive": 30,
      "is_unlimited": 0,
      "limit_count": 2,
      "cost_item_amount": 5,
      "sec_of_correct_answer": 15,
      "sec_of_penalty": -15,
      "score_per_question": 150,
      "experience_per_question": 3
    }
  }
}
```

### 에러 응답

#### 게임을 찾을 수 없음 (404)
```json
{
  "detail": "게임 ID 999를 찾을 수 없습니다."
}
```

#### 인증 실패 (401)
```json
{
  "detail": "유효하지 않은 토큰입니다."
}
```

#### 유효하지 않은 데이터 (400)
```json
{
  "detail": "Validation error: tag_id must be 1, 2, or 3"
}
```

## 유효성 검증

### tag_id 검증
```python
# 라우터에서 추가 검증 (선택사항)
if req.tag_id is not None and req.tag_id not in [1, 2, 3]:
    raise HTTPException(
        status_code=400, 
        detail="tag_id는 1(Beginner), 2(Basic), 3(TOPIK) 중 하나여야 합니다."
    )
```

### is_unlimited와 limit_count 관계 검증
```python
# is_unlimited가 0일 때 limit_count는 필수
if req.is_unlimited == 0 and req.limit_count is None:
    raise HTTPException(
        status_code=400,
        detail="무제한이 아닌 경우 일일 가능 횟수(limit_count)를 입력해주세요."
    )
```

## 프론트엔드 연동

```javascript
// src/services/api.js에 추가할 함수
export async function updateGame(gameId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/games/${gameId}`),
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.detail || 
      errorData.result?.message || 
      errorData.message || 
      '게임 정보 수정 실패'
    )
  }

  return handleResponse(response)
}
```

## 테스트

### 1. 게임 정보 수정 (성공)
```bash
curl -X PUT http://localhost:8000/v3/games/18 \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tag_id": 2,
    "title": "단어 찾기 (수정)",
    "init_seconds": 90,
    "sec_of_revive": 30,
    "is_unlimited": 0,
    "limit_count": 2
  }'
```

### 2. 존재하지 않는 게임 수정 (실패)
```bash
curl -X PUT http://localhost:8000/v3/games/999 \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트"}'
```
예상 응답: 404 Not Found

### 3. 인증 없이 수정 (실패)
```bash
curl -X PUT http://localhost:8000/v3/games/18 \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트"}'
```
예상 응답: 401 Unauthorized

## 주의사항

1. **부분 업데이트**: 요청에 포함된 필드만 업데이트됩니다. (PATCH 방식)
2. **트랜잭션**: game_info와 common_game_rule 업데이트는 하나의 트랜잭션으로 처리됩니다.
3. **screen_images**: JSON 배열로 저장되며, 업데이트 시 전체 배열을 교체합니다.
4. **tag_id vs tag_label**: 
   - 백엔드에서는 `tag_id`로 저장
   - 프론트엔드에서는 `tag_label`로 표시
   - 수정 시에는 `tag_id`를 전송
5. **score_per_question**: 
   - `game_info.score_per_question`과 `common_game_rule.score_per_question`은 별도 필드
   - 현재는 `common_game_rule.score_per_question`만 수정 가능
6. **is_unlimited와 limit_count**: 
   - `is_unlimited = 1`이면 `limit_count`는 무시됨
   - `is_unlimited = 0`이면 `limit_count`가 필수

## 다음 단계

게임 수정 엔드포인트 구현 후:
1. 프론트엔드 게임 관리 페이지 구현
2. 게임 목록 조회 및 수정 UI 구현
3. 유효성 검증 강화
4. 게임 생성/삭제 엔드포인트 추가 (필요 시)

