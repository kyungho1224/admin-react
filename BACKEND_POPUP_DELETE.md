# 팝업 삭제(비활성화) 엔드포인트 구현 가이드

## 삭제 방식 설명

팝업 삭제는 두 가지 방식이 가능합니다:

1. **팝업 완전 비활성화** (`app_popup.is_active = 0`)
   - 해당 팝업이 모든 화면에서 사라짐
   - SINGLE/MULTI 모두 동일하게 동작

2. **특정 화면에서만 제거** (`app_popup_placement.is_active = 0`)
   - 특정 화면에서만 사라지고 다른 화면에서는 계속 노출
   - 화면별로 독립적으로 관리 가능

## 구현 코드

### 1. Router에 엔드포인트 추가

```python
from fastapi import APIRouter, Path, Query
from fastapi.params import Depends
from dependency_injector.wiring import inject, Provide
from common_models.api import ApiResponse
from di.app_module import AppModule
from usecases.v3_popups.popup_service import PopupService

router_v3 = APIRouter(prefix="/popups", tags=['Popups_v3'])

# ... 기존 엔드포인트들 ...

@router_v3.delete("/{popup_id}", response_model=ApiResponse)
@inject
async def delete_popup(
    popup_id: int = Path(..., description="팝업 ID"),
    screen: str = Query(None, description="화면 키 (지정 시 해당 화면에서만 제거, 미지정 시 완전 비활성화)"),
    service: PopupService = Depends(Provide[AppModule.popup_service])
):
    """
    팝업 삭제(비활성화)
    - screen 파라미터가 없으면: 팝업을 완전히 비활성화 (모든 화면에서 제거)
    - screen 파라미터가 있으면: 해당 화면에서만 제거 (다른 화면에서는 계속 노출)
    """
    return await service.delete_popup(popup_id=popup_id, screen_key=screen)
```

### 2. PopupService에 메서드 추가

```python
class PopupService:
    def __init__(self, rdsuow: RDSUoW):
        self.rdsuow = rdsuow

    # ... 기존 메서드들 ...

    # -------------------------------------------------
    # 팝업 삭제(비활성화)
    # -------------------------------------------------
    async def delete_popup(self, popup_id: int, screen_key: Optional[str] = None) -> dict:
        """
        팝업 삭제(비활성화)
        
        Args:
            popup_id: 삭제할 팝업 ID
            screen_key: None이면 팝업 완전 비활성화, 지정하면 해당 화면에서만 제거
        
        Returns:
            ApiResponse
        """
        async with self.rdsuow as (conn, cursor):
            repo = PopupRepository(cursor)

            # 팝업 존재 여부 확인
            popup = await repo.find_popup_by_id(popup_id)
            if not popup:
                return ApiResponse.error(
                    code=404,
                    message=f"Popup with id {popup_id} not found"
                )

            if screen_key:
                # 특정 화면에서만 제거
                placement = await repo.find_placement(popup_id, screen_key)
                if not placement:
                    return ApiResponse.error(
                        code=404,
                        message=f"Popup {popup_id} is not placed on screen '{screen_key}'"
                    )
                
                await repo.deactivate_placement(popup_id, screen_key)
                return ApiResponse.success({
                    "popup_id": popup_id,
                    "screen_key": screen_key,
                    "message": f"Popup removed from screen '{screen_key}'"
                })
            else:
                # 팝업 완전 비활성화
                await repo.deactivate_popup(popup_id)
                return ApiResponse.success({
                    "popup_id": popup_id,
                    "message": "Popup deactivated successfully"
                })
```

### 3. PopupRepository에 메서드 추가

```python
class PopupRepository:
    def __init__(self, cursor):
        self.cursor = cursor

    # ... 기존 메서드들 ...

    # ------------------------------
    # 배치 정보 조회
    # ------------------------------
    async def find_placement(self, popup_id: int, screen_key: str) -> Optional[Dict[str, Any]]:
        """
        특정 팝업의 특정 화면 배치 정보 조회
        """
        await self.cursor.execute(
            """
            SELECT id, popup_id, screen_key, priority, is_active
            FROM notifications_service.app_popup_placement
            WHERE popup_id = %s AND screen_key = %s
            """,
            (popup_id, screen_key),
        )
        return await self.cursor.fetchone()

    # ------------------------------
    # 팝업 완전 비활성화
    # ------------------------------
    async def deactivate_popup(self, popup_id: int):
        """
        팝업을 완전히 비활성화 (모든 화면에서 제거)
        """
        await self.cursor.execute(
            """
            UPDATE notifications_service.app_popup
            SET is_active = 0
            WHERE id = %s
            """,
            (popup_id,),
        )

    # ------------------------------
    # 특정 화면에서만 제거
    # ------------------------------
    async def deactivate_placement(self, popup_id: int, screen_key: str):
        """
        특정 화면에서만 팝업 제거 (다른 화면에서는 계속 노출)
        """
        await self.cursor.execute(
            """
            UPDATE notifications_service.app_popup_placement
            SET is_active = 0
            WHERE popup_id = %s AND screen_key = %s
            """,
            (popup_id, screen_key),
        )
```

## 사용 예시

### 1. 팝업 완전 비활성화 (모든 화면에서 제거)

```http
DELETE /v3/popups/123
```

**응답:**
```json
{
  "result": {
    "code": 200,
    "body": {
      "popup_id": 123,
      "message": "Popup deactivated successfully"
    }
  }
}
```

### 2. 특정 화면에서만 제거

```http
DELETE /v3/popups/123?screen=ranking
```

**응답:**
```json
{
  "result": {
    "code": 200,
    "body": {
      "popup_id": 123,
      "screen_key": "ranking",
      "message": "Popup removed from screen 'ranking'"
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

### 특정 화면에 배치되지 않은 경우

```json
{
  "result": {
    "code": 404,
    "message": "Popup 123 is not placed on screen 'home'"
  }
}
```

## SINGLE vs MULTI 동작

- **SINGLE**: 각 팝업이 독립적이므로 개별적으로 비활성화 가능
- **MULTI**: 하나의 팝업이 여러 슬라이드를 가지지만, 비활성화 방식은 동일
  - 완전 비활성화: 해당 MULTI 팝업 전체가 모든 화면에서 사라짐
  - 화면별 제거: 특정 화면에서만 해당 MULTI 팝업이 사라짐

## 프론트엔드 연동

프론트엔드에서 사용할 API 함수:

```javascript
// src/services/api.js에 추가
export async function deletePopup(popupId, screenKey = null) {
  const url = getServiceUrl(ServicePort.NOTIFICATION, `/v3/popups/${popupId}`)
  const queryParams = screenKey ? `?screen=${screenKey}` : ''
  
  const response = await fetch(`${url}${queryParams}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.result?.message || `HTTP error! status: ${response.status}`)
  }

  return handleResponse(response)
}
```

