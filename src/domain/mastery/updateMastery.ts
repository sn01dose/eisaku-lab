import {
  ALL_SKILL_IDS,
  type Attempt,
  type SkillId,
  type SkillMastery,
} from '../learner/types'

export type MasteryResult = 'correct' | 'hinted' | 'wrong'

export interface MasteryEvent {
  at: string | Date
  result: MasteryResult
  isRecall: boolean
  repeatedError?: boolean
  responseTimeMs?: number
  targetTimeMs?: number
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

function localDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function elapsedCalendarDays(first: string, last: string): number {
  const firstParts = first.split('-').map(Number)
  const lastParts = last.split('-').map(Number)
  const firstUtc = Date.UTC(firstParts[0], firstParts[1] - 1, firstParts[2])
  const lastUtc = Date.UTC(lastParts[0], lastParts[1] - 1, lastParts[2])
  return Math.floor((lastUtc - firstUtc) / 86_400_000)
}

export function isStableMastery(correctDays: readonly string[]): boolean {
  const uniqueDays = Array.from(new Set(correctDays)).sort()
  if (uniqueDays.length < 3) return false
  return elapsedCalendarDays(uniqueDays[0], uniqueDays.at(-1) ?? uniqueDays[0]) >= 2
}

export function createSkillMastery(
  skillId: SkillId,
  now = new Date(),
): SkillMastery {
  return {
    skillId,
    score: 0,
    correctDays: [],
    stable: false,
    updatedAt: now.toISOString(),
  }
}

export function createMasteryRecord(
  now = new Date(),
): Record<SkillId, SkillMastery> {
  return Object.fromEntries(
    ALL_SKILL_IDS.map((skillId) => [
      skillId,
      createSkillMastery(skillId, now),
    ]),
  ) as Record<SkillId, SkillMastery>
}

export function updateSkillMastery(
  current: SkillMastery,
  event: MasteryEvent,
): SkillMastery {
  const base = event.result === 'wrong' && event.repeatedError
    ? -9
    : event.result === 'correct'
      ? 8
      : event.result === 'hinted'
        ? 3
        : -6
  const recallWeight = event.isRecall ? 1 : 0.4
  const receivesTimeBonus =
    event.result === 'correct' &&
    event.responseTimeMs !== undefined &&
    event.targetTimeMs !== undefined &&
    event.targetTimeMs > 0 &&
    event.responseTimeMs <= event.targetTimeMs * 0.6
  const delta = base * recallWeight + (receivesTimeBonus ? 2 : 0)
  const at = event.at instanceof Date ? event.at : new Date(event.at)
  const correctDays =
    event.result === 'wrong'
      ? [...current.correctDays]
      : Array.from(new Set([...current.correctDays, localDateKey(at)])).sort()

  return {
    ...current,
    score: clampScore(current.score + delta),
    correctDays,
    stable: isStableMastery(correctDays),
    updatedAt: at.toISOString(),
  }
}

export function updateMasteryFromAttempt(
  mastery: Record<SkillId, SkillMastery>,
  attempt: Attempt,
  options: {
    repeatedErrorTags?: ReadonlySet<string>
    targetTimeMs?: number
  } = {},
): Record<SkillId, SkillMastery> {
  const result: MasteryResult = !attempt.correct
    ? 'wrong'
    : attempt.hintLevelUsed > 0
      ? 'hinted'
      : 'correct'
  const repeatedError =
    !attempt.correct &&
    attempt.errorTags.some((tag) => options.repeatedErrorTags?.has(tag))
  const next = { ...mastery }
  for (const skillId of attempt.skillIds) {
    next[skillId] = updateSkillMastery(
      mastery[skillId] ?? createSkillMastery(skillId, new Date(attempt.at)),
      {
        at: attempt.at,
        result,
        isRecall: attempt.isRecall,
        repeatedError,
        responseTimeMs: attempt.responseTimeMs,
        targetTimeMs: options.targetTimeMs,
      },
    )
  }
  return next
}
