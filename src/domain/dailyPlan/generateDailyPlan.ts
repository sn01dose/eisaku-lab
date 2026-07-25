import type {
  SessionItem,
  SkillId,
  StageId,
} from '../learner/types'

export interface DailyPlanCandidate {
  id: string
  kind: SessionItem['kind']
  refId: string
  stage: StageId
  skillIds: SkillId[]
  estimatedMinutes?: number
  priority?: number
  dueAt?: string
}

export interface DailyPlan {
  generatedAt: string
  dailyMinutes: 15 | 30 | 45
  targetItemCount: number
  counts: { review: number; weak: number; new: number }
  items: SessionItem[]
}

export interface DailyPlanInput {
  dailyMinutes: 15 | 30 | 45
  currentStage: StageId
  review: readonly DailyPlanCandidate[]
  weak: readonly DailyPlanCandidate[]
  newItems: readonly DailyPlanCandidate[]
  now?: Date
}

type Source = 'review' | 'weak' | 'new'
type Counts = Record<Source, number>

const BASE_RATIOS: Record<Source, number> = {
  review: 0.5,
  weak: 0.3,
  new: 0.2,
}

function allocateByRatio(total: number, ratios: Record<Source, number>): Counts {
  const sources: Source[] = ['review', 'weak', 'new']
  const exact = sources.map((source) => ({
    source,
    count: Math.floor(total * ratios[source]),
    remainder: total * ratios[source] - Math.floor(total * ratios[source]),
  }))
  let remaining = total - exact.reduce((sum, entry) => sum + entry.count, 0)
  exact.sort(
    (left, right) =>
      right.remainder - left.remainder ||
      sources.indexOf(left.source) - sources.indexOf(right.source),
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

function toSessionItem(
  candidate: DailyPlanCandidate,
  source: Source,
  defaultMinutes: number,
): SessionItem {
  return {
    id: candidate.id,
    kind: candidate.kind,
    refId: candidate.refId,
    source,
    estimatedMinutes: candidate.estimatedMinutes ?? defaultMinutes,
    stage: candidate.stage,
    skillIds: [...candidate.skillIds],
  }
}

export function dailyPlanItemCount(minutes: 15 | 30 | 45): number {
  return minutes / 3
}

export function generateDailyPlan(input: DailyPlanInput): DailyPlan {
  const now = input.now ?? new Date()
  const targetItemCount = dailyPlanItemCount(input.dailyMinutes)
  const requested = allocateByRatio(
    targetItemCount,
    chooseRatios(targetItemCount, input),
  )
  const pools: Record<Source, DailyPlanCandidate[]> = {
    review: [...input.review].sort(byPriority),
    weak: [...input.weak].sort(byPriority),
    new: [...input.newItems].sort(byPriority),
  }
  const selected: Array<{ candidate: DailyPlanCandidate; source: Source }> = []
  const used = new Set<string>()

  const take = (source: Source, count: number) => {
    for (const candidate of pools[source]) {
      if (count <= 0) break
      const key = candidateKey(candidate)
      if (used.has(key)) continue
      used.add(key)
      selected.push({ candidate, source })
      count -= 1
    }
  }

  for (const source of ['review', 'weak', 'new'] as const) {
    take(source, requested[source])
  }
  let remaining = targetItemCount - selected.length
  while (remaining > 0) {
    const before = selected.length
    for (const source of ['review', 'weak', 'new'] as const) {
      take(source, 1)
      if (selected.length > before) break
    }
    if (selected.length === before) break
    remaining -= 1
  }

  if (
    input.currentStage > 1 &&
    !selected.some(({ candidate }) => candidate.stage < input.currentStage)
  ) {
    const foundation = [...input.review, ...input.weak, ...input.newItems]
      .filter(
        (candidate) =>
          candidate.stage < input.currentStage &&
          !used.has(candidateKey(candidate)),
    )
      .sort(byPriority)[0]
    if (foundation && selected.length > 0) {
      const preferredIndex = selected.findLastIndex(
        ({ candidate, source }) =>
          source === 'new' && candidate.stage >= input.currentStage,
      )
      const replaceIndex =
        preferredIndex >= 0 ? preferredIndex : selected.length - 1
      selected[replaceIndex] = { candidate: foundation, source: 'review' }
    }
  }

  const counts = selected.reduce<Counts>(
    (result, item) => ({ ...result, [item.source]: result[item.source] + 1 }),
    { review: 0, weak: 0, new: 0 },
  )
  const defaultMinutes = input.dailyMinutes / Math.max(1, selected.length)
  return {
    generatedAt: now.toISOString(),
    dailyMinutes: input.dailyMinutes,
    targetItemCount,
    counts,
    items: selected.map(({ candidate, source }) =>
      toSessionItem(candidate, source, defaultMinutes),
    ),
  }
}
