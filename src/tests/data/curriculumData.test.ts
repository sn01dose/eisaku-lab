import { describe, expect, it } from 'vitest'
import { ALL_SKILL_IDS, type SkillId, type StageId } from '../../domain/learner/types'
import {
  diagnosticItems,
  extendedWritingTasks,
  miniLessons,
  shortWritingTasks,
  simplificationTasks,
  spellingWords,
  writingTasks,
} from '../../data'

const expectedSpelling: Record<StageId, number> = { 1: 110, 2: 100, 3: 100, 4: 100, 5: 100, 6: 90 }
const expectedShortWriting: Record<StageId, number> = { 1: 55, 2: 55, 3: 50, 4: 50, 5: 75, 6: 75 }
const expectedExtendedWriting: Record<StageId, number> = { 1: 3, 2: 5, 3: 10, 4: 14, 5: 14, 6: 14 }
const expectedSimplification: Record<StageId, number> = { 1: 0, 2: 8, 3: 14, 4: 18, 5: 16, 6: 14 }
const stages: StageId[] = [1, 2, 3, 4, 5, 6]
const validSkillIds = new Set<SkillId>(ALL_SKILL_IDS)

const distribution = <T extends { stage: StageId }>(items: readonly T[]) =>
  Object.fromEntries(stages.map((stage) => [stage, items.filter((item) => item.stage === stage).length]))

const expectUniqueIds = (items: ReadonlyArray<{ id: string }>) => {
  const ids = items.map(({ id }) => id)
  expect(new Set(ids).size).toBe(ids.length)
}

const expectValidSkills = (items: ReadonlyArray<{ skillIds: SkillId[] }>) => {
  items.forEach((item, index) => {
    expect(item.skillIds, `教材${index + 1}にskillIdsがありません`).toBeDefined()
    item.skillIds?.forEach((skillId) => {
      expect(validSkillIds.has(skillId), `教材${index + 1}の存在しない skillId: ${skillId}`).toBe(true)
    })
  })
}

describe('教材の数量とステージ分布', () => {
  it('スペリング600語を指定比率で収録している', () => {
    expect(spellingWords).toHaveLength(600)
    expect(distribution(spellingWords)).toEqual(expectedSpelling)
  })

  it('短文360問を指定比率で収録している', () => {
    expect(shortWritingTasks).toHaveLength(360)
    expect(distribution(shortWritingTasks)).toEqual(expectedShortWriting)
  })

  it('段落・自由英作文60題を指定比率で収録している', () => {
    expect(extendedWritingTasks).toHaveLength(60)
    expect(distribution(extendedWritingTasks)).toEqual(expectedExtendedWriting)
  })

  it('日本語言い換え70問をStage 2〜6へ配分している', () => {
    expect(simplificationTasks).toHaveLength(70)
    expect(distribution(simplificationTasks)).toEqual(expectedSimplification)
  })

  it('ミニレッスン32本と診断30問を収録している', () => {
    expect(miniLessons).toHaveLength(32)
    expect(diagnosticItems).toHaveLength(30)
    const diagnosticMinutes = diagnosticItems.reduce(
      (total, item) => total + item.estimatedSeconds,
      0,
    ) / 60
    expect(diagnosticMinutes).toBeGreaterThanOrEqual(15)
    expect(diagnosticMinutes).toBeLessThanOrEqual(25)
  })
})

describe('教材の参照整合性', () => {
  it('全教材IDが種別内と英作文全体で一意である', () => {
    expectUniqueIds(spellingWords)
    expectUniqueIds(shortWritingTasks)
    expectUniqueIds(extendedWritingTasks)
    expectUniqueIds(writingTasks)
    expectUniqueIds(simplificationTasks)
    expectUniqueIds(miniLessons)
    expectUniqueIds(diagnosticItems)
  })

  it('スペリングのチャンク・正答・必須項目が一致する', () => {
    expect(new Set(spellingWords.map((item) => item.word)).size).toBe(spellingWords.length)
    spellingWords.forEach((item) => {
      expect(item.chunks.join(''), item.id).toBe(item.word)
      expect(item.acceptedAnswers, item.id).toContain(item.word)
      expect(item.word.trim(), item.id).not.toBe('')
      expect(item.meaningJa.trim(), item.id).not.toBe('')
      expect(item.exampleEn.trim(), item.id).not.toBe('')
      expect(item.exampleJa.trim(), item.id).not.toBe('')
      expect(item.patterns.length, item.id).toBeGreaterThan(0)
      expect(item.skillIds.length, item.id).toBeGreaterThan(0)
      if (item.chunkLabels) expect(item.chunkLabels, item.id).toHaveLength(item.chunks.length)
    })
  })

  it('英作文は複数の模範解答と説明を持つ', () => {
    writingTasks.forEach((item) => {
      expect(item.modelAnswers.length, item.id).toBeGreaterThanOrEqual(2)
      item.modelAnswers.forEach((answer) => expect(answer.trim(), item.id).not.toBe(''))
      expect(item.requiredSkills.length, item.id).toBeGreaterThan(0)
      expect(item.explanation.trim(), item.id).not.toBe('')
      expect(item.theme.trim(), item.id).not.toBe('')
    })
  })

  it('段落課題の模範解答が指定語数に収まる', () => {
    extendedWritingTasks.forEach((item) => {
      const minimum = item.rubric?.minWords ?? 0
      const maximum = item.rubric?.maxWords ?? Number.POSITIVE_INFINITY
      item.modelAnswers.forEach((answer) => {
        const words = answer.trim().split(/\s+/).length
        expect(words, `${item.id}の模範解答`).toBeGreaterThanOrEqual(minimum)
        expect(words, `${item.id}の模範解答`).toBeLessThanOrEqual(maximum)
      })
    })
  })

  it('言い換え問題は複数の許容例を持つ', () => {
    simplificationTasks.forEach((item) => {
      expect(item.modelSimplified.length, item.id).toBeGreaterThanOrEqual(2)
      expect(item.modelEn?.length ?? 0, item.id).toBeGreaterThanOrEqual(2)
      expect(item.targetPoints.length, item.id).toBeGreaterThan(0)
    })
  })

  it('ミニレッスン本文は200〜400字で簡潔に収まる', () => {
    miniLessons.forEach((lesson) => {
      expect(lesson.bodyMd.length, lesson.id).toBeGreaterThanOrEqual(200)
      expect(lesson.bodyMd.length, lesson.id).toBeLessThanOrEqual(400)
    })
  })

  it('すべてのskillId参照が共通型の一覧に存在する', () => {
    expectValidSkills(spellingWords)
    expectValidSkills(writingTasks.map((item) => ({ skillIds: item.requiredSkills })))
    expectValidSkills(miniLessons)
    expectValidSkills(diagnosticItems)
  })

  it('診断の参照語IDと正答が一致する', () => {
    const wordById = new Map(spellingWords.map((item) => [item.id, item]))
    diagnosticItems
      .filter((item) => item.section === 'dictation' && item.payload.wordId)
      .forEach((item) => {
        if (item.section !== 'dictation' || !item.payload.wordId) return
        expect(wordById.get(item.payload.wordId)?.word, item.id).toBe(item.payload.answer)
      })
  })

  it('プレースホルダや空の教材を含まない', () => {
    const serialized = JSON.stringify({
      spellingWords,
      writingTasks,
      simplificationTasks,
      miniLessons,
      diagnosticItems,
    })
    expect(serialized).not.toMatch(/\b(?:TODO|sample|placeholder|テスト用)\b/i)
  })
})
