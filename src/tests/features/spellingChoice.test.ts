import { describe, expect, it } from 'vitest'
import { spellingWords } from '../../data'
import type { SpellingWord } from '../../domain/learner/types'
import {
  buildSpellingChoiceOptions,
  spellingChoiceDistractors,
  supportsSpellingChoice,
} from '../../features/spelling/spellingChoice'

function makeWord(
  id: string,
  commonMistakes: string[],
): SpellingWord {
  return {
    id,
    word: 'necessary',
    meaningJa: '必要な',
    stage: 3,
    partOfSpeech: '形容詞',
    strategy: 'pattern',
    chunks: ['nec', 'es', 'sar', 'y'],
    chunkKind: 'phonetic',
    patterns: ['double-consonant'],
    skillIds: ['spelling.doubleConsonant'],
    exampleEn: 'Enough sleep is necessary for good health.',
    exampleJa: '十分な睡眠は健康に必要です。',
    acceptedAnswers: ['necessary'],
    commonMistakes,
    errorTags: ['doubleConsonant'],
  }
}

describe('spelling choice eligibility', () => {
  it('excludes words with fewer than three valid mistakes', () => {
    const item = makeWord('sp-choice-ineligible', [
      'neccesary',
      ' neccesary ',
      'necessary',
      '',
    ])

    expect(spellingChoiceDistractors(item)).toEqual(['neccesary'])
    expect(supportsSpellingChoice(item)).toBe(false)
    expect(buildSpellingChoiceOptions(item)).toEqual([])
  })

  it('includes words with at least three valid mistakes', () => {
    const item = makeWord('sp-choice-eligible', [
      'neccesary',
      'necessery',
      'necesary',
    ])

    expect(supportsSpellingChoice(item)).toBe(true)
  })
})

describe('spelling choice options', () => {
  it('reproduces the same order from the item id', () => {
    const item = makeWord('sp-choice-stable', [
      'neccesary',
      'necessery',
      'necesary',
      'nessessary',
    ])

    expect(buildSpellingChoiceOptions(item)).toEqual(
      buildSpellingChoiceOptions({ ...item }),
    )
  })

  it('uses the item id to vary deterministic option order', () => {
    const mistakes = [
      'neccesary',
      'necessery',
      'necesary',
      'nessessary',
    ]
    const orders = Array.from({ length: 8 }, (_, index) =>
      buildSpellingChoiceOptions(
        makeWord(`sp-choice-seed-${index}`, mistakes),
      ).join('|'),
    )

    expect(new Set(orders).size).toBeGreaterThan(1)
  })

  it('contains the answer and exactly three distinct non-answer mistakes', () => {
    const item = makeWord('sp-choice-content', [
      'neccesary',
      'necessery',
      'necesary',
      'nessessary',
      'necessary',
      'neccesary',
    ])
    const options = buildSpellingChoiceOptions(item)
    const mistakes = options.filter((option) => option !== item.word)

    expect(options).toHaveLength(4)
    expect(new Set(options).size).toBe(4)
    expect(options).toContain(item.word)
    expect(mistakes).toHaveLength(3)
    mistakes.forEach((mistake) => {
      expect(item.commonMistakes).toContain(mistake)
      expect(mistake).not.toBe(item.word)
    })
  })
})

describe('generated spelling curriculum choice coverage', () => {
  it('contains both eligible and intentionally excluded words', () => {
    const eligible = spellingWords.filter(supportsSpellingChoice)
    const excluded = spellingWords.filter(
      (item) => !supportsSpellingChoice(item),
    )

    expect(eligible).toHaveLength(450)
    expect(excluded).toHaveLength(150)
    eligible.forEach((item) => {
      expect(spellingChoiceDistractors(item).length, item.id)
        .toBeGreaterThanOrEqual(3)
    })
    excluded.forEach((item) => {
      expect(spellingChoiceDistractors(item).length, item.id)
        .toBeLessThan(3)
    })
  })
})
