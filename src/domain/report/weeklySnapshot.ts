import type {
  AppState,
  ReviewCard,
  WritingTask,
} from '../learner/types'
import { addDays, dateKey } from '../plan/buildStudyPlan'
import type { WeeklySnapshot } from './types'

export const MAX_WEEKLY_SNAPSHOTS = 26

function dateFromKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime())
}

export function weekStartKey(value: Date | string): string {
  const key =
    typeof value === 'string'
      ? value.slice(0, 10)
      : dateKey(value)
  const date = dateFromKey(key)
  if (!isValidDate(date)) return key
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  return addDays(key, -daysSinceMonday)
}

function dateKeyFromTimestamp(value: string): string | null {
  const date = new Date(value)
  return isValidDate(date) ? dateKey(date) : null
}

function inWeek(value: string, weekStart: string): boolean {
  const key = dateKeyFromTimestamp(value)
  return key !== null && key >= weekStart && key < addDays(weekStart, 7)
}

export function isWordStableReviewCard(card: ReviewCard): boolean {
  return (
    card.kind === 'spelling' &&
    card.repetitions >= 3 &&
    card.lastResult === 'correct'
  )
}

export function countWordStableCards(
  cards: Readonly<Record<string, ReviewCard>>,
): number {
  return new Set(
    Object.values(cards)
      .filter(isWordStableReviewCard)
      .map((card) => card.refId),
  ).size
}

function countTopErrorTags(
  attempts: AppState['attempts'],
): WeeklySnapshot['topErrorTags'] {
  const counts = new Map<string, number>()
  for (const attempt of attempts) {
    for (const tag of attempt.errorTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort(
      ([leftTag, leftCount], [rightTag, rightCount]) =>
        rightCount - leftCount || leftTag.localeCompare(rightTag, 'en'),
    )
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))
}

function studiedDateKeys(
  state: AppState,
  weekStart: string,
): Set<string> {
  const result = new Set<string>()
  for (const attempt of state.attempts) {
    if (!inWeek(attempt.at, weekStart)) continue
    const key = dateKeyFromTimestamp(attempt.at)
    if (key) result.add(key)
  }
  for (const session of state.sessions) {
    if (
      session.plannedFor >= weekStart &&
      session.plannedFor < addDays(weekStart, 7) &&
      (session.status === 'completed' ||
        session.completedItemIds.length > 0)
    ) {
      result.add(session.plannedFor)
    }
  }
  return result
}

function totalResponseMinutes(attempts: AppState['attempts']): number {
  if (attempts.length === 0) return 0
  const totalMs = attempts.reduce(
    (total, attempt) => total + Math.max(0, attempt.responseTimeMs),
    0,
  )
  return Math.max(1, Math.round(totalMs / 60_000))
}

function paragraphTaskIds(
  writingTasks: readonly WritingTask[],
): Set<string> {
  return new Set(
    writingTasks
      .filter((task) => task.type === 'paragraph' || task.type === 'timed')
      .map((task) => task.id),
  )
}

export function buildWeeklySnapshot(
  state: AppState,
  weekStart: string,
  writingTasks: readonly WritingTask[] = [],
): WeeklySnapshot | null {
  if (!state.profile) return null
  const normalizedWeekStart = weekStartKey(weekStart)
  const attempts = state.attempts.filter((attempt) =>
    inWeek(attempt.at, normalizedWeekStart),
  )
  const spellingAttempts = attempts.filter(
    (attempt) => attempt.kind === 'spelling',
  )
  const recallAttempts = spellingAttempts.filter(
    (attempt) => attempt.isRecall,
  )
  const writingAttempts = attempts.filter(
    (attempt) => attempt.kind === 'writing',
  )
  const withinLimitCounts = writingAttempts
    .map((attempt) => attempt.withinLimitWordCount)
    .filter((count): count is number => typeof count === 'number')
  const paragraphIds = paragraphTaskIds(writingTasks)

  return {
    weekStart: normalizedWeekStart,
    studiedDays: studiedDateKeys(state, normalizedWeekStart).size,
    totalMinutes: totalResponseMinutes(attempts),
    spellingAttempts: spellingAttempts.length,
    spellingRecallAccuracy:
      recallAttempts.length === 0
        ? 0
        : recallAttempts.filter((attempt) => attempt.correct).length /
          recallAttempts.length,
    wordStableCount: countWordStableCards(state.cards),
    writingAttempts: writingAttempts.length,
    paragraphCount: state.essays.filter(
      (essay) =>
        paragraphIds.has(essay.taskId) &&
        inWeek(essay.createdAt, normalizedWeekStart),
    ).length,
    supportLevel: state.profile.supportLevel,
    withinLimitWordsAvg:
      withinLimitCounts.length === 0
        ? null
        : Math.round(
            withinLimitCounts.reduce((total, count) => total + count, 0) /
              withinLimitCounts.length,
          ),
    topErrorTags: countTopErrorTags(attempts),
    stage: state.profile.currentStage,
  }
}

function earliestActivityWeek(
  state: AppState,
  currentWeekStart: string,
): string {
  const candidates = [
    state.profile?.createdAt,
    ...state.attempts.map((attempt) => attempt.at),
    ...state.sessions.map((session) => session.plannedFor),
    ...state.essays.map((essay) => essay.createdAt),
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => {
      const timestamp = dateKeyFromTimestamp(value)
      return weekStartKey(timestamp ?? value)
    })
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort()
  const retentionStart = addDays(
    currentWeekStart,
    -7 * MAX_WEEKLY_SNAPSHOTS,
  )
  return candidates[0] && candidates[0] > retentionStart
    ? candidates[0]
    : retentionStart
}

export function refreshWeeklySnapshots(
  state: AppState,
  now = new Date(),
  writingTasks: readonly WritingTask[] = [],
): AppState {
  if (!state.profile) {
    return state.weeklySnapshots.length <= MAX_WEEKLY_SNAPSHOTS
      ? state
      : {
          ...state,
          weeklySnapshots: state.weeklySnapshots.slice(
            -MAX_WEEKLY_SNAPSHOTS,
          ),
        }
  }
  const currentWeekStart = weekStartKey(now)
  const snapshotsByWeek = new Map(
    state.weeklySnapshots.map((snapshot) => [
      snapshot.weekStart,
      snapshot,
    ]),
  )
  const existingWeeks = [...snapshotsByWeek.keys()].sort()
  let nextWeek =
    existingWeeks.length > 0
      ? addDays(existingWeeks.at(-1) as string, 7)
      : earliestActivityWeek(state, currentWeekStart)

  while (nextWeek < currentWeekStart) {
    if (!snapshotsByWeek.has(nextWeek)) {
      const snapshot = buildWeeklySnapshot(
        state,
        nextWeek,
        writingTasks,
      )
      if (snapshot) snapshotsByWeek.set(nextWeek, snapshot)
    }
    nextWeek = addDays(nextWeek, 7)
  }

  const weeklySnapshots = [...snapshotsByWeek.values()]
    .sort((left, right) => left.weekStart.localeCompare(right.weekStart))
    .slice(-MAX_WEEKLY_SNAPSHOTS)
  const unchanged =
    weeklySnapshots.length === state.weeklySnapshots.length &&
    weeklySnapshots.every(
      (snapshot, index) => snapshot === state.weeklySnapshots[index],
    )
  return unchanged ? state : { ...state, weeklySnapshots }
}
