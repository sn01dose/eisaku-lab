import type { StageId } from '../learner/types'

export interface WeeklySnapshot {
  weekStart: string
  studiedDays: number
  totalMinutes: number
  spellingAttempts: number
  spellingRecallAccuracy: number
  wordStableCount: number
  writingAttempts: number
  paragraphCount: number
  supportLevel: number
  withinLimitWordsAvg: number | null
  topErrorTags: Array<{ tag: string; count: number }>
  stage: StageId
}
