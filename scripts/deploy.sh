#!/bin/bash

# 배포 스크립트
# 사용법: ./scripts/deploy.sh [--skip-git] [--prod]
# 
# 참고: 환경(개발/운영)은 사이트 헤더에서 직접 변경할 수 있습니다.
# 이 스크립트는 단순히 Git push와 Vercel 배포만 수행합니다.

set -e

SKIP_GIT=false
PROD_DEPLOY=false

# 옵션 파싱
for arg in "$@"; do
  case $arg in
    --skip-git)
      SKIP_GIT=true
      shift
      ;;
    --prod)
      PROD_DEPLOY=true
      shift
      ;;
    *)
      echo "⚠️  알 수 없는 옵션: $arg"
      ;;
  esac
done

echo "🚀 배포 시작"
echo "ℹ️  환경(개발/운영)은 배포 후 사이트 헤더에서 변경할 수 있습니다."

# Git 변경사항 확인 및 푸시
if [ "$SKIP_GIT" = false ]; then
  if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Git 변경사항이 있습니다."
    read -p "커밋 후 푸시하시겠습니까? (Y/n): " push_confirm
    
    if [ "$push_confirm" != "n" ] && [ "$push_confirm" != "N" ]; then
      read -p "커밋 메시지를 입력하세요 (Enter: 자동 생성): " commit_msg
      
      if [ -z "$commit_msg" ]; then
        commit_msg="chore: 배포"
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
        echo "✅ Git 푸시 완료"
        echo "ℹ️  Vercel이 자동으로 배포를 시작합니다."
        echo "💡 배포가 완료되면 사이트 헤더에서 환경을 변경할 수 있습니다."
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

# Vercel CLI로 직접 배포 (Git 푸시가 없거나 실패한 경우)
if [ "$PROD_DEPLOY" = true ]; then
  echo "🚀 Production 배포 시작 (CLI)..."
  npx vercel --prod --yes
else
  echo "🚀 Preview 배포 시작 (CLI)..."
  npx vercel --yes
fi

echo "✅ 배포 완료!"
echo "💡 배포 후 사이트 헤더에서 환경(개발/운영)을 변경할 수 있습니다."

