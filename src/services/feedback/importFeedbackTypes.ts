import type {
  AppState,
  FeedbackResult,
  SpellingErrorTag,
  SpellingWord,
  WritingErrorTag,
} from '../../domain/learner/types'

export type FeedbackPriority = 'primary' | 'secondary'

export interface ManualGrammarFinding {
  errorTag: WritingErrorTag
  message: string
  priority: FeedbackPriority
  input: string
  correction: string
}

export interface ManualSpellingCorrection {
  input: string
  correction: string
  meaningJa?: string
  errorTag: SpellingErrorTag | ''
}

export interface ManualFeedbackDraft {
  correctedAnswer: string
  positiveMessage: string
  grammarFindings: ManualGrammarFinding[]
  spellingCorrections: ManualSpellingCorrection[]
}

export interface FeedbackImportSummary {
  essayId: string
  primaryErrorTag: WritingErrorTag | null
  notesCreated: number
  notesUpdated: number
  cardsCreated: number
  knownSpellingCards: number
  customSpellingCards: number
}

export interface FeedbackImportResult {
  state: AppState
  feedback: FeedbackResult
  summary: FeedbackImportSummary
}

export interface ImportInput {
  state: AppState
  essayId: string
  draft: ManualFeedbackDraft
  spellingWords: readonly SpellingWord[]
  now?: Date
  makeId?: (prefix: string) => string
}
