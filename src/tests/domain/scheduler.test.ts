import { describe, expect, it } from 'vitest'
import {
  applyReviewOutcome,
  createReviewCard,
  qualityFromOutcome,
  scheduleReview,
} from '../../domain/review/scheduler'

const reviewedAt = new Date('2026-07-20T12:00:00.000Z')

describe('qualityFromOutcome', () => {
  it.each([
    [false, false, false, 1000, 1],
    [true, false, true, 1000, 2],
    [true, true, false, 1000, 3],
    [true, false, false, 5001, 4],
    [true, false, false, 5000, 5],
  ])(
    '結果を品質値へ変換する',
    (correct, usedHint, retried, responseTimeMs, quality) => {
      expect(
        qualityFromOutcome({
          correct,
          usedHint,
          retried,
          responseTimeMs,
          targetTimeMs: 5000,
        }),
      ).toBe(quality)
    },
  )
})

describe('scheduleReview', () => {
  const fresh = createReviewCard({
    kind: 'spelling',
    refId: 'sp-0001',
    now: reviewedAt,
  })

  it.each([
    [5, 1, 1, 2.6],
    [4, 1, 1, 2.5],
    [3, 1, 1, 2.36],
    [2, 0, 1, 2.3],
    [1, 0, 0, 2.3],
  ] as const)(
    'q=%i の遷移を計算する',
    (quality, repetitions, interval, easeFactor) => {
      const result = scheduleReview(fresh, quality, reviewedAt)
      expect(result.repetitions).toBe(repetitions)
      expect(result.interval).toBe(interval)
      expect(result.easeFactor).toBeCloseTo(easeFactor)
    },
  )

  it('1日、3日、その後は係数倍で間隔を延ばす', () => {
    const first = scheduleReview(fresh, 5, reviewedAt)
    const second = scheduleReview(first, 5, reviewedAt)
    const third = scheduleReview(second, 5, reviewedAt)
    expect([first.interval, second.interval, third.interval]).toEqual([1, 3, 8])
  })

  it('失敗時は反復回数をリセットし lapse を増やす', () => {
    const learned = { ...fresh, repetitions: 4, interval: 12, lapses: 2 }
    const result = scheduleReview(learned, 1, reviewedAt)
    expect(result).toMatchObject({ repetitions: 0, interval: 0, lapses: 3 })
  })

  it('easeFactor を 1.3〜2.8 に収める', () => {
    expect(scheduleReview({ ...fresh, easeFactor: 1.3 }, 1).easeFactor).toBe(1.3)
    expect(scheduleReview({ ...fresh, easeFactor: 2.8 }, 5).easeFactor).toBe(2.8)
  })

  it.each([1, 2, 3])(
    'ヒント段階 %i を記録し、正解でも品質値を3に制限する',
    (hintCount) => {
      const result = applyReviewOutcome(
        fresh,
        {
          correct: true,
          usedHint: true,
          hintCount,
          retried: false,
          responseTimeMs: 500,
          targetTimeMs: 5000,
        },
        reviewedAt,
      )

      expect(result).toMatchObject({
        repetitions: 1,
        interval: 1,
        lastResult: 'hinted',
        hintCount,
      })
      expect(result.easeFactor).toBeCloseTo(2.36)
    },
  )
})
