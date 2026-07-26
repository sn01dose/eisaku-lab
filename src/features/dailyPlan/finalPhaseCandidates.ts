import { writingTasks } from '../../data/writing'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import type {
  AppState,
  SimplificationTask,
  SpellingWord,
  WritingTask,
} from '../../domain/learner/types'
import { candidate, writingSessionActivity } from './candidate'

interface FinalPhaseReviewInput {
  state: AppState
  now: Date
  review: DailyPlanCandidate[]
  spellingById: ReadonlyMap<string, SpellingWord>
  writingById: ReadonlyMap<string, WritingTask>
  simplifyById: ReadonlyMap<string, SimplificationTask>
}

export function prioritizeFinalPhaseReview({
  state,
  now,
  review,
  spellingById,
  writingById,
  simplifyById,
}: FinalPhaseReviewInput): void {
  const unresolvedNote = state.notes.find((note) => !note.conquered)
  if (!unresolvedNote) return

  let required: DailyPlanCandidate | null = null
  if (unresolvedNote.kind === 'spelling') {
    const item = spellingById.get(unresolvedNote.refId)
    if (item) {
      required = candidate('spelling', 'spellingReview', item, 10_000)
    }
  } else if (unresolvedNote.kind === 'writing') {
    const item = writingById.get(unresolvedNote.refId)
    if (item) {
      required = candidate(
        'writing',
        writingSessionActivity(item.type),
        item,
        10_000,
      )
    }
  } else {
    const item = simplifyById.get(unresolvedNote.refId)
    if (item) {
      required = candidate(
        'simplification',
        'basicWriting',
        {
          ...item,
          skillIds: ['writing.japaneseSimplification'],
        },
        10_000,
      )
    }
  }

  if (required && !review.some(({ refId }) => refId === required.refId)) {
    review.push({
      ...required,
      mandatory: true,
      dueAt: now.toISOString(),
    })
    return
  }

  if (required) {
    const existing = review.find(({ refId }) => refId === required.refId)
    if (existing) {
      existing.mandatory = true
      existing.priority = 10_000
    }
  }
}

interface FinalPhaseWeakInput {
  state: AppState
  stage: DailyPlanCandidate['stage']
  reviewIds: ReadonlySet<string>
  recentWrongSpelling: ReadonlyMap<string, number>
  spellingById: ReadonlyMap<string, SpellingWord>
  writingById: ReadonlyMap<string, WritingTask>
}

export interface FinalPhaseWeakCandidates {
  writing: DailyPlanCandidate[]
  recentWrongSpelling: DailyPlanCandidate[]
}

export function buildFinalPhaseWeakCandidates({
  state,
  stage,
  reviewIds,
  recentWrongSpelling,
  spellingById,
  writingById,
}: FinalPhaseWeakInput): FinalPhaseWeakCandidates {
  const writing = [
    ...state.essays
      .slice()
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )
      .map((essay) => writingById.get(essay.taskId))
      .filter((item): item is WritingTask => Boolean(item))
      .map((item) =>
        candidate(
          'writing',
          writingSessionActivity(item.type),
          item,
          900,
        ),
      ),
    ...writingTasks
      .filter((item) => item.type === 'timed' && item.stage <= stage)
      .map((item) => candidate('writing', 'shortWriting', item, 800)),
  ]

  const recentWrong = [...recentWrongSpelling.entries()]
    .filter(([refId]) => !reviewIds.has(refId))
    .map(([refId]) => spellingById.get(refId))
    .filter((item): item is SpellingWord => Boolean(item))
    .map((item) =>
      candidate(
        'spelling',
        'spellingReview',
        item,
        500 + (recentWrongSpelling.get(item.id) ?? 0) * 10,
      ),
    )

  return { writing, recentWrongSpelling: recentWrong }
}
