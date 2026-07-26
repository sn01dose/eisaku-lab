import { describe, expect, it } from 'vitest'
import {
  calculateResponseTimeAverages,
  createSessionTimingPlan,
  type DailyMinutes,
  type SessionActivityCounts,
} from '../../domain/session/timing'

const expectedCounts: Record<DailyMinutes, SessionActivityCounts> = {
  15: {
    spellingReview: 6,
    spellingNew: 5,
    basicWriting: 4,
    shortWriting: 1,
    reflection: 1,
  },
  30: {
    spellingReview: 12,
    spellingNew: 10,
    basicWriting: 7,
    shortWriting: 2,
    reflection: 1,
  },
  45: {
    spellingReview: 18,
    spellingNew: 15,
    basicWriting: 11,
    shortWriting: 3,
    reflection: 1,
  },
}

describe('createSessionTimingPlan', () => {
  it.each([15, 30, 45] as const)(
    '%i分の基準数量と総時間を返す',
    (dailyMinutes) => {
      const plan = createSessionTimingPlan({ dailyMinutes })
      expect(plan.counts).toEqual(expectedCounts[dailyMinutes])
      expect(plan.totalEstimatedSeconds).toBe(dailyMinutes * 60)
    },
  )

  it('目安の±40%以内では数量を変えない', () => {
    const plan = createSessionTimingPlan({
      dailyMinutes: 30,
      averageResponseTimeMs: {
        spellingReview: 35_000,
        spellingNew: 24_000,
        basicWriting: 98_000,
        shortWriting: 144_000,
      },
    })
    expect(plan.counts).toEqual(expectedCounts[30])
    expect(plan.adjustedActivities).toEqual([])
  })

  it('40%より遅ければ所要時間比で減らす', () => {
    const plan = createSessionTimingPlan({
      dailyMinutes: 30,
      averageResponseTimeMs: { spellingReview: 50_000 },
    })
    expect(plan.counts.spellingReview).toBe(6)
    expect(plan.adjustedActivities).toContain('spellingReview')
    expect(plan.totalEstimatedSeconds).toBeLessThanOrEqual(30 * 60)
  })

  it('40%より速ければ所要時間比で増やす', () => {
    const plan = createSessionTimingPlan({
      dailyMinutes: 30,
      averageResponseTimeMs: { spellingNew: 20_000 },
    })
    expect(plan.counts.spellingNew).toBe(20)
    expect(plan.adjustedActivities).toContain('spellingNew')
    expect(plan.totalEstimatedSeconds).toBeLessThanOrEqual(30 * 60)
  })

  it('候補がある種目を最低1問残し、候補数を超えない', () => {
    const plan = createSessionTimingPlan({
      dailyMinutes: 15,
      averageResponseTimeMs: {
        spellingReview: 400_000,
        spellingNew: 400_000,
        basicWriting: 400_000,
        shortWriting: 400_000,
      },
      availability: {
        spellingReview: 2,
        spellingNew: 3,
        basicWriting: 1,
        shortWriting: 1,
      },
    })
    expect(plan.counts.spellingReview).toBeGreaterThanOrEqual(1)
    expect(plan.counts.spellingNew).toBeGreaterThanOrEqual(1)
    expect(plan.counts.basicWriting).toBe(1)
    expect(plan.counts.shortWriting).toBe(1)
    expect(plan.counts.spellingReview).toBeLessThanOrEqual(2)
    expect(plan.counts.spellingNew).toBeLessThanOrEqual(3)
  })

  it('候補がない種目を0問にして空いた時間を他種目へ回す', () => {
    const plan = createSessionTimingPlan({
      dailyMinutes: 30,
      availability: {
        spellingReview: 40,
        spellingNew: 0,
        basicWriting: 0,
        shortWriting: 0,
      },
    })
    expect(plan.counts.spellingReview).toBeGreaterThan(12)
    expect(plan.counts.spellingNew).toBe(0)
    expect(plan.totalEstimatedSeconds).toBe(30 * 60)
  })
})

describe('calculateResponseTimeAverages', () => {
  it('種目ごとに直近N件の移動平均を返す', () => {
    const averages = calculateResponseTimeAverages(
      [
        { activity: 'spellingReview', responseTimeMs: 10_000 },
        { activity: 'spellingReview', responseTimeMs: 20_000 },
        { activity: 'spellingReview', responseTimeMs: 40_000 },
        { activity: 'basicWriting', responseTimeMs: 80_000 },
      ],
      2,
    )
    expect(averages.spellingReview).toBe(30_000)
    expect(averages.basicWriting).toBe(80_000)
    expect(averages.shortWriting).toBeUndefined()
  })
})
