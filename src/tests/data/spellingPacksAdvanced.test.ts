import { describe, expect, it } from 'vitest'
import { simplificationTasks } from '../../data/simplification'
import { spellingPack02 } from '../../data/spelling/pack-02'
import { spellingPack03 } from '../../data/spelling/pack-03'
import { spellingPack04 } from '../../data/spelling/pack-04'
import { spellingPack05 } from '../../data/spelling/pack-05'
import { spellingPack06 } from '../../data/spelling/pack-06'
import {
  REQUIRED_SPELLING_PATTERN_IDS,
  type RequiredSpellingPatternId,
} from '../../data/spelling/patternCatalog'
import { REQUIRED_PATTERN_WORDS } from '../../data/spelling/patternVocabulary'
import { stage1SpellingWords } from '../../data/spelling/stage1'
import { stage2SpellingWords } from '../../data/spelling/stage2'
import { stage3SpellingWords } from '../../data/spelling/stage3'
import { stage4SpellingWords } from '../../data/spelling/stage4'
import { stage5SpellingWords } from '../../data/spelling/stage5'
import { stage6SpellingWords } from '../../data/spelling/stage6'
import { tokenizeEnglish } from '../../data/index/wordTools'
import { writingTasks } from '../../data/writing'
import type { SpellingWord, StageId } from '../../domain/learner/types'

const advancedPacks = [spellingPack04, spellingPack05, spellingPack06] as const
const baseWords = [
  ...stage1SpellingWords,
  ...stage2SpellingWords,
  ...stage3SpellingWords,
  ...stage4SpellingWords,
  ...stage5SpellingWords,
  ...stage6SpellingWords,
]
const allExpandedWords = [
  ...baseWords,
  ...spellingPack02,
  ...spellingPack03,
  ...spellingPack04,
  ...spellingPack05,
  ...spellingPack06,
]
const curriculumTokens = new Set(
  [
    ...writingTasks.flatMap((task) => task.modelAnswers),
    ...simplificationTasks.flatMap((task) => task.modelEn ?? []),
  ].flatMap(tokenizeEnglish),
)
const validPatterns = new Set<string>(REQUIRED_SPELLING_PATTERN_IDS)
const requiredExactWords = [
  'firm',
  'commercial',
  'knife',
  'knee',
  'knight',
  'wrap',
  'wrist',
  'bomb',
  'tomb',
  'daughter',
  'align',
  'assign',
  'resign',
  'unfair',
  'unsafe',
  'unequal',
  'unclear',
  'dishonest',
  'invisible',
  'imperfect',
  'uses',
  'changes',
  'improves',
  'provides',
  'increases',
  'developed',
  'reduced',
  'received',
  'increasing',
] as const

function expectedIds(first: number, count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `sp-${String(first + index).padStart(4, '0')}`,
  )
}

function stageCounts(words: readonly SpellingWord[]): Record<StageId, number> {
  return {
    1: words.filter(({ stage }) => stage === 1).length,
    2: words.filter(({ stage }) => stage === 2).length,
    3: words.filter(({ stage }) => stage === 3).length,
    4: words.filter(({ stage }) => stage === 4).length,
    5: words.filter(({ stage }) => stage === 5).length,
    6: words.filter(({ stage }) => stage === 6).length,
  }
}

describe('advanced spelling packs 04-06', () => {
  it('keeps each pack at 90 contiguous IDs and the requested stage split', () => {
    expect(spellingPack04).toHaveLength(90)
    expect(spellingPack05).toHaveLength(90)
    expect(spellingPack06).toHaveLength(90)
    expect(spellingPack04.map(({ id }) => id)).toEqual(expectedIds(331, 90))
    expect(spellingPack05.map(({ id }) => id)).toEqual(expectedIds(421, 90))
    expect(spellingPack06.map(({ id }) => id)).toEqual(expectedIds(511, 90))
    expect(stageCounts(spellingPack04)).toMatchObject({ 3: 35, 4: 55 })
    expect(stageCounts(spellingPack05)).toMatchObject({ 4: 25, 5: 65 })
    expect(stageCounts(spellingPack06)).toMatchObject({ 5: 15, 6: 75 })
  })

  it('has no word or ID duplicates across all 600 spelling entries', () => {
    expect(allExpandedWords).toHaveLength(600)
    expect(new Set(allExpandedWords.map(({ id }) => id)).size).toBe(600)
    expect(new Set(allExpandedWords.map(({ word }) => word)).size).toBe(600)
    expect(stageCounts(allExpandedWords)).toEqual({
      1: 110,
      2: 100,
      3: 100,
      4: 100,
      5: 100,
      6: 90,
    })
  })

  it('uses exact surface forms from a writing or simplification model', () => {
    advancedPacks.flat().forEach((item) => {
      expect(curriculumTokens, item.id).toContain(item.word)
      expect(new Set(tokenizeEnglish(item.exampleEn)), item.id).toContain(
        item.word,
      )
    })
  })

  it('keeps generated chunks, answers, mistakes, and patterns consistent', () => {
    advancedPacks.flat().forEach((item) => {
      expect(item.chunks.join(''), item.id).toBe(item.word)
      expect(item.acceptedAnswers, item.id).toContain(item.word)
      const answers = new Set(
        item.acceptedAnswers.map((answer) => answer.trim().toLowerCase()),
      )
      item.commonMistakes.forEach((mistake) => {
        expect(answers, `${item.id}: ${mistake}`).not.toContain(
          mistake.trim().toLowerCase(),
        )
      })
      expect(item.patterns.length, item.id).toBeGreaterThan(0)
      item.patterns.forEach((pattern) => {
        expect(validPatterns, `${item.id}: ${pattern}`).toContain(pattern)
      })
    })
  })

  it('includes every remaining required word that has an exact model source', () => {
    const words = new Set(advancedPacks.flat().map(({ word }) => word))
    requiredExactWords.forEach((word) => expect(words).toContain(word))
  })

  it('contributes valid words to every required spelling-pattern group', () => {
    const counts = Object.fromEntries(
      REQUIRED_SPELLING_PATTERN_IDS.map((pattern) => [
        pattern,
        advancedPacks
          .flat()
          .filter((item) => item.patterns.includes(pattern)).length,
      ]),
    ) as Record<RequiredSpellingPatternId, number>
    REQUIRED_SPELLING_PATTERN_IDS.forEach((pattern) => {
      expect(counts[pattern], pattern).toBeGreaterThan(0)
    })
  })

  it('covers every required spelling pattern with at least eight words', () => {
    const counts = REQUIRED_SPELLING_PATTERN_IDS.map((pattern) => {
      const catalogWords = new Set(REQUIRED_PATTERN_WORDS[pattern])
      const count = allExpandedWords.filter(
        (item) =>
          item.patterns.includes(pattern) || catalogWords.has(item.word),
      ).length
      return { pattern, count }
    })
    counts.forEach(({ pattern, count }) => {
      expect(count, pattern).toBeGreaterThanOrEqual(8)
    })
  })
})
