# Vercel CLI 배포 가이드

## CLI로 배포하기

### 1. 배포 실행

```bash
cd /Users/kimkyungho/dev/CursorProject/admin-react
npx vercel
```

### 2. 배포 과정

CLI가 대화형으로 질문합니다:

1. **Set up and deploy?** → `Y` (Yes)
2. **Which scope?** → 본인 계정 선택
3. **Link to existing project?** → `N` (No, 새 프로젝트)
4. **What's your project's name?** → `AdminReactVite` (또는 원하는 이름)
5. **In which directory is your code located?** → `./` (Enter)
6. **Want to override the settings?** → `N` (No, 기본값 사용)

### 3. 환경 변수 설정

배포 후 Vercel 대시보드에서 환경 변수를 설정하거나, CLI에서 설정:

```bash
# 환경 변수 추가
npx vercel env add VITE_S3_BUCKET_NAME production
# 값 입력: funpik-development-media

npx vercel env add VITE_AWS_ACCESS_KEY_ID production
# 값 입력: (실제 AWS Access Key ID 입력)

npx vercel env add VITE_AWS_SECRET_ACCESS_KEY production
# 값 입력: (실제 AWS Secret Access Key 입력)

npx vercel env add VITE_AWS_S3_REGION production
# 값 입력: ap-northeast-2
```

### 4. 프로덕션 배포

```bash
npx vercel --prod
```

## 빠른 배포 (한 번에)

```bash
# 프로덕션 배포
npx vercel --prod --yes
```

## 환경 변수 일괄 설정

환경 변수 파일을 만들어서 한 번에 설정할 수도 있습니다:

```bash
# .env.production 파일 생성 (로컬에만, Git에 올리지 않음)
cat > .env.production << EOF
VITE_S3_BUCKET_NAME=funpik-development-media
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
VITE_AWS_S3_REGION=ap-northeast-2
EOF

# 환경 변수 업로드 (Vercel CLI가 지원하는 경우)
# 또는 Vercel 대시보드에서 수동으로 설정
```

## 배포 확인

배포가 완료되면:
- CLI가 배포 URL을 표시합니다
- 예: `https://admin-react-vite-xxxxx.vercel.app`
- 이 URL로 접속하면 앱이 정상 작동합니다

## 문제 해결

### 로그인 필요
```bash
npx vercel login
```

### 프로젝트 목록 확인
```bash
npx vercel ls
```

### 배포 로그 확인
```bash
npx vercel logs
```



