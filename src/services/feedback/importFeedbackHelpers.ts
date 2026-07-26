import type {
  MistakeNote,
  ReviewCard,
  SpellingStrategy,
  SpellingWord,
} from '../../domain/learner/types'
import { createReviewCard } from '../../domain/review/scheduler'
import type {
  ManualGrammarFinding,
  ManualSpellingCorrection,
} from './importFeedbackTypes'

export const DEFAULT_POSITIVE = '内容の意図は伝わっています。'
export const CUSTOM_SPELLING_PREFIX = 'custom-spelling:'

export function normalizeWord(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

export function customSpellingRefId(word: string): string {
  const safe = normalizeWord(word)
    .replace(/[^a-z0-9'-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${CUSTOM_SPELLING_PREFIX}${safe || 'word'}`
}

function inferSpellingStrategy(word: string): SpellingStrategy {
  if (
    /^(?:un|re|dis|in|im|pre|ex|com|con).{3,}$/i.test(word) ||
    /(?:tion|sion|ture|ous|ive|able|ible|ment|ness|ful|ly)$/i.test(word)
  ) {
    return 'morpheme'
  }
  if (
    /(?:ea|ee|oa|ai|ou|oi|ie)/i.test(word) ||
    /[a-z][^aeiou]e$/i.test(word) ||
    /([b-df-hj-np-tv-z])\1/i.test(word)
  ) {
    return 'pattern'
  }
  return 'sound'
}

export function customSpellingWord(input: {
  refId: string
  word: string
  meaningJa: string
  actual: string
  essayAnswer: string
  stage: SpellingWord['stage']
  errorTags: SpellingWord['errorTags']
  skillIds: SpellingWord['skillIds']
}): SpellingWord {
  const word = normalizeWord(input.word)
  return {
    id: input.refId,
    word,
    meaningJa: input.meaningJa.trim(),
    stage: input.stage,
    partOfSpeech: '語',
    strategy: inferSpellingStrategy(word),
    chunks: [word],
    chunkKind: 'phonetic',
    patterns: ['manual-feedback'],
    skillIds: input.skillIds,
    exampleEn: input.essayAnswer,
    exampleJa: '添削した英作文で使った語です。',
    acceptedAnswers: [word],
    commonMistakes: [normalizeWord(input.actual)].filter(
      (mistake) => mistake !== word,
    ),
    errorTags: input.errorTags,
  }
}

function nextLocalDay(now: Date): string {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).toISOString()
}

export function tomorrowCard(
  refId: string,
  source: ReviewCard['source'],
  now: Date,
): ReviewCard {
  return {
    ...createReviewCard({
      kind: 'spelling',
      refId,
      source,
      now,
    }),
    interval: 1,
    dueAt: nextLocalDay(now),
  }
}

export function scheduleByTomorrow(
  current: ReviewCard | undefined,
  fallback: ReviewCard,
): ReviewCard {
  if (!current) return fallback
  const currentDue = new Date(current.dueAt).getTime()
  const tomorrowDue = new Date(fallback.dueAt).getTime()
  if (Number.isNaN(currentDue) || currentDue > tomorrowDue) {
    return {
      ...current,
      interval: Math.min(current.interval, 1),
      dueAt: fallback.dueAt,
    }
  }
  return current
}

export function orderedGrammarFindings(
  findings: readonly ManualGrammarFinding[],
): ManualGrammarFinding[] {
  const cleaned = findings
    .map((finding) => ({ ...finding, message: finding.message.trim() }))
    .filter((finding) => finding.message.length > 0)
  const selectedPrimary = cleaned.findIndex(
    (finding) => finding.priority === 'primary',
  )
  const primaryIndex = selectedPrimary >= 0 ? selectedPrimary : 0
  return cleaned
    .map(
      (finding, index): ManualGrammarFinding => ({
        ...finding,
        priority: index === primaryIndex ? 'primary' : 'secondary',
      }),
    )
    .sort((left, right) =>
      left.priority === right.priority
        ? 0
        : left.priority === 'primary'
          ? -1
          : 1,
    )
}

export function cleanedSpellingCorrections(
  corrections: readonly ManualSpellingCorrection[],
): ManualSpellingCorrection[] {
  const seen = new Set<string>()
  return corrections
    .map(({ input, correction, meaningJa, errorTag }) => ({
      input: input.trim(),
      correction: correction.trim(),
      meaningJa: meaningJa?.trim(),
      errorTag,
    }))
    .filter(({ input, correction }) => input.length > 0 && correction.length > 0)
    .filter(({ input, correction }) => {
      const key = `${normalizeWord(input)}\u0000${normalizeWord(correction)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function upsertNote(
  notes: MistakeNote[],
  next: MistakeNote,
): 'created' | 'updated' {
  const index = notes.findIndex(
    (note) =>
      !note.conquered &&
      note.kind === next.kind &&
      note.refId === next.refId &&
      note.primaryErrorTag === next.primaryErrorTag &&
      note.input === next.input,
  )
  if (index < 0) {
    notes.unshift(next)
    return 'created'
  }
  const current = notes[index]
  if (!current) return 'created'
  notes[index] = {
    ...current,
    input: next.input,
    correction: next.correction,
    updatedAt: next.updatedAt,
    errorTags: Array.from(new Set([...current.errorTags, ...next.errorTags])),
    skillIds: Array.from(new Set([...current.skillIds, ...next.skillIds])),
    occurrenceCount: current.occurrenceCount + 1,
    reviewCardId: next.reviewCardId ?? current.reviewCardId,
  }
  return 'updated'
}

export function findCatalogWord(
  correction: string,
  spellingWords: readonly SpellingWord[],
): SpellingWord | undefined {
  const normalized = normalizeWord(correction)
  return spellingWords.find((word) =>
    word.acceptedAnswers.some((answer) => normalizeWord(answer) === normalized),
  )
}

export function sentenceCount(value: string): number {
  return value
    .trim()
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0).length
}
