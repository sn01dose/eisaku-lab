import type {
  SpellingErrorTag,
  SpellingWord,
  WritingErrorTag,
} from '../../domain/learner/types'
import { isSpellingErrorTag } from './errorTagOptions'

export interface FeedbackReviewRow {
  id: string
  source: string
  correction: string
  tag: SpellingErrorTag | WritingErrorTag | null
  note: string
  priority: boolean
  confirmed: boolean
  meaningJa: string
}

function normalizedWord(value: string): string {
  return value.trim().toLocaleLowerCase('en-US')
}

export function isCatalogSpellingWord(
  correction: string,
  spellingWords: readonly SpellingWord[],
): boolean {
  const normalized = normalizedWord(correction)
  return spellingWords.some((word) =>
    word.acceptedAnswers.some(
      (answer) => normalizedWord(answer) === normalized,
    ),
  )
}

export function rowCanBeConfirmed(
  row: FeedbackReviewRow,
  spellingWords: readonly SpellingWord[],
): boolean {
  if (!row.source.trim() || !row.correction.trim() || !row.tag) return false
  return (
    !isSpellingErrorTag(row.tag) ||
    isCatalogSpellingWord(row.correction, spellingWords) ||
    Boolean(row.meaningJa.trim())
  )
}
