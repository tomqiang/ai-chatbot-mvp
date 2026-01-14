/**
 * Deterministic server-side detection of major set pieces (multi-day conflicts)
 * Used to enforce cliffhanger/unresolved endings for major events.
 */

export type SetPieceType = 'boss_fight' | 'escape' | 'siege' | 'disaster' | 'unknown'

export interface SetPieceDetection {
  isMajor: boolean
  type: SetPieceType
  matched: string[]
}

// Enemy keywords (powerful creatures)
const ENEMY_KEYWORDS = [
  '巨龙', '恶龙', '古龙', '龙', '魔王', '巨兽', '巨人', '亡灵军团', '军团'
]

// Conflict keywords (combat/struggle)
const CONFLICT_KEYWORDS = [
  '搏斗', '死战', '血战', '决战', '大战', '围攻', '突围', '追杀', '逃亡', '破阵'
]

// Disaster keywords (catastrophic events)
const DISASTER_KEYWORDS = [
  '崩塌', '灾变', '暴走', '失控', '爆裂', '封印松动', '封印失效'
]

/**
 * Detect if today's user event indicates a major set piece
 * Returns deterministic classification based on keyword matching
 */
export function detectSetPiece(todayUserEvent: string): SetPieceDetection {
  const event = todayUserEvent.trim()
  const matched: string[] = []
  let type: SetPieceType = 'unknown'
  let isMajor = false

  // Check for enemy keywords
  const enemyMatches = ENEMY_KEYWORDS.filter(kw => event.includes(kw))
  if (enemyMatches.length > 0) {
    matched.push(...enemyMatches)
    type = 'boss_fight'
    isMajor = true
  }

  // Check for conflict keywords
  const conflictMatches = CONFLICT_KEYWORDS.filter(kw => event.includes(kw))
  if (conflictMatches.length > 0) {
    matched.push(...conflictMatches)
    
    // Classify conflict type
    if (conflictMatches.some(kw => ['逃亡', '突围', '追杀'].includes(kw))) {
      type = 'escape'
      isMajor = true
    } else if (conflictMatches.some(kw => ['围攻', '军团'].includes(kw)) || event.includes('围城') || event.includes('攻城')) {
      type = 'siege'
      isMajor = true
    } else if (conflictMatches.some(kw => ['决战', '死战', '搏斗'].includes(kw))) {
      type = 'boss_fight'
      isMajor = true
    } else if (isMajor === false) {
      // Other conflict keywords (大战, 血战, 破阵) also indicate major set piece
      type = 'boss_fight'
      isMajor = true
    }
  }

  // Check for disaster keywords
  const disasterMatches = DISASTER_KEYWORDS.filter(kw => event.includes(kw))
  if (disasterMatches.length > 0) {
    matched.push(...disasterMatches)
    type = 'disaster'
    isMajor = true
  }

  // Combination boost: conflict + enemy = definitely major
  if (enemyMatches.length > 0 && conflictMatches.length > 0) {
    isMajor = true
    if (type === 'unknown') {
      type = 'boss_fight'
    }
  }

  return {
    isMajor,
    type,
    matched: [...new Set(matched)], // Remove duplicates
  }
}

// Internal sanity check (dev-only examples)
if (process.env.NODE_ENV === 'development') {
  // Test cases (commented out in production)
  const testCases = [
    { event: '布布和巨龙搏斗，一二释放魔法支援', expected: { isMajor: true, type: 'boss_fight' as SetPieceType } },
    { event: '他们被亡灵军团围攻', expected: { isMajor: true, type: 'siege' as SetPieceType } },
    { event: '一二和布布被迫逃亡', expected: { isMajor: true, type: 'escape' as SetPieceType } },
    { event: '古堡崩塌，封印失效', expected: { isMajor: true, type: 'disaster' as SetPieceType } },
    { event: '一二在森林中发现了一处古老的遗迹', expected: { isMajor: false, type: 'unknown' as SetPieceType } },
  ]
  
  // Uncomment to run tests:
  // testCases.forEach(({ event, expected }) => {
  //   const result = detectSetPiece(event)
  //   console.assert(
  //     result.isMajor === expected.isMajor && result.type === expected.type,
  //     `SetPiece detection failed for: ${event}`
  //   )
  // })
}
