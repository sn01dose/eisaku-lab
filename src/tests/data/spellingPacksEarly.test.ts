import { describe, expect, it } from 'vitest'
import { simplificationTasks } from '../../data/simplification'
import { spellingPack02 } from '../../data/spelling/pack-02'
import { spellingPack03 } from '../../data/spelling/pack-03'
import {
  REQUIRED_SPELLING_PATTERN_IDS,
  type RequiredSpellingPatternId,
} from '../../data/spelling/patternCatalog'
import { stage1SpellingWords } from '../../data/spelling/stage1'
import { stage2SpellingWords } from '../../data/spelling/stage2'
import { stage3SpellingWords } from '../../data/spelling/stage3'
import { stage4SpellingWords } from '../../data/spelling/stage4'
import { stage5SpellingWords } from '../../data/spelling/stage5'
import { stage6SpellingWords } from '../../data/spelling/stage6'
import { writingTasks } from '../../data/writing'
import { tokenizeEnglish } from '../../data/index/wordTools'
import type { SpellingWord, StageId } from '../../domain/learner/types'

const baseWords = [
  ...stage1SpellingWords,
  ...stage2SpellingWords,
  ...stage3SpellingWords,
  ...stage4SpellingWords,
  ...stage5SpellingWords,
  ...stage6SpellingWords,
]

const modelTokens = new Set(
  [
    ...writingTasks.flatMap(({ modelAnswers }) => modelAnswers),
    ...simplificationTasks.flatMap(({ modelEn }) => modelEn ?? []),
  ].flatMap(tokenizeEnglish),
)

function ids(first: number): string[] {
  return Array.from(
    { length: 90 },
    (_, index) => `sp-${String(first + index).padStart(4, '0')}`,
  )
}

function stageCounts(words: readonly SpellingWord[]): Partial<Record<StageId, number>> {
  return words.reduce<Partial<Record<StageId, number>>>(
    (counts, word) => ({
      ...counts,
      [word.stage]: (counts[word.stage] ?? 0) + 1,
    }),
    {},
  )
}

function expectInternallyValid(words: readonly SpellingWord[]): void {
  const validPatterns = new Set<RequiredSpellingPatternId>(
    REQUIRED_SPELLING_PATTERN_IDS,
  )
  for (const item of words) {
    expect(item.meaningJa.trim(), item.id).not.toBe('')
    expect(item.partOfSpeech.trim(), item.id).not.toBe('')
    expect(item.chunks.join(''), item.id).toBe(item.word)
    expect(item.acceptedAnswers, item.id).toContain(item.word)
    expect(modelTokens.has(item.word), item.id).toBe(true)
    expect(tokenizeEnglish(item.exampleEn), item.id).toContain(item.word)
    expect(item.patterns.length, item.id).toBeGreaterThan(0)
    for (const pattern of item.patterns) {
      expect(validPatterns.has(pattern as RequiredSpellingPatternId), item.id).toBe(
        true,
      )
    }
    for (const mistake of item.commonMistakes) {
      expect(mistake.trim().toLowerCase(), item.id).not.toBe(
        item.word.trim().toLowerCase(),
      )
    }
  }
}

describe('early expanded spelling packs', () => {
  it('pack02は90語・指定ID・Stage 1=70 / Stage 2=20である', () => {
    expect(spellingPack02).toHaveLength(90)
    expect(spellingPack02.map(({ id }) => id)).toEqual(ids(151))
    expect(stageCounts(spellingPack02)).toEqual({ 1: 70, 2: 20 })
  })

  it('pack03は90語・指定ID・Stage 2=50 / Stage 3=40である', () => {
    expect(spellingPack03).toHaveLength(90)
    expect(spellingPack03.map(({ id }) => id)).toEqual(ids(241))
    expect(stageCounts(spellingPack03)).toEqual({ 2: 50, 3: 40 })
  })

  it('既存150語・pack間で単語とIDが重複しない', () => {
    const all = [...baseWords, ...spellingPack02, ...spellingPack03]
    expect(new Set(all.map(({ id }) => id)).size).toBe(all.length)
    expect(new Set(all.map(({ word }) => word)).size).toBe(all.length)
  })

  it.each([
    ['pack02', spellingPack02],
    ['pack03', spellingPack03],
  ] as const)('%sの例文・綴りデータが整合している', (_, words) => {
    expectInternallyValid(words)
  })
})
