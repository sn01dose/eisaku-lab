import { describe, expect, it } from 'vitest'
import {
  createSkillMastery,
  isStableMastery,
  updateSkillMastery,
} from '../../domain/mastery/updateMastery'

const current = {
  ...createSkillMastery('writing.subjectVerb', new Date('2026-07-01T00:00:00Z')),
  score: 50,
}

describe('updateSkillMastery', () => {
  it.each([
    ['correct', true, false, 58],
    ['hinted', true, false, 53],
    ['wrong', true, false, 44],
    ['wrong', true, true, 41],
    ['correct', false, false, 53.2],
  ] as const)(
    '%s / recall=%s / recurrence=%s を反映する',
    (result, isRecall, repeatedError, score) => {
      expect(
        updateSkillMastery(current, {
          at: '2026-07-02T12:00:00Z',
          result,
          isRecall,
          repeatedError,
        }).score,
      ).toBeCloseTo(score)
    },
  )

  it('目標時間の60%以内の正解に2点を加える', () => {
    const updated = updateSkillMastery(current, {
      at: '2026-07-02T12:00:00Z',
      result: 'correct',
      isRecall: true,
      responseTimeMs: 600,
      targetTimeMs: 1000,
    })
    expect(updated.score).toBe(60)
  })

  it('スコアを0〜100に収める', () => {
    const high = updateSkillMastery(
      { ...current, score: 99 },
      {
        at: '2026-07-02',
        result: 'correct',
        isRecall: true,
      },
    )
    expect(high.score).toBe(100)
  })
})

describe('isStableMastery', () => {
  it('2日以上にまたがる3つの正解日で安定とする', () => {
    expect(isStableMastery(['2026-07-01', '2026-07-02', '2026-07-03'])).toBe(
      true,
    )
  })

  it('同日の3正解は1日として数える', () => {
    expect(isStableMastery(['2026-07-01', '2026-07-01', '2026-07-01'])).toBe(
      false,
    )
  })
})
