export type DailyMinutes = 15 | 30 | 45

export type SessionActivity =
  | 'spellingReview'
  | 'spellingNew'
  | 'basicWriting'
  | 'shortWriting'
  | 'reflection'

export type TimedLearningActivity = Exclude<SessionActivity, 'reflection'>

export type SessionActivityCounts = Record<SessionActivity, number>
export type LearningActivityAvailability = Partial<
  Record<TimedLearningActivity, number>
>
export type ResponseTimeAverages = Partial<
  Record<TimedLearningActivity, number>
>

export interface ResponseTimeSample {
  activity: TimedLearningActivity
  responseTimeMs: number
}

export interface SessionTimingPlan {
  counts: SessionActivityCounts
  secondsPerItem: Record<SessionActivity, number>
  budgetSeconds: number
  learningBudgetSeconds: number
  reflectionSeconds: number
  totalEstimatedSeconds: number
  adjustedActivities: TimedLearningActivity[]
}

export const TIMED_LEARNING_ACTIVITIES = [
  'spellingReview',
  'spellingNew',
  'basicWriting',
  'shortWriting',
] as const satisfies readonly TimedLearningActivity[]

export const TARGET_RESPONSE_SECONDS: Record<TimedLearningActivity, number> = {
  spellingReview: 25,
  spellingNew: 40,
  basicWriting: 70,
  shortWriting: 240,
}

export const BASE_SESSION_COUNTS: Record<
  DailyMinutes,
  SessionActivityCounts
> = {
  15: {
    spellingReview: 6,
    spellingNew: 5,
    basicWriting: 4,
    shortWriting: 1,
    reflection: 1,
  },
  30: {
    spellingReview: 12,
    spellingNew: 10,
    basicWriting: 7,
    shortWriting: 2,
    reflection: 1,
  },
  45: {
    spellingReview: 18,
    spellingNew: 15,
    basicWriting: 11,
    shortWriting: 3,
    reflection: 1,
  },
}

function baseLearningSeconds(minutes: DailyMinutes): number {
  const counts = BASE_SESSION_COUNTS[minutes]
  return TIMED_LEARNING_ACTIVITIES.reduce(
    (total, activity) =>
      total + counts[activity] * TARGET_RESPONSE_SECONDS[activity],
    0,
  )
}

function availableCount(
  availability: LearningActivityAvailability | undefined,
  activity: TimedLearningActivity,
): number {
  const supplied = availability?.[activity]
  if (supplied === undefined) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor(supplied))
}

function outsideAdjustmentBand(
  averageMs: number | undefined,
  targetSeconds: number,
): boolean {
  if (!averageMs || averageMs <= 0) return false
  const targetMs = targetSeconds * 1000
  return averageMs < targetMs * 0.6 || averageMs > targetMs * 1.4
}

function desiredCount(
  baseCount: number,
  targetSeconds: number,
  averageMs: number | undefined,
  availability: number,
): number {
  const hasCandidates = availability > 0
  if (!hasCandidates) return 0
  const adjusted = outsideAdjustmentBand(averageMs, targetSeconds)
    ? Math.round((baseCount * targetSeconds * 1000) / (averageMs ?? 1))
    : baseCount
  return Math.min(availability, Math.max(1, adjusted))
}

function selectFillActivity(
  counts: SessionActivityCounts,
  baseCounts: SessionActivityCounts,
  secondsPerItem: Record<SessionActivity, number>,
  availability: LearningActivityAvailability | undefined,
  remainingSeconds: number,
): TimedLearningActivity | null {
  const choices = TIMED_LEARNING_ACTIVITIES.filter(
    (activity) =>
      counts[activity] < availableCount(availability, activity) &&
      secondsPerItem[activity] <= remainingSeconds,
  )
  choices.sort(
    (left, right) =>
      counts[left] / baseCounts[left] - counts[right] / baseCounts[right] ||
      secondsPerItem[left] - secondsPerItem[right] ||
      TIMED_LEARNING_ACTIVITIES.indexOf(left) -
        TIMED_LEARNING_ACTIVITIES.indexOf(right),
  )
  return choices[0] ?? null
}

