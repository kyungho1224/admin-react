# Vercel Deploy 버튼 비활성화 해결 방법

## Deploy 버튼이 비활성화되는 원인

### 1. 프로젝트 이름이 설정되지 않음 (가장 흔한 원인)

Vercel 화면 상단에 "Project Name" 필드가 있는지 확인하세요.
- 프로젝트 이름을 입력해야 Deploy 버튼이 활성화됩니다
- 예: `admin-react` 또는 원하는 이름

### 2. GitHub 저장소가 연결되지 않음

- "Import Git Repository" 섹션에서 `kyungho1224/admin-react` 저장소가 선택되어 있는지 확인
- 저장소가 보이지 않으면 "Configure GitHub App" 또는 "Connect GitHub" 버튼을 클릭하여 권한을 부여해야 합니다

### 3. 저장소가 비어있거나 접근 권한 없음

- GitHub 저장소가 비어있지 않은지 확인
- 저장소에 접근 권한이 있는지 확인

## 해결 방법

### 방법 1: 프로젝트 이름 확인

1. Vercel 화면 상단에서 "Project Name" 필드 찾기
2. 프로젝트 이름 입력 (예: `admin-react`)
3. Deploy 버튼 활성화 확인

### 방법 2: GitHub 저장소 재연결

1. "Import Git Repository" 섹션 확인
2. `kyungho1224/admin-react` 저장소가 보이는지 확인
3. 보이지 않으면:
   - "Configure GitHub App" 클릭
   - GitHub 권한 부여
   - 저장소 선택

### 방법 3: Vercel CLI로 배포 (대안)

웹 인터페이스에서 문제가 계속되면 CLI로 배포:

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서
vercel

# 환경 변수 설정 (대화형으로 입력)
# 또는 배포 후 Vercel 대시보드에서 설정
```

### 방법 4: 저장소 확인

GitHub 저장소가 제대로 푸시되었는지 확인:

```bash
# 로컬에서 확인
git remote -v
# origin  https://github.com/kyungho1224/admin-react.git (fetch)
# origin  https://github.com/kyungho1224/admin-react.git (push)

# GitHub에서 저장소 확인
# https://github.com/kyungho1224/admin-react
```

## 체크리스트

배포 전 확인사항:
- [ ] 프로젝트 이름이 입력되어 있음
- [ ] GitHub 저장소가 연결되어 있음
- [ ] 저장소에 파일이 있음 (비어있지 않음)
- [ ] GitHub 저장소 접근 권한이 있음

## 추가 도움말

여전히 문제가 있다면:
1. 브라우저를 새로고침 (F5)
2. 다른 브라우저에서 시도
3. Vercel CLI 사용 (위 방법 3 참고)



