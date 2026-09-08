// Outcome types and probability logic for the decision wheel

export type OutcomeId = 'yier' | 'bubu' | 'discuss'

export interface Outcome {
  id: OutcomeId
  label: string
  emoji: string
  image?: string
  color: string
  resultTitle: string
  instruction: string
}

export const OUTCOMES: Record<OutcomeId, Outcome> = {
  yier: {
    id: 'yier',
    label: '听一二',
    emoji: '🐼',
    image: '/decider/yier.jpeg',
    color: '#667eea',
    resultTitle: '一二赢啦！听一二的',
    instruction: '布布负责执行；一二负责补充备选。',
  },
  bubu: {
    id: 'bubu',
    label: '听布布',
    emoji: '🐻',
    image: '/decider/bubu.jpeg',
    color: '#48bb78',
    resultTitle: '布布赢啦！听布布的',
    instruction: '一二负责支援；布布负责落实步骤。',
  },
  discuss: {
    id: 'discuss',
    label: '再聊10分钟',
    emoji: '⏳',
    color: '#9f7aea',
    resultTitle: '沙漏裁定：再聊10分钟',
    instruction: '回答两个问题：①你最在意结果还是过程？②你愿意让步的边界是什么？',
  },
}

export interface WheelSegment {
  outcome: Outcome
  probability: number
  startAngle: number
  endAngle: number
}

/**
 * Calculate probabilities based on bias and whether "discuss" is enabled.
 * @param bias 0-100, where 0 = all to 一二, 100 = all to 布布
 * @param allowDiscuss whether to include "再聊10分钟" option
 */
export function calculateProbabilities(
  bias: number,
  allowDiscuss: boolean
): { outcomeId: OutcomeId; probability: number }[] {
  const discussProb = allowDiscuss ? 0.10 : 0
  const remaining = 1 - discussProb

  // bias 0 => yier gets all remaining
  // bias 100 => bubu gets all remaining
  // bias 50 => split evenly
  const biasRatio = bias / 100
  const bubuProb = remaining * biasRatio
  const yierProb = remaining * (1 - biasRatio)

  const probs: { outcomeId: OutcomeId; probability: number }[] = [
    { outcomeId: 'yier', probability: yierProb },
    { outcomeId: 'bubu', probability: bubuProb },
  ]

  if (allowDiscuss) {
    probs.push({ outcomeId: 'discuss', probability: discussProb })
  }

  return probs
}

/**
 * Build wheel segments with calculated angles
 */
export function buildWheelSegments(
  bias: number,
  allowDiscuss: boolean
): WheelSegment[] {
  const probs = calculateProbabilities(bias, allowDiscuss)
  const segments: WheelSegment[] = []
  let currentAngle = 0

  for (const { outcomeId, probability } of probs) {
    const angleSpan = probability * 360
    segments.push({
      outcome: OUTCOMES[outcomeId],
      probability,
      startAngle: currentAngle,
      endAngle: currentAngle + angleSpan,
    })
    currentAngle += angleSpan
  }

  return segments
}

/**
 * Pick a random outcome based on probabilities
 */
export function pickOutcome(bias: number, allowDiscuss: boolean): OutcomeId {
  const probs = calculateProbabilities(bias, allowDiscuss)
  const rand = Math.random()
  let cumulative = 0

  for (const { outcomeId, probability } of probs) {
    cumulative += probability
    if (rand < cumulative) {
      return outcomeId
    }
  }

  // Rounding fallback must remain an enabled, positive-probability outcome.
  return probs.filter(p => p.probability > 0).slice(-1)[0].outcomeId
}

/**
 * Determine best-of-3 winner from 3 results
 */
export function determineBestOf3Winner(results: OutcomeId[]): OutcomeId {
  const counts: Record<OutcomeId, number> = {
    yier: 0,
    bubu: 0,
    discuss: 0,
  }

  for (const r of results) {
    counts[r]++
  }

  // Find max count
  let maxCount = 0
  let winners: OutcomeId[] = []
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      winners = [id as OutcomeId]
    } else if (count === maxCount && count > 0) {
      winners.push(id as OutcomeId)
    }
  }

  // If there's a clear winner (2 or 3 of same)
  if (winners.length === 1) {
    return winners[0]
  }

  // With three distinct results, use the last spin.
  if (results.length === 0) throw new Error('At least one result is required')
  return results[results.length - 1]
}
