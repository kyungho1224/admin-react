# Vercel 배포 사이트 공개 설정 방법

## 문제
배포된 사이트에 다른 사람들이 접근할 수 없고, Vercel 로그인을 요구하는 경우

## 해결 방법

### 1. 프로덕션 URL 확인
현재 프로덕션 URL: `https://admin-react-bice.vercel.app`

이 URL은 기본적으로 **공개**되어야 합니다. 만약 로그인을 요구한다면 아래 설정을 확인하세요.

### 2. Vercel 대시보드에서 확인할 사항

#### A. 프로젝트 설정 확인
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. `admin-react` 프로젝트 클릭
3. **Settings** 탭 클릭
4. **General** 섹션 확인

#### B. Password Protection 비활성화
1. Settings → **Deployment Protection** 섹션 확인
2. **Password Protection**이 활성화되어 있다면 비활성화
3. 또는 **Vercel Authentication**이 활성화되어 있다면 비활성화

#### C. 팀 설정 확인 (팀 계정인 경우)
1. Settings → **General** → **Team** 확인
2. 프로젝트가 팀에 속해 있다면, 팀 설정에서 공개 여부 확인

### 3. 올바른 URL 사용
- ✅ **프로덕션 URL**: `https://admin-react-bice.vercel.app` (공개)
- ❌ **Preview URL**: `https://admin-react-xxxxx-hugos-projects-58ce7e89.vercel.app` (비공개일 수 있음)

### 4. 커스텀 도메인 설정 (선택사항)
더 나은 URL을 원한다면:
1. Settings → **Domains**
2. 원하는 도메인 추가 (예: `admin.yourdomain.com`)
3. DNS 설정 안내에 따라 도메인 연결

### 5. 빠른 확인 방법
브라우저 시크릿 모드(또는 다른 브라우저)에서 프로덕션 URL 접속:
```
https://admin-react-bice.vercel.app
```

로그인 없이 접속되면 정상입니다.

## 문제가 계속되면

### CLI로 배포 정보 확인
```bash
npx vercel inspect https://admin-react-bice.vercel.app
```

### Vercel 지원팀 문의
- [Vercel Support](https://vercel.com/support)
- 또는 Vercel 대시보드에서 "Help" 클릭

## 참고
- Vercel의 프로덕션 배포는 기본적으로 **공개**입니다
- Preview 배포는 PR마다 생성되며, 기본적으로 비공개일 수 있습니다
- Password Protection이 활성화되어 있으면 모든 접근이 제한됩니다



