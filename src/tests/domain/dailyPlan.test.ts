import { describe, expect, it } from 'vitest'
import type { StageId } from '../../domain/learner/types'
import type { TimedLearningActivity } from '../../domain/session/timing'
import {
  dailyPlanItemCount,
  generateDailyPlan,
  type DailyPlanCandidate,
} from '../../domain/dailyPlan/generateDailyPlan'

function candidates(
  prefix: string,
  activity: TimedLearningActivity,
  count: number,
  stage: StageId = 1,
): DailyPlanCandidate[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${activity}-${index}`,
    kind: activity.startsWith('spelling') ? 'spelling' : 'writing',
    activity,
    refId: `${prefix}-${activity}-${index}`,
    stage,
    skillIds: activity.startsWith('spelling')
      ? ['spelling.shortVowel']
      : ['writing.subjectVerb'],
    priority: count - index,
  }))
}

function completePool(prefix: string, count = 50): DailyPlanCandidate[] {
  return [
    ...candidates(prefix, 'spellingReview', count),
    ...candidates(prefix, 'spellingNew', count),
    ...candidates(prefix, 'basicWriting', count),
    ...candidates(prefix, 'shortWriting', count),
  ]
}

function baselinePool(prefix: string): DailyPlanCandidate[] {
  return [
    ...candidates(prefix, 'spellingReview', 12),
    ...candidates(prefix, 'spellingNew', 10),
    ...candidates(prefix, 'basicWriting', 7),
    ...candidates(prefix, 'shortWriting', 2),
  ]
}

describe('generateDailyPlan', () => {
  it.each([
    [15, 16, [6, 5, 4, 1]],
    [30, 31, [12, 10, 7, 2]],
    [45, 47, [18, 15, 11, 3]],
  ] as const)(
    '%i分を種目別の基準数量で生成する',
    (minutes, itemCount, activityCounts) => {
      expect(dailyPlanItemCount(minutes)).toBe(itemCount)
      const plan = generateDailyPlan({
        dailyMinutes: minutes,
        currentStage: 1,
        review: completePool('r'),
        weak: completePool('w'),
        newItems: completePool('n'),
      })
      expect(plan.items).toHaveLength(itemCount)
      expect([
        plan.activityCounts.spellingReview,
        plan.activityCounts.spellingNew,
        plan.activityCounts.basicWriting,
        plan.activityCounts.shortWriting,
      ]).toEqual(activityCounts)
      expect(plan.activityCounts.reflection).toBe(1)
      expect(plan.estimatedTotalMinutes).toBe(minutes)
    },
  )

  it('候補がそろう場合は復習・苦手・新規をおよそ50/30/20にする', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: baselinePool('r'),
      weak: completePool('w'),
      newItems: completePool('n'),
    })
    expect(plan.counts).toEqual({ review: 16, weak: 9, new: 6 })
  })

  it('復習が溜まっている場合は復習をおよそ70%へ増やす', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: completePool('r', 80),
      weak: completePool('w'),
      newItems: completePool('n'),
    })
    expect(plan.counts).toEqual({ review: 22, weak: 6, new: 3 })
  })

  it('候補がない種目の時間を利用可能な種目へ回す', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: candidates('r', 'spellingReview', 20),
      weak: [],
      newItems: [],
    })
    expect(plan.items).toHaveLength(20)
    expect(plan.activityCounts.spellingReview).toBe(20)
    expect(plan.activityCounts.spellingNew).toBe(0)
  })

  it('現在ステージより下の復習を最低1問入れる', () => {
    const foundation = candidates('foundation', 'basicWriting', 1, 1)[0]
    foundation.priority = -10
    const plan = generateDailyPlan({
      dailyMinutes: 15,
      currentStage: 3,
      review: completePool('r', 20).map((item) => ({ ...item, stage: 3 })),
      weak: [
        ...completePool('w', 20).map((item) => ({ ...item, stage: 3 as const })),
        foundation,
      ],
      newItems: completePool('n', 20).map((item) => ({
        ...item,
        stage: 3 as const,
      })),
    })
    expect(plan.items.some(({ stage }) => stage < 3)).toBe(true)
  })

  it('実測が40%より遅い種目の数量を所要時間比で減らす', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: completePool('r'),
      weak: completePool('w'),
      newItems: completePool('n'),
      averageResponseTimeMs: { spellingReview: 50_000 },
    })
    expect(plan.activityCounts.spellingReview).toBe(6)
    expect(plan.estimatedTotalMinutes).toBeLessThanOrEqual(30)
  })

  it('実測が40%より速い種目の数量を所要時間比で増やす', () => {
    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      review: completePool('r'),
      weak: completePool('w'),
      newItems: completePool('n'),
      averageResponseTimeMs: { spellingNew: 20_000 },
    })
    expect(plan.activityCounts.spellingNew).toBe(20)
    expect(plan.estimatedTotalMinutes).toBeLessThanOrEqual(30)
  })
})
