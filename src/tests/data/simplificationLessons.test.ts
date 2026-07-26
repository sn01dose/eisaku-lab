import { describe, expect, it } from 'vitest'
import { simplificationPackAAdditions } from '../../data/simplification/pack-a'
import { simplificationPackBAdditions } from '../../data/simplification/pack-b'
import { simplificationPackCAdditions } from '../../data/simplification/pack-c'
import {
  simplificationPackA,
  simplificationPackB,
  simplificationPackC,
  simplificationTasks,
} from '../../data/simplification'
import {
  additionalSpellingLessons,
  additionalWritingLessonsA,
  additionalWritingLessonsB,
  miniLessons,
} from '../../data/lessons'
import type {
  SpellingErrorTag,
  WritingErrorTag,
} from '../../domain/learner/types'

const spellingErrorTags: SpellingErrorTag[] = [
  'vowelChoice',
  'consonantChoice',
  'doubleConsonant',
  'silentLetter',
  'omission',
  'insertion',
  'transposition',
  'prefix',
  'suffix',
  'inflection',
  'irregular',
  'soundToLetter',
  'notRecalled',
]

const writingErrorTags: WritingErrorTag[] = [
  'missingSubject',
  'missingVerb',
  'wordOrder',
  'tense',
  'thirdPersonS',
  'number',
  'article',
  'pronoun',
  'preposition',
  'conjunction',
  'fragment',
  'runOn',
  'literalTranslation',
  'wordChoice',
  'spelling',
  'punctuation',
  'capitalization',
]

function countStages(items: ReadonlyArray<{ stage: number }>) {
  return Object.fromEntries(
    [2, 3, 4, 5, 6].map((stage) => [
      stage,
      items.filter((item) => item.stage === stage).length,
    ]),
  )
}

function expectCompleteSimplification(
  items: ReadonlyArray<{
    id: string
    originalJa: string
    modelSimplified: string[]
    modelEn?: string[]
    explanation: string
  }>,
) {
  items.forEach((item) => {
    expect(item.originalJa.trim(), item.id).not.toBe('')
    expect(item.modelSimplified.length, item.id).toBeGreaterThanOrEqual(2)
    expect(item.modelEn?.length ?? 0, item.id).toBeGreaterThanOrEqual(2)
    item.modelEn?.forEach((answer) => {
      const asciiOnly = [...answer].every(
        (character) => character.charCodeAt(0) <= 127,
      )
      expect(asciiOnly, `${item.id} の英文に非ASCII文字があります`).toBe(true)
    })
    expect(item.explanation.match(/。/g)?.length, item.id).toBe(1)
  })
}

describe('日本語言い換え追加パック', () => {
  it('Pack A は主語明示・一文一内容の18問を指定配分で持つ', () => {
    expect(simplificationPackAAdditions).toHaveLength(18)
    expect(countStages(simplificationPackAAdditions)).toEqual({
      2: 5,
      3: 10,
      4: 3,
      5: 0,
      6: 0,
    })
    expectCompleteSimplification(simplificationPackAAdditions)
  })

  it('Pack B は抽象語を具体化する16問を指定配分で持つ', () => {
    expect(simplificationPackBAdditions).toHaveLength(16)
    expect(countStages(simplificationPackBAdditions)).toEqual({
      2: 0,
      3: 0,
      4: 10,
      5: 6,
      6: 0,
    })
    expectCompleteSimplification(simplificationPackBAdditions)
  })

  it('Pack C は難関大向けの日本語を安全にほどく16問を指定配分で持つ', () => {
    expect(simplificationPackCAdditions).toHaveLength(16)
    expect(countStages(simplificationPackCAdditions)).toEqual({
      2: 0,
      3: 0,
      4: 0,
      5: 6,
      6: 10,
    })
    expectCompleteSimplification(simplificationPackCAdditions)
  })
})

describe('日本語言い換え全体', () => {
  it('A/B/Cを25/25/20問、全体を70問で構成する', () => {
    expect(simplificationPackA).toHaveLength(25)
    expect(simplificationPackB).toHaveLength(25)
    expect(simplificationPackC).toHaveLength(20)
    expect(simplificationTasks).toHaveLength(70)
  })

  it('追加後のステージ分布とID一意性を満たす', () => {
    expect(countStages(simplificationTasks)).toEqual({
      2: 8,
      3: 14,
      4: 18,
      5: 16,
      6: 14,
    })
    expect(new Set(simplificationTasks.map((item) => item.id)).size).toBe(70)
    expectCompleteSimplification(simplificationTasks)
  })
})

describe('ミニレッスン拡充', () => {
  const additions = [
    ...additionalSpellingLessons,
    ...additionalWritingLessonsA,
    ...additionalWritingLessonsB,
  ]

  it('追加16本と全体32本のIDが一意である', () => {
    expect(additions).toHaveLength(16)
    expect(miniLessons).toHaveLength(32)
    expect(new Set(miniLessons.map((lesson) => lesson.id)).size).toBe(32)
  })

  it('追加本文を200〜400字に収め、自然な例文を複数持つ', () => {
    additions.forEach((lesson) => {
      expect(lesson.bodyMd.length, lesson.id).toBeGreaterThanOrEqual(200)
      expect(lesson.bodyMd.length, lesson.id).toBeLessThanOrEqual(400)
      expect(lesson.examples.length, lesson.id).toBeGreaterThanOrEqual(2)
      lesson.examples.forEach((example) => {
        expect(example.en.trim(), lesson.id).not.toBe('')
        expect(
          [...example.en].every((character) => character.charCodeAt(0) <= 127),
          `${lesson.id} の英文に非ASCII文字があります`,
        ).toBe(true)
        expect(example.ja.trim(), lesson.id).not.toBe('')
      })
    })
  })

  it('スペリング13タグと英作文17タグをすべて網羅する', () => {
    const covered = new Set(miniLessons.flatMap((lesson) => lesson.triggerTags))
    const missing = [...spellingErrorTags, ...writingErrorTags].filter(
      (tag) => !covered.has(tag),
    )
    expect(missing).toEqual([])
  })
})
