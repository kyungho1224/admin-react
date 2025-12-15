# 팝업 수정 엔드포인트 구현 가이드

## 수정 기능 요구사항

1. **팝업 메타 정보 수정**
   - `popup_type`, `is_active`, `start_at`, `end_at` 수정

2. **슬라이드 관리**
   - 기존 슬라이드 수정 (이미지, 제목, 본문, 링크 등)
   - 새 슬라이드 추가
   - 기존 슬라이드 삭제

3. **배치 정보 수정**
   - `screen_key`, `priority`, `is_active` 수정

## 구현 코드

### 1. 요청 모델 정의

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class PopupType(str, Enum):
    SINGLE = "SINGLE"
    MULTI = "MULTI"

class LinkType(str, Enum):
    IN_APP = "IN_APP"
    EXTERNAL = "EXTERNAL"

# 슬라이드 수정용 모델
class PopupSlideUpdate(BaseModel):
    id: Optional[int] = Field(None, description="슬라이드 ID (기존 슬라이드 수정 시 필수, 새 슬라이드 추가 시 None)")
    sort_order: Optional[int] = Field(None, description="표시 순서")
    image_url: str = Field(..., description="슬라이드 이미지 URL")
    title: Optional[str] = Field(None, description="슬라이드 제목")
    body: Optional[str] = Field(None, description="슬라이드 본문")
    link_type: Optional[LinkType] = Field(None, description="클릭 링크 타입")
    link_target: Optional[str] = Field(None, description="클릭 링크 타겟")

# 팝업 수정 요청 모델
class PopupUpdateRequest(BaseModel):
    # 팝업 메타 정보
    popup_type: Optional[PopupType] = Field(None, description="팝업 타입 (수정 시 변경 가능)")
    is_active: Optional[bool] = Field(None, description="운영 여부")
    start_at: Optional[datetime] = Field(None, description="노출 시작일")
    end_at: Optional[datetime] = Field(None, description="노출 종료일")
    
    # 배치 정보
    screen_key: Optional[str] = Field(None, description="노출 화면 키")
    priority: Optional[int] = Field(None, description="우선순위")
    placement_is_active: Optional[bool] = Field(None, description="배치 활성 여부")
    
    # 슬라이드 목록
    slides: Optional[List[PopupSlideUpdate]] = Field(None, description="슬라이드 목록 (전체 교체)")
```

### 2. Router에 엔드포인트 추가

```python
from fastapi import APIRouter, Path, Depends
from dependency_injector.wiring import inject, Provide
from common_models.api import ApiResponse
from di.app_module import AppModule
from models.popups import PopupUpdateRequest
from usecases.v3_popups.popup_service import PopupService

router_v3 = APIRouter(prefix="/popups", tags=['Popups_v3'])

# ... 기존 엔드포인트들 ...

@router_v3.put("/{popup_id}", response_model=ApiResponse)
@inject
async def update_popup(
    popup_id: int = Path(..., description="팝업 ID"),
    req: PopupUpdateRequest = ...,
    service: PopupService = Depends(Provide[AppModule.popup_service])
):
    """
    팝업 수정
    - 팝업 메타 정보 수정
    - 슬라이드 추가/수정/삭제 (slides 배열로 전체 교체)
    - 배치 정보 수정
    """
    return await service.update_popup(popup_id=popup_id, req=req)
