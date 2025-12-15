# Vercel 배포 설정 가이드

## 배포 설정 화면에서 채워야 할 항목

### ✅ 자동 감지되는 항목 (수정 불필요)
- **Framework Preset**: Vite (자동 선택됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (자동 감지)
- **Output Directory**: `dist` (자동 감지)
- **Install Command**: `npm install` (자동 감지)

### ⚠️ 반드시 설정해야 할 항목

#### Environment Variables (환경 변수)

"Environment Variables" 섹션에서 다음 4개 변수를 추가하세요:

1. **VITE_S3_BUCKET_NAME**
   - Key: `VITE_S3_BUCKET_NAME`
   - Value: `funpik-development-media`

2. **VITE_AWS_ACCESS_KEY_ID**
   - Key: `VITE_AWS_ACCESS_KEY_ID`
   - Value: (실제 AWS Access Key ID 입력)

3. **VITE_AWS_SECRET_ACCESS_KEY**
   - Key: `VITE_AWS_SECRET_ACCESS_KEY`
   - Value: (실제 AWS Secret Access Key 입력)

4. **VITE_AWS_S3_REGION**
   - Key: `VITE_AWS_S3_REGION`
   - Value: `ap-northeast-2`

### 📝 설정 방법

1. "Environment Variables" 섹션을 펼칩니다
2. "+ Add More" 버튼을 클릭합니다
3. 위의 4개 변수를 하나씩 추가합니다:
   - Key 입력란에 변수 이름 입력
   - Value 입력란에 값 입력
4. 모든 변수를 추가한 후 "Deploy" 버튼을 클릭합니다

### ⚡ 빠른 설정 팁

"Import .env" 버튼을 사용하면 `.env` 파일 내용을 한 번에 가져올 수 있습니다.
하지만 보안상 GitHub에 `.env` 파일을 올리지 않았으므로, 수동으로 추가하는 것이 안전합니다.

### ✅ 배포 후 확인

배포가 완료되면:
- Vercel이 자동으로 HTTPS URL을 제공합니다
- 예: `https://admin-react-xxxxx.vercel.app`
- 이 URL로 접속하면 앱이 정상 작동합니다



