import type {
  SessionItem,
  SkillId,
  StageId,
} from '../learner/types'
import {
  createSessionTimingPlan,
  TIMED_LEARNING_ACTIVITIES,
  type DailyMinutes,
  type ResponseTimeAverages,
  type SessionActivityCounts,
  type SessionTimingPlan,
  type TimedLearningActivity,
} from '../session/timing'

export interface DailyPlanCandidate {
  id: string
  kind: SessionItem['kind']
  activity?: TimedLearningActivity
  refId: string
  stage: StageId
  skillIds: SkillId[]
  estimatedMinutes?: number
  priority?: number
  dueAt?: string
}

export interface DailyPlan {
  generatedAt: string
  dailyMinutes: DailyMinutes
  targetItemCount: number
  counts: { review: number; weak: number; new: number }
  activityCounts: SessionActivityCounts
  estimatedTotalMinutes: number
  timing: SessionTimingPlan
  items: SessionItem[]
}

export interface DailyPlanInput {
  dailyMinutes: DailyMinutes
  currentStage: StageId
  review: readonly DailyPlanCandidate[]
  weak: readonly DailyPlanCandidate[]
  newItems: readonly DailyPlanCandidate[]
  averageResponseTimeMs?: ResponseTimeAverages
  now?: Date
}

type Source = 'review' | 'weak' | 'new'
type Counts = Record<Source, number>

interface CandidateEntry {
  candidate: DailyPlanCandidate
  source: Source
  activity: TimedLearningActivity
}

const SOURCES: Source[] = ['review', 'weak', 'new']
const BASE_RATIOS: Record<Source, number> = {
  review: 0.5,
  weak: 0.3,
  new: 0.2,
}

function allocateByRatio(total: number, ratios: Record<Source, number>): Counts {
  const exact = SOURCES.map((source) => ({
    source,
    count: Math.floor(total * ratios[source]),
    remainder: total * ratios[source] - Math.floor(total * ratios[source]),
  }))
  let remaining = total - exact.reduce((sum, entry) => sum + entry.count, 0)
  exact.sort(
    (left, right) =>
      right.remainder - left.remainder ||
      SOURCES.indexOf(left.source) - SOURCES.indexOf(right.source),
  )
  for (const entry of exact) {
    if (remaining === 0) break
    entry.count += 1
    remaining -= 1
  }
  return Object.fromEntries(
    exact.map(({ source, count }) => [source, count]),
  ) as Counts
}

function byPriority(
  left: DailyPlanCandidate,
  right: DailyPlanCandidate,
): number {
  const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : Infinity
  const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : Infinity
  return (
    leftDue - rightDue ||
    (right.priority ?? 0) - (left.priority ?? 0) ||
    left.id.localeCompare(right.id)
  )
}

function candidateKey(candidate: DailyPlanCandidate): string {
  return `${candidate.kind}:${candidate.refId}`
}

function inferActivity(
  candidate: DailyPlanCandidate,
  source: Source,
): TimedLearningActivity {
  if (candidate.activity) return candidate.activity
  if (candidate.kind === 'spelling') {
    return source === 'new' ? 'spellingNew' : 'spellingReview'
  }
  return 'basicWriting'
}

function toEntries(input: DailyPlanInput): CandidateEntry[] {
  return [
    ...input.review.map((candidate) => ({
      candidate,
      source: 'review' as const,
      activity: inferActivity(candidate, 'review'),
    })),
    ...input.weak.map((candidate) => ({
      candidate,
      source: 'weak' as const,
      activity: inferActivity(candidate, 'weak'),
    })),
    ...input.newItems.map((candidate) => ({
      candidate,
      source: 'new' as const,
      activity: inferActivity(candidate, 'new'),
    })),
  ]
}

function uniqueAvailability(
  entries: readonly CandidateEntry[],
): Partial<Record<TimedLearningActivity, number>> {
  return Object.fromEntries(
    TIMED_LEARNING_ACTIVITIES.map((activity) => [
      activity,
      new Set(
        entries
          .filter((entry) => entry.activity === activity)
          .map(({ candidate }) => candidateKey(candidate)),
      ).size,
    ]),
  )
}

function chooseRatios(
  target: number,
  input: DailyPlanInput,
): Record<Source, number> {
  if (input.review.length > target) {
    return { review: 0.7, weak: 0.2, new: 0.1 }
  }
  const baseReview = Math.ceil(target * BASE_RATIOS.review)
  if (
    input.newItems.length >= target * 2 &&
    input.review.length < baseReview / 2
  ) {
    return { review: 0.3, weak: 0.3, new: 0.4 }
  }
  return BASE_RATIOS
}

function sourcePreference(activity: TimedLearningActivity): Source[] {
  return activity === 'spellingNew'
    ? ['new', 'weak', 'review']
    : ['review', 'weak', 'new']
}

