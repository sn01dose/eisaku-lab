import { describe, expect, it } from 'vitest'
import {
  ALL_SKILL_IDS,
  type SkillId,
  type SpellingErrorTag,
  type StageId,
  type WritingErrorTag,
} from '../../domain/learner/types'
import {
  diagnosticItems,
  extendedWritingTasks,
  miniLessons,
  REQUIRED_SPELLING_PATTERN_IDS,
  shortWritingTasks,
  simplificationTasks,
  spellingWords,
  taskIdsForWord,
  tokenizeEnglish,
  vocabularyFrequency,
  wordToTasks,
  writingTasks,
} from '../../data'

const stages: StageId[] = [1, 2, 3, 4, 5, 6]
const spellingTargets = [110, 100, 100, 100, 100, 90]
const shortWritingTargets = [55, 55, 50, 50, 45, 45]
const extendedWritingTargets = [3, 5, 10, 14, 14, 14]
const simplificationTargets = [0, 8, 14, 18, 16, 14]

const spellingTags: SpellingErrorTag[] = [
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

const writingTags: WritingErrorTag[] = [
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

function countByStage<T extends { stage: StageId }>(
  items: readonly T[],
): number[] {
  return stages.map(
    (stage) => items.filter((item) => item.stage === stage).length,
  )
}

function expectAtLeast(actual: readonly number[], targets: readonly number[]) {
  actual.forEach((count, index) => {
    expect(count, `Stage ${index + 1}`).toBeGreaterThanOrEqual(targets[index])
  })
}

function isAscii(text: string): boolean {
  return [...text].every((character) => character.charCodeAt(0) <= 127)
}

function expectCleanEnglish(text: string, label: string): void {
  expect(isAscii(text), `${label}: non-ASCII`).toBe(true)
  expect(text.includes('  '), `${label}: consecutive spaces`).toBe(false)
  expect(
    text.split('\n').some((line) => line !== line.trimEnd()),
    `${label}: trailing whitespace`,
  ).toBe(false)
}

describe('curriculum scale and distribution', () => {
  it('meets every Stage target without thinning Stage 5 or 6', () => {
    expect(spellingWords.length).toBeGreaterThanOrEqual(600)
    expect(shortWritingTasks.length).toBeGreaterThanOrEqual(300)
    expect(extendedWritingTasks.length).toBeGreaterThanOrEqual(60)
    expect(simplificationTasks.length).toBeGreaterThanOrEqual(70)
    expect(miniLessons.length).toBeGreaterThanOrEqual(32)
    expect(diagnosticItems).toHaveLength(30)
    expectAtLeast(countByStage(spellingWords), spellingTargets)
    expectAtLeast(countByStage(shortWritingTasks), shortWritingTargets)
    expectAtLeast(countByStage(extendedWritingTasks), extendedWritingTargets)
    expectAtLeast(countByStage(simplificationTasks), simplificationTargets)
  })

  it('keeps IDs unique across every curriculum kind', () => {
    const ids = [
      ...spellingWords,
      ...writingTasks,
      ...simplificationTasks,
      ...miniLessons,
      ...diagnosticItems,
    ].map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('spelling integrity and coverage', () => {
  it('keeps chunks, answers, mistakes, and skills internally consistent', () => {
    const validSkills = new Set<SkillId>(ALL_SKILL_IDS)
    spellingWords.forEach((item) => {
      expect(item.chunks.join(''), item.id).toBe(item.word)
      expect(item.acceptedAnswers, item.id).toContain(item.word)
      item.commonMistakes.forEach((mistake) => {
        expect(mistake.trim().toLowerCase(), item.id).not.toBe(
          item.word.trim().toLowerCase(),
        )
      })
      item.skillIds.forEach((skillId) => {
        expect(validSkills.has(skillId), `${item.id}: ${skillId}`).toBe(true)
      })
    })
  })

  it('contains at least eight actual curriculum words per required pattern group', () => {
    for (const patternId of REQUIRED_SPELLING_PATTERN_IDS) {
      const count = spellingWords.filter((item) =>
        item.patterns.includes(patternId),
      ).length
      expect(count, patternId).toBeGreaterThanOrEqual(8)
    }
  })

  it('uses every spelling word in a model answer or its example', () => {
    const curriculumModelText = [
      ...writingTasks.flatMap((task) => task.modelAnswers),
      ...simplificationTasks.flatMap((task) => task.modelEn ?? []),
    ].join(' ')
    const modelTokens = new Set(tokenizeEnglish(curriculumModelText))
    const missing: string[] = []
    spellingWords.forEach((item) => {
      const exampleTokens = new Set(tokenizeEnglish(item.exampleEn))
      if (!modelTokens.has(item.word) && !exampleTokens.has(item.word)) {
        missing.push(`${item.id}:${item.word}`)
      }
      expect(taskIdsForWord(item.word).length, item.id).toBeGreaterThan(0)
    })
    expect(missing).toEqual([])
  })
})

describe('writing patterns and shared vocabulary', () => {
  it('keeps at least four tasks in every declared sentence pattern', () => {
    const groups = new Map<string, number>()
    shortWritingTasks.forEach((task) => {
      if (!task.sentencePatternId) return
      groups.set(
        task.sentencePatternId,
        (groups.get(task.sentencePatternId) ?? 0) + 1,
      )
    })
    expect(groups.size).toBeGreaterThanOrEqual(20)
    groups.forEach((count, patternId) => {
      expect(count, patternId).toBeGreaterThanOrEqual(4)
    })
  })

  it('keeps multiple model answers and valid skills on every task', () => {
    const validSkills = new Set<SkillId>(ALL_SKILL_IDS)
    writingTasks.forEach((task) => {
      expect(task.modelAnswers.length, task.id).toBeGreaterThanOrEqual(2)
      task.requiredSkills.forEach((skillId) => {
        expect(validSkills.has(skillId), `${task.id}: ${skillId}`).toBe(true)
      })
    })
  })

  it('builds a substantial word-to-task index from model answers', () => {
    expect(Object.keys(wordToTasks).length).toBeGreaterThanOrEqual(500)
    expect(
      Object.values(vocabularyFrequency).filter((count) => count >= 2).length,
    ).toBeGreaterThanOrEqual(250)
    Object.entries(wordToTasks).forEach(([word, taskIds]) => {
      expect(word.trim()).not.toBe('')
      expect(taskIds.length, word).toBeGreaterThan(0)
    })
  })
})

describe('lesson and text quality', () => {
  it('covers all 30 spelling and writing error tags', () => {
    const covered = new Set(miniLessons.flatMap((lesson) => lesson.triggerTags))
    ;[...spellingTags, ...writingTags].forEach((tag) => {
      expect(covered, tag).toContain(tag)
    })
  })

  it('keeps lesson bodies between 200 and 400 Japanese characters', () => {
    miniLessons.forEach((lesson) => {
      expect(lesson.bodyMd.length, lesson.id).toBeGreaterThanOrEqual(200)
      expect(lesson.bodyMd.length, lesson.id).toBeLessThanOrEqual(400)
    })
  })

  it('keeps every English field ASCII-clean and whitespace-clean', () => {
    spellingWords.forEach((item) =>
      expectCleanEnglish(item.exampleEn, `${item.id}.exampleEn`),
    )
    writingTasks.forEach((task) =>
      task.modelAnswers.forEach((answer, index) =>
        expectCleanEnglish(answer, `${task.id}.modelAnswers[${index}]`),
      ),
    )
    simplificationTasks.forEach((task) =>
      (task.modelEn ?? []).forEach((answer, index) =>
        expectCleanEnglish(answer, `${task.id}.modelEn[${index}]`),
      ),
    )
    miniLessons.forEach((lesson) =>
      lesson.examples.forEach((example, index) =>
        expectCleanEnglish(example.en, `${lesson.id}.examples[${index}]`),
      ),
    )
  })

  it('flags extreme Japanese-prompt to English-answer length ratios', () => {
    shortWritingTasks.forEach((task) => {
      const promptLength = [...task.promptJa].filter(
        (character) => !/\s/u.test(character),
      ).length
      task.modelAnswers.forEach((answer) => {
        const ratio = promptLength / Math.max(1, tokenizeEnglish(answer).length)
        expect(ratio, task.id).toBeGreaterThanOrEqual(0.6)
        expect(ratio, task.id).toBeLessThanOrEqual(15)
      })
    })
  })

  it('contains no placeholder curriculum content', () => {
    expect(
      JSON.stringify({
        spellingWords,
        writingTasks,
        simplificationTasks,
        miniLessons,
      }),
    ).not.toMatch(/\b(?:TODO|sample|placeholder|Lorem)\b/i)
  })
})
