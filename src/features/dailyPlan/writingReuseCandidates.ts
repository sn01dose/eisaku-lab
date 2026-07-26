import { writingTaskIdsForWord } from '../../data/index/wordToTasks'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import type {
  AppState,
  SpellingWord,
  WritingTask,
} from '../../domain/learner/types'
import { candidate, writingSessionActivity } from './candidate'

const SPELLING_REUSE_WINDOW_MS = 48 * 60 * 60 * 1000

export function writingReuseCandidates(
  state: AppState,
  now: Date,
  stage: DailyPlanCandidate['stage'],
  spellingById: ReadonlyMap<string, SpellingWord>,
  writingById: ReadonlyMap<string, WritingTask>,
): DailyPlanCandidate[] {
  const words = state.attempts
    .filter((attempt) => {
      const ageMs = now.getTime() - new Date(attempt.at).getTime()
      return (
        attempt.kind === 'spelling' &&
        !attempt.correct &&
        ageMs >= 0 &&
        ageMs <= SPELLING_REUSE_WINDOW_MS
      )
    })
    .sort(
      (left, right) =>
        new Date(right.at).getTime() - new Date(left.at).getTime(),
    )
    .map((attempt) => spellingById.get(attempt.refId))
    .filter((word): word is SpellingWord => Boolean(word))

  const result = new Map<string, DailyPlanCandidate>()
  for (const word of words) {
    const maximumStage = Math.max(stage, word.stage)
    const task = writingTaskIdsForWord(word.word)
      .map((taskId) => writingById.get(taskId))
      .filter(
        (item): item is WritingTask =>
          item !== undefined && item.stage <= maximumStage,
      )
      .sort(
        (left, right) =>
          Number(writingSessionActivity(left.type) === 'shortWriting') -
            Number(writingSessionActivity(right.type) === 'shortWriting') ||
          Math.abs(left.stage - word.stage) -
            Math.abs(right.stage - word.stage) ||
          left.id.localeCompare(right.id),
      )[0]
    if (!task || result.has(task.id)) continue
    result.set(
      task.id,
      candidate(
        'writing',
        writingSessionActivity(task.type),
        task,
        1_000 - result.size,
      ),
    )
  }
  return [...result.values()]
}