function selectForActivity(
  activity: TimedLearningActivity,
  requested: number,
  entries: readonly CandidateEntry[],
  sourceTargets: Counts,
  selected: CandidateEntry[],
  used: Set<string>,
): void {
  const sourceCounts = () =>
    selected.reduce<Counts>(
      (counts, entry) => ({
        ...counts,
        [entry.source]: counts[entry.source] + 1,
      }),
      { review: 0, weak: 0, new: 0 },
    )

  while (
    selected.filter((entry) => entry.activity === activity).length < requested
  ) {
    const actual = sourceCounts()
    const preferences = sourcePreference(activity)
    const sources = [...SOURCES].sort(
      (left, right) =>
        sourceTargets[right] -
          actual[right] -
          (sourceTargets[left] - actual[left]) ||
        preferences.indexOf(left) - preferences.indexOf(right),
    )
    let chosen: CandidateEntry | undefined
    for (const source of sources) {
      chosen = entries
        .filter(
          (entry) =>
            entry.activity === activity &&
            entry.source === source &&
            !used.has(candidateKey(entry.candidate)),
        )
        .sort((left, right) => byPriority(left.candidate, right.candidate))[0]
      if (chosen) break
    }
    if (!chosen) break
    used.add(candidateKey(chosen.candidate))
    selected.push(chosen)
  }
}

function ensureFoundationItem(
  selected: CandidateEntry[],
  entries: readonly CandidateEntry[],
  used: Set<string>,
  currentStage: StageId,
): void {
  if (
    currentStage === 1 ||
    selected.some(({ candidate }) => candidate.stage < currentStage)
  ) {
    return
  }
  const foundation = entries
    .filter(
      ({ candidate }) =>
        candidate.stage < currentStage && !used.has(candidateKey(candidate)),
    )
    .sort((left, right) => byPriority(left.candidate, right.candidate))[0]
  if (!foundation || selected.length === 0) return
  let replaceIndex = selected.findLastIndex(
    (entry) =>
      entry.activity === foundation.activity &&
      entry.candidate.stage >= currentStage,
  )
  if (replaceIndex < 0) {
    replaceIndex = selected.findLastIndex(
      ({ candidate }) => candidate.stage >= currentStage,
    )
  }
  if (replaceIndex < 0) return
  used.delete(candidateKey(selected[replaceIndex].candidate))
  used.add(candidateKey(foundation.candidate))
  selected[replaceIndex] = foundation
}

function toSessionItem(
  entry: CandidateEntry,
  timing: SessionTimingPlan,
): SessionItem {
  return {
    id: entry.candidate.id,
    kind: entry.candidate.kind,
    refId: entry.candidate.refId,
    source: entry.source,
    estimatedMinutes: timing.secondsPerItem[entry.activity] / 60,
    stage: entry.candidate.stage,
    skillIds: [...entry.candidate.skillIds],
  }
}

export function dailyPlanItemCount(
  minutes: DailyMinutes,
  averageResponseTimeMs?: ResponseTimeAverages,
): number {
  const plan = createSessionTimingPlan({
    dailyMinutes: minutes,
    averageResponseTimeMs,
  })
  return TIMED_LEARNING_ACTIVITIES.reduce(
    (total, activity) => total + plan.counts[activity],
    0,
  )
}

export function generateDailyPlan(input: DailyPlanInput): DailyPlan {
  const now = input.now ?? new Date()
  const entries = toEntries(input)
  const timing = createSessionTimingPlan({
    dailyMinutes: input.dailyMinutes,
    averageResponseTimeMs: input.averageResponseTimeMs,
    availability: uniqueAvailability(entries),
  })
  const targetItemCount = TIMED_LEARNING_ACTIVITIES.reduce(
    (total, activity) => total + timing.counts[activity],
    0,
  )
  const sourceTargets = allocateByRatio(
    targetItemCount,
    chooseRatios(targetItemCount, input),
  )
  const selected: CandidateEntry[] = []
  const used = new Set<string>()
  for (const activity of TIMED_LEARNING_ACTIVITIES) {
    selectForActivity(
      activity,
      timing.counts[activity],
      entries,
      sourceTargets,
      selected,
      used,
    )
  }
  ensureFoundationItem(selected, entries, used, input.currentStage)

  const counts = selected.reduce<Counts>(
    (result, item) => ({
      ...result,
      [item.source]: result[item.source] + 1,
    }),
    { review: 0, weak: 0, new: 0 },
  )
  const activityCounts: SessionActivityCounts = {
    spellingReview: 0,
    spellingNew: 0,
    basicWriting: 0,
    shortWriting: 0,
    reflection: 1,
  }
  for (const entry of selected) activityCounts[entry.activity] += 1

  return {
    generatedAt: now.toISOString(),
    dailyMinutes: input.dailyMinutes,
    targetItemCount,
    counts,
    activityCounts,
    estimatedTotalMinutes: timing.totalEstimatedSeconds / 60,
    timing,
    items: selected.map((entry) => toSessionItem(entry, timing)),
  }
}
