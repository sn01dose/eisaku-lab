import { describe, expect, it } from 'vitest'
import type { StageId } from '../../domain/learner/types'
import {
  dailyPlanItemCount,
  generateDailyPlan,
  type DailyPlanCandidate,
} from '../../domain/dailyPlan/generateDailyPlan'

function candidates(
  prefix: string,
  count: number,
  stage: StageId = 1,
): DailyPlanCandidate[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    kind: 'spelling',
    refId: `${prefix}-${index}`,
    stage,
    skillIds: ['spelling.shortVowel'],
    priority: count - index,
  }))
}

describe('generateDailyPlan', () => {
  it.each([
    [15, 5],
    [30, 10],
    [45, 15],
  ] as const)('%i分を%i問に比例調整する', (minutes, count) => {
    expect(dailyPlanItemCount(minutes)).toBe(count)
    const plan = generateDailyPlan({
      dailyMinutes: minutes,
      currentStage: 1,
      review: candidates('r', 30),
      weak: candidates('w', 30),
      newItems: candidates('n', 30),
    })
    expect(plan.items).toHaveLength(count)
  })

  it('標準30分では復習・苦手・新規を50/30/20にする', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: candidates('r', 10),
      weak: candidates('w', 10),
      newItems: candidates('n', 10),
    })
    expect(plan.counts).toEqual({ review: 5, weak: 3, new: 2 })
  })

  it('復習が溜まっている場合は復習を70%へ増やす', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: candidates('r', 20),
      weak: candidates('w', 10),
      newItems: candidates('n', 10),
    })
    expect(plan.counts).toEqual({ review: 7, weak: 2, new: 1 })
  })

  it('候補不足を他の区分から補う', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: candidates('r', 1),
      weak: candidates('w', 20),
      newItems: candidates('n', 20),
    })
    expect(plan.items).toHaveLength(10)
    expect(plan.counts.review).toBe(1)
  })

  it('現在ステージより下の復習を最低1問入れる', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 15,
      currentStage: 3,
      review: [
        ...candidates('current', 8, 3),
        ...candidates('foundation', 1, 1),
      ],
      weak: candidates('w', 8, 3),
      newItems: candidates('n', 8, 3),
    })
    expect(plan.items.some(({ stage }) => stage < 3)).toBe(true)
  })
})
