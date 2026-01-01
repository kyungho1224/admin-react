# GA 이벤트 조회 백엔드 구현 가이드

Google Analytics BigQuery 데이터를 조회하는 엔드포인트를 구현합니다.

## 필요한 엔드포인트

### GA 이벤트 통계 조회
- **경로**: `GET /v3/analytics/ga-events`
- **쿼리 파라미터**:
  - `date` (required): 조회할 날짜 (YYYY-MM-DD 형식)

- **응답**:
```json
{
  "result": {
    "code": 200,
    "body": {
      "date": "2024-01-15",
      "events": [
        {
          "event_name": "app_start",
          "event_count": 1234,
          "user_count": 567,
          "prev_event_count": 1200,
          "prev_user_count": 550,
          "event_count_pct": 2.8,
          "user_count_pct": 3.1
        },
        ...
      ]
    }
  }
}
```

## FastAPI 구현 예시

### 1. Router에 엔드포인트 추가

```python
from fastapi import APIRouter, Query, Depends
from dependency_injector.wiring import inject, Provide
from datetime import date
from common_models.api import ApiResponse
from di.app_module import AppModule
from usecases.v3_analytics.ga_events_service import GAEventsService

router_v3_analytics = APIRouter(prefix="/v3/analytics", tags=["Analytics"])

@router_v3_analytics.get("/ga-events", response_model=ApiResponse)
@inject
async def get_ga_events(
    date: str = Query(..., description="조회할 날짜 (YYYY-MM-DD)"),
    service: GAEventsService = Depends(Provide[AppModule.ga_events_service])
):
    """
    GA 커스텀 이벤트 통계 조회
    - 선택한 날짜와 전일 데이터를 비교하여 증감률 계산
    """
    try:
        selected_date = date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용하세요.")
    
    return await service.get_event_stats(selected_date)
```

### 2. GAEventsService 구현

```python
from typing import List, Dict, Any
from datetime import date, timedelta
from google.cloud import bigquery
from infrastructure.rds_uow import RDSUoW
from repositories.ga_events_repository import GAEventsRepository
from common_models.api import ApiResponse
import os

# BigQuery 설정
PROJECT_ID = os.getenv("GA_PROJECT_ID", "funpik-308a8")
DATASET = os.getenv("GA_DATASET", "analytics_274755487")
TABLE_PATTERN = f"`{PROJECT_ID}.{DATASET}.events_*`"

# BigQuery 클라이언트 초기화
# 서비스 계정 키 파일 경로 또는 환경 변수에서 자격 증명 로드
def get_bigquery_client():
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if credentials_path:
        return bigquery.Client.from_service_account_json(credentials_path)
    else:
        # 환경 변수에서 자격 증명 사용
        return bigquery.Client(project=PROJECT_ID)

class GAEventsService:
    def __init__(self, rdsuow: RDSUoW):
        self.rdsuow = rdsuow
        self.bq_client = get_bigquery_client()

    # -------------------------------------------------
    # GA 이벤트 통계 조회
    # -------------------------------------------------
    async def get_event_stats(self, selected_date: date) -> dict:
        """
        GA 커스텀 이벤트 통계 조회
        - 선택한 날짜와 전일 데이터를 비교하여 증감률 계산
        """
        from constant.ga_custom_event_info import GA_CUSTOM_EVENT_INFO
        
        custom_events = list(GA_CUSTOM_EVENT_INFO.keys())
        custom_events_sql = ", ".join([f"'{e}'" for e in custom_events])
        
        # 선택한 날짜 데이터 조회
        selected_date_str = selected_date.isoformat()
        prev_date = selected_date - timedelta(days=1)
        prev_date_str = prev_date.isoformat()
        
        query = f"""
        SELECT
          event_name,
          COUNT(*) AS event_count,
          COUNT(DISTINCT user_pseudo_id) AS user_count
        FROM {TABLE_PATTERN}
        WHERE DATE(TIMESTAMP_MICROS(event_timestamp), 'Asia/Seoul') = DATE('{selected_date_str}')
          AND event_name IN ({custom_events_sql})
        GROUP BY event_name
        ORDER BY event_count DESC
        """
        
        # 전일 데이터 조회
        prev_query = f"""
        SELECT
          event_name,
          COUNT(*) AS event_count,
          COUNT(DISTINCT user_pseudo_id) AS user_count
        FROM {TABLE_PATTERN}
        WHERE DATE(TIMESTAMP_MICROS(event_timestamp), 'Asia/Seoul') = DATE('{prev_date_str}')
          AND event_name IN ({custom_events_sql})
        GROUP BY event_name
        ORDER BY event_count DESC
        """
        
        # BigQuery 쿼리 실행
        selected_df = self.bq_client.query(query).to_dataframe()
        prev_df = self.bq_client.query(prev_query).to_dataframe()
        
        # 전일 데이터를 딕셔너리로 변환
        prev_dict = {}
        if not prev_df.empty:
            prev_dict = prev_df.set_index('event_name').to_dict('index')
        
        # 결과 데이터 구성
        events = []
        for _, row in selected_df.iterrows():
            event_name = row['event_name']
            event_count = int(row['event_count'])
            user_count = int(row['user_count'])
            
            prev_data = prev_dict.get(event_name, {})
            prev_event_count = int(prev_data.get('event_count', 0))
            prev_user_count = int(prev_data.get('user_count', 0))
            
            # 증감률 계산
            event_count_pct = 0.0
            if prev_event_count > 0:
                event_count_pct = round(((event_count - prev_event_count) / prev_event_count) * 100, 1)
            
            user_count_pct = 0.0
            if prev_user_count > 0:
                user_count_pct = round(((user_count - prev_user_count) / prev_user_count) * 100, 1)
            
            events.append({
                "event_name": event_name,
                "event_count": event_count,
                "user_count": user_count,
                "prev_event_count": prev_event_count,
                "prev_user_count": prev_user_count,
                "event_count_pct": event_count_pct,
                "user_count_pct": user_count_pct
            })
        
        return ApiResponse.success({
            "date": selected_date_str,
            "events": events
        })
```

### 3. 필요한 패키지 설치

```bash
pip install google-cloud-bigquery pandas
```

### 4. 환경 변수 설정

```bash
# BigQuery 프로젝트 정보
GA_PROJECT_ID=funpik-308a8
GA_DATASET=analytics_274755487

# Google 서비스 계정 키 파일 경로
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
```

또는 환경 변수로 직접 자격 증명 설정:
```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", ...}'
```

### 5. DI 설정

`di/app_module.py`에 추가:

```python
from usecases.v3_analytics.ga_events_service import GAEventsService

class AppModule(containers.DeclarativeContainer):
    # ... 기존 설정들 ...
    
    # GA Events Service
    ga_events_service = providers.Factory(
        GAEventsService,
        rdsuow=providers.Singleton(RDSUoW)
    )
```

### 6. constant/ga_custom_event_info.py

백엔드 프로젝트에 상수 파일 생성:

```python
GA_CUSTOM_EVENT_INFO = {
    "app_start": ("앱 시작", "APP"),
    "app_remove": ("앱 삭제", "APP"),
    # ... (프론트엔드와 동일한 내용)
}
```

## 주의사항

1. **BigQuery 권한**: 서비스 계정에 BigQuery 데이터 읽기 권한이 필요합니다.
2. **쿼리 비용**: BigQuery 쿼리는 비용이 발생할 수 있으므로 캐싱을 고려하세요.
3. **에러 처리**: BigQuery 쿼리 실패 시 적절한 에러 메시지 반환
4. **날짜 형식**: ISO 형식 (YYYY-MM-DD) 사용





