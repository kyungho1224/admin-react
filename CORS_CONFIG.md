# S3 버킷 CORS 설정 가이드

## 문제
브라우저에서 S3에 직접 접근할 때 CORS 오류가 발생합니다.

## 해결 방법

### AWS 콘솔에서 S3 버킷 CORS 설정

1. AWS 콘솔 → S3 → `funpik-development-media` 버킷 선택
2. "권한(Permissions)" 탭 클릭
3. "CORS(Cross-origin resource sharing)" 섹션에서 "편집(Edit)" 클릭
4. 다음 JSON 설정을 추가:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

5. "변경 사항 저장" 클릭

## 참고
- `AllowedOrigins`를 `["*"]`로 설정하면 모든 도메인에서 접근 가능합니다.
- 프로덕션 환경에서는 특정 도메인만 허용하도록 수정하세요.
  예: `["https://yourdomain.com", "http://localhost:3001"]`



