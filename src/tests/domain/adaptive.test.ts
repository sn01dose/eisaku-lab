import { describe, expect, it } from 'vitest'
import type {
  DiagnosticItem,
  StageId,
} from '../../domain/learner/types'
import {
  recommendDiagnosticStage,
  recommendStageFromRate,
} from '../../domain/diagnostic/recommendation'
import {
  adjustWritingSupport,
  simplerWritingTaskType,
} from '../../domain/writing/supportLevel'

function item(id: string, skill: DiagnosticItem['skillIds'][number]): DiagnosticItem {
  return {
    id,
    section: 'spellChoice',
    skillIds: [skill],
    estimatedSeconds: 20,
    payload: { promptJa: '正しい綴り', options: ['a', 'b'], answer: 'a' },
  }
}

describe('診断の推奨ステージ', () => {
  it.each([
    [0.2, 1],
    [0.5, 2],
    [0.65, 3],
    [0.75, 4],
    [0.85, 5],
    [0.95, 6],
  ] as Array<[number, StageId]>)('正答率 %f から Stage %i を返す', (rate, stage) => {
    expect(recommendStageFromRate(rate)).toBe(stage)
  })

  it('土台技能が弱い場合は開始位置を土台まで戻す', () => {
    const result = recommendDiagnosticStage([
      { item: item('d-1', 'writing.subjectVerb'), correct: false },
      { item: item('d-2', 'spelling.shortVowel'), correct: false },
      { item: item('d-3', 'writing.summary'), correct: true },
      { item: item('d-4', 'writing.summary'), correct: true },
    ])
    expect(result.recommendedStage).toBe(1)
  })
})

describe('英作文の支援レベル', () => {
  it('ヒントなし正解3回で支援を1段階減らす', () => {
    const result = adjustWritingSupport({
      currentLevel: 3,
      recentOutcomes: Array.from({ length: 3 }, () => ({
        correct: true,
        hintLevelUsed: 0,
      })),
    })
    expect(result).toMatchObject({ level: 4, direction: 'lessSupport' })
  })

  it('不正解2回で支援を増やし課題を小さくする', () => {
    const result = adjustWritingSupport({
      currentLevel: 3,
      currentTaskType: 'translateWithFrame',
      recentOutcomes: Array.from({ length: 2 }, () => ({
        correct: false,
        hintLevelUsed: 1,
      })),
    })
    expect(result).toMatchObject({
      level: 2,
      direction: 'moreSupport',
      fallbackType: 'translateWithBank',
    })
  })

  it('1と5でクランプする', () => {
    const wrong = { correct: false, hintLevelUsed: 0 }
    const right = { correct: true, hintLevelUsed: 0 }
    expect(
      adjustWritingSupport({
        currentLevel: 1,
        recentOutcomes: [wrong, wrong],
      }).level,
    ).toBe(1)
    expect(
      adjustWritingSupport({
        currentLevel: 5,
        recentOutcomes: [right, right, right],
      }).level,
    ).toBe(5)
  })

  it('同じタグが3回続くとミニレッスン対象にする', () => {
    const result = adjustWritingSupport({
      currentLevel: 3,
      recentOutcomes: Array.from({ length: 3 }, () => ({
        correct: false,
        hintLevelUsed: 0,
        errorTags: ['article'] as const,
      })),
    })
    expect(result.miniLessonTriggerTag).toBe('article')
    expect(simplerWritingTaskType('translatePlain')).toBe('translateWithFrame')
  })
})
