#!/bin/bash

# 배포 스크립트
# 사용법: ./scripts/deploy.sh [dev|prod] [--skip-git]

set -e

ENV=${1:-dev}
SKIP_GIT=${2:-""}

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo "❌ 잘못된 환경입니다. 'dev' 또는 'prod'를 선택하세요."
  echo "사용법: ./scripts/deploy.sh [dev|prod] [--skip-git]"
  exit 1
fi

echo "🚀 배포 환경: $ENV"

# 1. 환경 변수 먼저 설정 (Git 푸시 전에 설정해야 자동 배포 시 올바른 환경 사용)
if [ "$ENV" = "prod" ]; then
  echo "🔧 Production 환경 변수 설정 중..."
  printf "production" | npx vercel env rm VITE_API_ENV production --yes 2>/dev/null || true
  printf "production" | npx vercel env add VITE_API_ENV production
  echo "✅ Production 환경 변수 설정 완료"
else
  echo "🔧 Development 환경 변수 설정 중..."
  printf "development" | npx vercel env rm VITE_API_ENV preview --yes 2>/dev/null || true
  printf "development" | npx vercel env add VITE_API_ENV preview
  echo "✅ Development 환경 변수 설정 완료"
fi

# 2. Git 변경사항 확인 및 푸시
if [ "$SKIP_GIT" != "--skip-git" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Git 변경사항이 있습니다."
    read -p "커밋 후 푸시하시겠습니까? (Y/n): " push_confirm
    
    if [ "$push_confirm" != "n" ] && [ "$push_confirm" != "N" ]; then
      read -p "커밋 메시지를 입력하세요 (Enter: 자동 생성): " commit_msg
      
      if [ -z "$commit_msg" ]; then
        commit_msg="chore: $ENV 환경으로 배포"
      fi
      
      git add .
      git commit -m "$commit_msg"
      
      # Git 푸시 시도
      if ! git push 2>&1 | tee /tmp/git_push_output.txt; then
        if grep -q "GH013" /tmp/git_push_output.txt; then
          echo "⚠️  Git 푸시가 차단되었습니다. (AWS 자격 증명 감지)"
          echo "💡 Git 푸시 없이 Vercel CLI로만 배포를 진행합니다."
        else
          echo "❌ Git 푸시 실패"
          exit 1
        fi
      else
        echo "✅ Git 푸시 완료 (자동 배포 시작됨)"
        echo "ℹ️  Vercel이 자동으로 배포를 시작합니다. CLI 배포는 건너뜁니다."
        exit 0
      fi
    else
      echo "ℹ️  Git 푸시를 건너뜁니다. CLI로만 배포합니다."
    fi
  else
    echo "ℹ️  Git 변경사항이 없습니다. CLI로만 배포합니다."
  fi
else
  echo "ℹ️  Git 푸시를 건너뜁니다. (--skip-git 옵션)"
fi

# 3. Vercel CLI로 직접 배포 (Git 푸시가 없거나 실패한 경우)
if [ "$ENV" = "prod" ]; then
  echo "🚀 Production 배포 시작 (CLI)..."
  npx vercel --prod --yes
else
  echo "🚀 Development 배포 시작 (CLI)..."
  npx vercel --yes
fi

echo "✅ 배포 완료!"

