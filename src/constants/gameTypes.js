/**
 * 게임 타입 목록
 * TODO: 나중에 API로 게임 목록을 가져올 수 있도록 변경 가능
 * 
 * 사용 예시:
 * import { GAME_TYPES, getGameTypeByKey } from '../constants/gameTypes'
 * 
 * API 연동 시:
 * const GAME_TYPES = await fetchGameTypes() // API에서 가져오기
 */

export const GAME_TYPES = [
  {
    key: 'conversation-quiz',
    label: '회화 퀴즈',
    value: 'conversation-quiz',
  },
  {
    key: 'association-quiz',
    label: '연상 퀴즈',
    value: 'association-quiz',
  },
  {
    key: 'matching',
    label: '짝 맞추기',
    value: 'matching',
  },
  {
    key: 'word-completion',
    label: '단어 완성',
    value: 'word-completion',
  },
]

/**
 * 게임 키로 게임 정보 가져오기
 * @param {string} gameKey - 게임 키
 * @returns {Object|null} 게임 정보
 */
export function getGameTypeByKey(gameKey) {
  return GAME_TYPES.find(game => game.key === gameKey) || null
}

/**
 * 게임 라벨로 게임 정보 가져오기
 * @param {string} label - 게임 라벨
 * @returns {Object|null} 게임 정보
 */
export function getGameTypeByLabel(label) {
  return GAME_TYPES.find(game => game.label === label) || null
}


