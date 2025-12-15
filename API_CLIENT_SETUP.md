# API 클라이언트 설정 가이드

## 환경 변수 설정

개발/운영 환경을 구분하기 위해 환경 변수를 설정할 수 있습니다.

### 방법 1: `.env.local` 파일 (로컬 개발)

프로젝트 루트에 `.env.local` 파일을 생성:

```env
# 개발 환경 (기본값)
VITE_API_ENV=development

# 또는 운영 환경으로 전환
# VITE_API_ENV=production

# 또는 boolean 방식 사용
# VITE_USE_PRODUCTION=false
```

### 방법 2: Vercel 환경 변수 (배포 환경)

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서 설정:

- **Key**: `VITE_API_ENV`
- **Value**: `development` 또는 `production`

또는

- **Key**: `VITE_USE_PRODUCTION`
- **Value**: `true` 또는 `false`

## 서비스 포트

각 서비스는 포트로 구분됩니다:

```javascript
import { ServicePort } from './services/apiClient'

ServicePort.USER           // 9001
ServicePort.STUDY_PATTERNS // 9002
ServicePort.MISSIONS       // 9004
ServicePort.INVENTORY      // 9005
ServicePort.MONETIZATION   // 9006
ServicePort.NOTIFICATION   // 9007 (팝업 관리)
ServicePort.REWARDING      // 9008
ServicePort.GENERIC        // 9009
ServicePort.WEBSOCKET      // 9100
```

## API URL 생성

### 기본 사용법

```javascript
import { getServiceUrl, ServicePort } from './services/apiClient'

// 알림 서비스 (포트 9007)의 팝업 조회 API
const url = getServiceUrl(ServicePort.NOTIFICATION, '/v3/popups')
// 결과: https://dev.baseapi.funpik.net:9007/v3/popups (개발 환경)
// 또는: https://production.baseapi.funpik.net:9007/v3/popups (운영 환경)
```

### 기존 API 함수 사용

기존 API 함수들은 자동으로 환경에 맞는 URL을 사용합니다:

```javascript
import { getPopupsByScreen, createPopup } from './services/api'

// 개발/운영 환경에 따라 자동으로 올바른 URL 사용
const popups = await getPopupsByScreen('ranking')
```

## 환경 확인

현재 설정된 환경을 확인하려면:

```javascript
import { getApiConfig } from './services/apiClient'

const config = getApiConfig()
console.log(config)
// {
//   environment: 'development' | 'production',
//   host: 'https://dev.baseapi.funpik.net' | 'https://production.baseapi.funpik.net',
//   useProduction: false | true
// }
```

## 환경 변수 우선순위

1. `VITE_USE_PRODUCTION` (true/false)
2. `VITE_API_ENV` (development/production)
3. 기본값: development

## 예시

### 새로운 API 함수 추가

```javascript
import { getServiceUrl, ServicePort } from './services/apiClient'

export async function getUserInfo(userId) {
  const response = await fetch(
    getServiceUrl(ServicePort.USER, `/v3/users/${userId}`)
  )
  return handleResponse(response)
}
```

### 다른 서비스 포트 사용

```javascript
import { getServiceUrl, ServicePort } from './services/apiClient'

// 미션 서비스 (포트 9004)
const missionUrl = getServiceUrl(ServicePort.MISSIONS, '/v3/missions')

// 인벤토리 서비스 (포트 9005)
const inventoryUrl = getServiceUrl(ServicePort.INVENTORY, '/v3/items')
```

## 주의사항

- 환경 변수는 `VITE_` 접두사로 시작해야 Vite에서 접근 가능합니다
- 환경 변수 변경 후 개발 서버를 재시작해야 합니다
- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)