function trimToBudget(
  counts: SessionActivityCounts,
  secondsPerItem: Record<SessionActivity, number>,
  learningBudgetSeconds: number,
  availability: LearningActivityAvailability | undefined,
): void {
  const minimum = Object.fromEntries(
    TIMED_LEARNING_ACTIVITIES.map((activity) => [
      activity,
      availableCount(availability, activity) > 0 ? 1 : 0,
    ]),
  ) as Record<TimedLearningActivity, number>
  const usedSeconds = () =>
    TIMED_LEARNING_ACTIVITIES.reduce(
      (total, activity) =>
        total + counts[activity] * secondsPerItem[activity],
      0,
    )

  while (usedSeconds() > learningBudgetSeconds) {
    const removable = TIMED_LEARNING_ACTIVITIES.filter(
      (activity) => counts[activity] > minimum[activity],
    ).sort(
      (left, right) =>
        secondsPerItem[right] - secondsPerItem[left] ||
        counts[right] - counts[left],
    )
    const activity = removable[0]
    if (!activity) break
    counts[activity] -= 1
  }
}

export function calculateResponseTimeAverages(
  samples: readonly ResponseTimeSample[],
  recentPerActivity = 12,
): ResponseTimeAverages {
  const result: ResponseTimeAverages = {}
  for (const activity of TIMED_LEARNING_ACTIVITIES) {
    const recent = samples
      .filter(
        (sample) =>
          sample.activity === activity &&
          Number.isFinite(sample.responseTimeMs) &&
          sample.responseTimeMs > 0,
      )
      .slice(-Math.max(1, Math.floor(recentPerActivity)))
    if (recent.length > 0) {
      result[activity] =
        recent.reduce((total, sample) => total + sample.responseTimeMs, 0) /
        recent.length
    }
  }
  return result
}

export function createSessionTimingPlan(input: {
  dailyMinutes: DailyMinutes
  averageResponseTimeMs?: ResponseTimeAverages
  availability?: LearningActivityAvailability
}): SessionTimingPlan {
  const baseCounts = BASE_SESSION_COUNTS[input.dailyMinutes]
  const learningBudgetSeconds = baseLearningSeconds(input.dailyMinutes)
  const budgetSeconds = input.dailyMinutes * 60
  const adjustedActivities = TIMED_LEARNING_ACTIVITIES.filter((activity) =>
    outsideAdjustmentBand(
      input.averageResponseTimeMs?.[activity],
      TARGET_RESPONSE_SECONDS[activity],
    ),
  )
  const secondsPerItem = {
    ...TARGET_RESPONSE_SECONDS,
    reflection: Math.max(0, budgetSeconds - learningBudgetSeconds),
  }
  for (const activity of adjustedActivities) {
    secondsPerItem[activity] =
      (input.averageResponseTimeMs?.[activity] ?? 0) / 1000
  }

  const counts: SessionActivityCounts = {
    spellingReview: 0,
    spellingNew: 0,
    basicWriting: 0,
    shortWriting: 0,
    reflection: 1,
  }
  for (const activity of TIMED_LEARNING_ACTIVITIES) {
    counts[activity] = desiredCount(
      baseCounts[activity],
      TARGET_RESPONSE_SECONDS[activity],
      input.averageResponseTimeMs?.[activity],
      availableCount(input.availability, activity),
    )
  }

  trimToBudget(
    counts,
    secondsPerItem,
    learningBudgetSeconds,
    input.availability,
  )
  let usedSeconds = TIMED_LEARNING_ACTIVITIES.reduce(
    (total, activity) =>
      total + counts[activity] * secondsPerItem[activity],
    0,
  )
  let fill = selectFillActivity(
    counts,
    baseCounts,
    secondsPerItem,
    input.availability,
    learningBudgetSeconds - usedSeconds,
  )
  while (fill) {
    counts[fill] += 1
    usedSeconds += secondsPerItem[fill]
    fill = selectFillActivity(
      counts,
      baseCounts,
      secondsPerItem,
      input.availability,
      learningBudgetSeconds - usedSeconds,
    )
  }

  const reflectionSeconds = Math.max(0, budgetSeconds - usedSeconds)
  secondsPerItem.reflection = reflectionSeconds
  return {
    counts,
    secondsPerItem,
    budgetSeconds,
    learningBudgetSeconds,
    reflectionSeconds,
    totalEstimatedSeconds: usedSeconds + reflectionSeconds,
    adjustedActivities,
  }
}