```

### 3. PopupService에 메서드 추가

```python
class PopupService:
    def __init__(self, rdsuow: RDSUoW):
        self.rdsuow = rdsuow

    # ... 기존 메서드들 ...

    # -------------------------------------------------
    # 팝업 수정
    # -------------------------------------------------
    async def update_popup(self, popup_id: int, req: PopupUpdateRequest) -> dict:
        """
        팝업 수정
        - 팝업 메타 정보 수정
        - 슬라이드 전체 교체 (기존 슬라이드 삭제 후 새로 생성)
        - 배치 정보 수정
        """
        async with self.rdsuow as (conn, cursor):
            repo = PopupRepository(cursor)

            # 1) 팝업 존재 여부 확인
            popup = await repo.find_popup_by_id(popup_id)
            if not popup:
                return ApiResponse.error(
                    code=404,
                    message=f"Popup with id {popup_id} not found"
                )

            # 2) 팝업 메타 정보 수정
            if any([req.popup_type, req.is_active is not None, req.start_at, req.end_at]):
                await repo.update_popup(
                    popup_id=popup_id,
                    popup_type=req.popup_type.value if req.popup_type else None,
                    is_active=req.is_active,
                    start_at=req.start_at,
                    end_at=req.end_at,
                )

            # 3) 슬라이드 수정 (전체 교체 방식)
            if req.slides is not None:
                # 기존 슬라이드 모두 삭제
                await repo.delete_all_slides(popup_id)
                
                # 새 슬라이드 생성
                for idx, slide in enumerate(req.slides):
                    sort_order = slide.sort_order or (idx + 1)
                    await repo.create_slide(
                        popup_id=popup_id,
                        sort_order=sort_order,
                        image_url=slide.image_url,
                        title=slide.title,
                        body=slide.body,
                        link_type=slide.link_type.value if slide.link_type else None,
                        link_target=slide.link_target
                    )

            # 4) 배치 정보 수정
            if req.screen_key or req.priority is not None or req.placement_is_active is not None:
                # 기존 배치 정보 조회
                existing_placements = await repo.find_placements_by_popup_id(popup_id)
                
                if req.screen_key:
                    # 특정 화면의 배치 정보 수정/생성
                    existing_placement = next(
                        (p for p in existing_placements if p['screen_key'] == req.screen_key),
                        None
                    )
                    
                    if existing_placement:
                        # 기존 배치 정보 수정
                        await repo.update_placement(
                            popup_id=popup_id,
                            screen_key=req.screen_key,
                            priority=req.priority if req.priority is not None else existing_placement['priority'],
                            is_active=req.placement_is_active if req.placement_is_active is not None else existing_placement['is_active'],
                        )
                    else:
                        # 새 배치 정보 생성
                        await repo.create_placement(
                            popup_id=popup_id,
                            screen_key=req.screen_key,
                            priority=req.priority or 1,
                            is_active=req.placement_is_active if req.placement_is_active is not None else True,
                        )
                else:
                    # screen_key가 없으면 기존 배치 정보만 수정
                    for placement in existing_placements:
                        await repo.update_placement(
                            popup_id=popup_id,
                            screen_key=placement['screen_key'],
                            priority=req.priority if req.priority is not None else placement['priority'],
                            is_active=req.placement_is_active if req.placement_is_active is not None else placement['is_active'],
                        )

            await conn.commit()

            return ApiResponse.success({
                "popup_id": popup_id,
                "message": "Popup updated successfully"
            })
```

### 4. PopupRepository에 메서드 추가

```python
class PopupRepository:
    def __init__(self, cursor):
        self.cursor = cursor

    # ... 기존 메서드들 ...

    # ------------------------------
    # 팝업 정보 수정
    # ------------------------------
    async def update_popup(
        self,
        popup_id: int,
        popup_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        start_at: Optional[datetime] = None,
        end_at: Optional[datetime] = None,
    ):
        """
        팝업 메타 정보 수정
        """
        updates = []
        params = []

        if popup_type is not None:
            updates.append("popup_type = %s")
            params.append(popup_type)

        if is_active is not None:
            updates.append("is_active = %s")
            params.append(1 if is_active else 0)

        if start_at is not None:
            updates.append("start_at = %s")
            params.append(start_at)

        if end_at is not None:
            updates.append("end_at = %s")
            params.append(end_at)

        if not updates:
            return

        params.append(popup_id)

        await self.cursor.execute(
            f"""
            UPDATE notifications_service.app_popup
            SET {', '.join(updates)}
            WHERE id = %s
            """,
            params,
        )

    # ------------------------------
    # 모든 슬라이드 삭제
    # ------------------------------
    async def delete_all_slides(self, popup_id: int):
        """
        팝업의 모든 슬라이드 삭제
        """
        await self.cursor.execute(
            """
            DELETE FROM notifications_service.app_popup_slide
            WHERE popup_id = %s
            """,
            (popup_id,),
        )

    # ------------------------------
    # 특정 슬라이드 삭제
    # ------------------------------
    async def delete_slide(self, slide_id: int):
        """
        특정 슬라이드 삭제
        """
        await self.cursor.execute(
            """
            DELETE FROM notifications_service.app_popup_slide
            WHERE id = %s
            """,
            (slide_id,),
        )

    # ------------------------------
    # 슬라이드 수정
    # ------------------------------
    async def update_slide(
        self,
        slide_id: int,
        sort_order: Optional[int] = None,
        image_url: Optional[str] = None,
        title: Optional[str] = None,
        body: Optional[str] = None,
        link_type: Optional[str] = None,
        link_target: Optional[str] = None,
    ):
        """
        슬라이드 정보 수정
        """
        updates = []
        params = []

        if sort_order is not None:
            updates.append("sort_order = %s")
            params.append(sort_order)

        if image_url is not None:
            updates.append("image_url = %s")
            params.append(image_url)

        if title is not None:
            updates.append("title = %s")
            params.append(title)

        if body is not None:
            updates.append("body = %s")
            params.append(body)

        if link_type is not None:
            updates.append("link_type = %s")
            params.append(link_type)

        if link_target is not None:
            updates.append("link_target = %s")
            params.append(link_target)

        if not updates:
            return

        params.append(slide_id)

        await self.cursor.execute(
            f"""
            UPDATE notifications_service.app_popup_slide
            SET {', '.join(updates)}
            WHERE id = %s
            """,
            params,
        )

    # ------------------------------
    # 팝업의 모든 배치 정보 조회
    # ------------------------------
    async def find_placements_by_popup_id(self, popup_id: int) -> List[Dict[str, Any]]:
        """
        특정 팝업의 모든 배치 정보 조회
        """
        await self.cursor.execute(
            """
            SELECT id, popup_id, screen_key, priority, is_active
            FROM notifications_service.app_popup_placement
            WHERE popup_id = %s
            """,
            (popup_id,),
        )
        return await self.cursor.fetchall()

    # ------------------------------
    # 배치 정보 수정
    # ------------------------------
    async def update_placement(
        self,
        popup_id: int,
        screen_key: str,
        priority: Optional[int] = None,
        is_active: Optional[bool] = None,
    ):
        """
        배치 정보 수정
        """
        updates = []
        params = []

        if priority is not None:
            updates.append("priority = %s")
            params.append(priority)

        if is_active is not None:
            updates.append("is_active = %s")
            params.append(1 if is_active else 0)

        if not updates:
            return

        params.extend([popup_id, screen_key])

        await self.cursor.execute(
            f"""
            UPDATE notifications_service.app_popup_placement
            SET {', '.join(updates)}
            WHERE popup_id = %s AND screen_key = %s
            """,
            params,
        )
