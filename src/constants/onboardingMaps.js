// current_step_id → 한글 라벨 매핑
// home_quick_quest는 is_completed에 따라 분기: false→온보딩-홈 퀘스트, true→온보딩 완료
export const STEP_ID_MAP = {
  step_01_welcome: '온보딩-웰컴',
  step_02_pageview: '온보딩-페이지뷰',
  step_03_purchase: '온보딩-결제 페이지',
  step_04_level: '온보딩-학습 수준 선택',
  home_quick_quest: '온보딩-퀘스트',
  null: '온보딩 완료',
}

// user_type → 한글 라벨 매핑
export const USER_TYPE_MAP = {
  PAID_USER: '멤버십 전환 유저',
  PROMOTION_USER: '프로모션 멤버십 유저',
  IN_PROGRESS: '진행중',
}

export function getStepLabel(stepId, isCompleted) {
  if (stepId === 'home_quick_quest') {
    return isCompleted === 1 || isCompleted === true ? '온보딩 완료' : '온보딩-홈 퀘스트'
  }
  return STEP_ID_MAP[stepId] ?? stepId ?? '온보딩 완료'
}
