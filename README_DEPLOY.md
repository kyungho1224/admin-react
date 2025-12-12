# 배포 가이드

## 🚀 Vercel 배포 (가장 간단한 방법 - 추천!)

Vercel은 React/Vite 앱을 배포하기에 가장 간단하고 빠른 방법입니다.

### 1. Vercel CLI 설치 (선택사항)

```bash
npm i -g vercel
```

### 2. 배포 방법

#### 방법 A: Vercel 웹사이트 사용 (가장 간단)

1. [Vercel](https://vercel.com)에 가입/로그인
2. "Add New Project" 클릭
3. GitHub/GitLab/Bitbucket에서 프로젝트 import
4. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. "Deploy" 클릭

#### 방법 B: Vercel CLI 사용

```bash
# 프로젝트 디렉토리에서
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 환경 변수 설정 (필요한 경우)

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서 설정

### 4. 자동 배포

- GitHub에 push하면 자동으로 배포됩니다
- Pull Request마다 Preview 배포가 생성됩니다

### 5. 커스텀 도메인 연결

Vercel 대시보드 → 프로젝트 → Settings → Domains에서 도메인 추가

### 장점
- ✅ 무료 플랜 제공
- ✅ 자동 HTTPS
- ✅ 글로벌 CDN
- ✅ 자동 배포 (Git push 시)
- ✅ Preview 배포 (PR마다)
- ✅ 매우 간단한 설정

---

## Docker를 사용한 배포

### 1. 로컬 개발 환경

```bash
# Docker Compose 사용 (개발용)
docker-compose up -d --build

# 접속: http://localhost:3001
```

### 2. 프로덕션 배포 (외부 접속 가능)

#### 방법 1: 간단한 배포 (포트 80 사용)

```bash
# 프로덕션 설정으로 실행
docker-compose -f docker-compose.prod.yml up -d --build

# 접속: http://서버IP주소
```

#### 방법 2: 포트 변경하여 배포

`docker-compose.prod.yml` 파일에서 포트를 변경:

```yaml
ports:
  - "원하는포트:80"  # 예: "8080:80"
```

그 후 실행:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. 서버에 배포하는 방법

#### A. 서버 준비 (Ubuntu/Debian 예시)

```bash
# 1. 서버에 접속
ssh user@your-server-ip

# 2. Docker 설치 (아직 설치되지 않은 경우)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 프로젝트 파일 업로드 (scp 또는 git clone)
# 예: git clone 또는 scp로 파일 전송
```

#### B. 프로젝트 배포

```bash
# 1. 프로젝트 디렉토리로 이동
cd /path/to/admin-react

# 2. Docker 이미지 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d --build

# 3. 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 4. 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

### 4. 방화벽 설정

서버의 방화벽에서 포트를 열어야 합니다:

```bash
# UFW 사용 시 (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # HTTPS 사용 시
sudo ufw reload

# 또는 iptables 직접 사용
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 5. 도메인 연결 (선택사항)

#### A. 도메인 DNS 설정

도메인의 A 레코드를 서버 IP로 설정:
```
A 레코드: @ 또는 www → 서버IP주소
```

#### B. Nginx Reverse Proxy 설정 (도메인 사용 시 권장)

`nginx-proxy.conf` 파일 생성:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. HTTPS 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

### 7. 관리 명령어

```bash
# 컨테이너 중지
docker-compose -f docker-compose.prod.yml down

# 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f admin-react

# 이미지 재빌드
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate

# 컨테이너 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

### 8. 클라우드 서비스 배포 (선택사항)

#### AWS EC2
1. EC2 인스턴스 생성
2. 보안 그룹에서 포트 80, 443 열기
3. 위의 서버 배포 방법 참고

#### Google Cloud Platform
1. Compute Engine 인스턴스 생성
2. 방화벽 규칙에서 포트 80, 443 허용
3. 위의 서버 배포 방법 참고

#### DigitalOcean
1. Droplet 생성
2. 방화벽에서 포트 80, 443 허용
3. 위의 서버 배포 방법 참고

## 트러블슈팅

### 포트가 이미 사용 중인 경우

```bash
# 포트 사용 확인
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# 다른 서비스 중지 또는 포트 변경
```

### Docker 권한 문제

```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER
# 로그아웃 후 다시 로그인
```

### 이미지 빌드 실패

```bash
# 캐시 없이 재빌드
docker-compose -f docker-compose.prod.yml build --no-cache
```