```

## 사용 예시

### 1. 팝업 메타 정보만 수정

```http
PUT /v3/popups/123
Content-Type: application/json

{
  "is_active": false,
  "start_at": "2024-01-01T00:00:00",
  "end_at": "2024-12-31T23:59:59"
}
```

### 2. 슬라이드 수정 (전체 교체)

```http
PUT /v3/popups/123
Content-Type: application/json

{
  "slides": [
    {
      "sort_order": 1,
      "image_url": "https://example.com/image1.jpg",
      "title": "슬라이드 1",
      "body": "내용 1"
    },
    {
      "sort_order": 2,
      "image_url": "https://example.com/image2.jpg",
      "title": "슬라이드 2",
      "body": "내용 2"
    }
  ]
}
```

### 3. 배치 정보 수정

```http
PUT /v3/popups/123
Content-Type: application/json

{
  "screen_key": "ranking",
  "priority": 2,
  "placement_is_active": true
}
```

### 4. 전체 수정 (메타 + 슬라이드 + 배치)

```http
PUT /v3/popups/123
Content-Type: application/json

{
  "popup_type": "MULTI",
  "is_active": true,
  "start_at": "2024-01-01T00:00:00",
  "end_at": "2024-12-31T23:59:59",
  "screen_key": "ranking",
  "priority": 1,
  "placement_is_active": true,
  "slides": [
    {
      "sort_order": 1,
      "image_url": "https://example.com/image1.jpg",
      "title": "슬라이드 1",
      "body": "내용 1",
      "link_type": "IN_APP",
      "link_target": "/home"
    },
    {
      "sort_order": 2,
      "image_url": "https://example.com/image2.jpg",
      "title": "슬라이드 2",
      "body": "내용 2",
      "link_type": "EXTERNAL",
      "link_target": "https://example.com"
    }
  ]
}
```

## 응답 예시

```json
{
  "result": {
    "code": 200,
    "body": {
      "popup_id": 123,
      "message": "Popup updated successfully"
    }
  }
}
```

## 에러 처리

### 팝업이 존재하지 않는 경우

```json
{
  "result": {
    "code": 404,
    "message": "Popup with id 999 not found"
  }
}
```

## 설계 고려사항

### 슬라이드 수정 방식

현재 구현은 **전체 교체 방식**입니다:
- `slides` 배열을 전달하면 기존 슬라이드 모두 삭제 후 새로 생성
- 장점: 구현이 간단하고 일관성 있음
- 단점: 모든 슬라이드를 다시 전송해야 함

### 대안: 부분 수정 방식

더 세밀한 제어가 필요하다면:
- `slides_to_add`: 새로 추가할 슬라이드
- `slides_to_update`: 수정할 슬라이드 (id 필요)
- `slides_to_delete`: 삭제할 슬라이드 ID 목록

하지만 현재 구현은 전체 교체 방식으로 단순하게 유지했습니다.

### 팝업 타입 변경

- SINGLE → MULTI: 슬라이드가 1개 이상이면 가능
- MULTI → SINGLE: 슬라이드가 1개만 남으면 가능
- 현재 구현에서는 타입 변경 시 검증 로직을 추가하지 않았지만, 필요시 추가 가능

## 프론트엔드 연동

프론트엔드에서 사용할 API 함수:

```javascript
// src/services/api.js에 추가
export async function updatePopup(popupId, updateData) {
  const response = await fetch(
    getServiceUrl(ServicePort.NOTIFICATION, `/v3/popups/${popupId}`),
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.result?.message || `HTTP error! status: ${response.status}`)
  }

  return handleResponse(response)
}
```

