import type {
  Attempt,
  SessionLog,
  SkillId,
  SkillMastery,
  StageId,
} from '../learner/types'
import type { StageWindow, StudyPlan } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const STAGES = [1, 2, 3, 4, 5, 6] as const

export const STAGE_WEIGHT: Readonly<Record<StageId, number>> = {
  1: 0.8,
  2: 0.9,
  3: 1,
  4: 1.2,
  5: 1.3,
  6: 1.5,
}

export const STAGE_REQUIRED_SKILLS: Readonly<
  Record<StageId, readonly SkillId[]>
> = {
  1: [
    'spelling.shortVowel',
    'spelling.longVowel',
    'spelling.inflection',
    'writing.subjectVerb',
    'writing.wordOrder',
    'writing.tense',
    'writing.article',
    'writing.plural',
  ],
  2: [
    'spelling.vowelTeam',
    'spelling.doubleConsonant',
    'writing.infinitive',
    'writing.gerund',
    'writing.relativeClause',
  ],
  3: [
    'spelling.prefix',
    'spelling.suffix',
    'writing.connector',
    'writing.paragraphStructure',
  ],
  4: [
    'writing.japaneseSimplification',
    'writing.paraphrase',
    'writing.argument',
  ],
  5: [
    'spelling.wordFamily',
    'writing.argument',
    'writing.translation',
  ],
  6: [
    'spelling.irregular',
    'writing.summary',
    'writing.translation',
  ],
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function dateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function utcDay(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / DAY_MS
}

export function differenceInDays(later: string, earlier: string): number {
  return Math.round(utcDay(later) - utcDay(earlier))
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1, day + days))
  return [
    result.getUTCFullYear(),
    String(result.getUTCMonth() + 1).padStart(2, '0'),
    String(result.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function studyDateKeys(
  sessions: readonly SessionLog[],
  attempts: readonly Attempt[],
): string[] {
  return [
    ...sessions
      .filter(
        (session) =>
          session.status === 'completed' ||
          session.completedItemIds.length > 0,
      )
      .map((session) => session.plannedFor),
    ...attempts.map((attempt) => dateKey(new Date(attempt.at))),
  ]
}

export function calculateAttendanceRate(input: {
  today: string
  historyStartedAt: string
  studyDates: readonly string[]
}): number {
  const historyDays =
    differenceInDays(input.today, input.historyStartedAt.slice(0, 10)) + 1
  if (historyDays < 14) return 0.8
  const firstIncluded = addDays(input.today, -27)
  const recentDays = new Set(
    input.studyDates.filter(
      (day) => day >= firstIncluded && day <= input.today,
    ),
  )
  return clamp(recentDays.size / 28, 0.5, 1)
}

function stagesFrom(currentStage: StageId): StageId[] {
  return STAGES.filter((stage) => stage >= currentStage)
}

export function allocateStageDays(
  buildDays: number,
  currentStage: StageId,
): Array<{ stage: StageId; days: number }> {
  if (buildDays < 5) return []
  const stages = stagesFrom(currentStage)
  while (stages.length > 1 && stages.length * 5 > buildDays) stages.shift()
  if (stages.length * 5 > buildDays) return []

  const minimumDays = stages.length * 5
  const remaining = buildDays - minimumDays
  const weightTotal = stages.reduce(
    (total, stage) => total + STAGE_WEIGHT[stage],
    0,
  )
  const allocations = stages.map((stage) => {
    const exact = (remaining * STAGE_WEIGHT[stage]) / weightTotal
    return {
      stage,
      days: 5 + Math.floor(exact),
      remainder: exact - Math.floor(exact),
    }
  })
  let undistributed =
    buildDays - allocations.reduce((total, item) => total + item.days, 0)
  allocations
    .slice()
    .sort(
      (left, right) =>
        right.remainder - left.remainder || right.stage - left.stage,
    )
    .forEach((item) => {
      if (undistributed <= 0) return
      const target = allocations.find(({ stage }) => stage === item.stage)
      if (target) target.days += 1
      undistributed -= 1
    })
  return allocations.map(({ stage, days }) => ({ stage, days }))
}

function stageWindows(input: {
  allocations: ReadonlyArray<{ stage: StageId; days: number }>
  today: string
  finalPhaseStartDate: string
}): StageWindow[] {
  const totalEffectiveDays = input.allocations.reduce(
    (total, item) => total + item.days,
    0,
  )
  const availableCalendarDays = Math.max(
    0,
    differenceInDays(input.finalPhaseStartDate, input.today),
  )
  let cumulativeEffectiveDays = 0
  return input.allocations.map((allocation, index) => {
    const startOffset = Math.round(
      (cumulativeEffectiveDays / totalEffectiveDays) * availableCalendarDays,
    )
    cumulativeEffectiveDays += allocation.days
    const nextOffset =
      index === input.allocations.length - 1
        ? availableCalendarDays
        : Math.round(
            (cumulativeEffectiveDays / totalEffectiveDays) *
              availableCalendarDays,
          )
    return {
      stage: allocation.stage,
      startDate: addDays(input.today, startOffset),
      endDate: addDays(input.today, Math.max(startOffset, nextOffset - 1)),
      days: allocation.days,
    }
  })
}

function carryOverSkills(input: {
  previousPlan: StudyPlan | null
  mastery: Readonly<Record<SkillId, SkillMastery>>
  today: string
  skippedStages: readonly StageId[]
}): SkillId[] {
  const result = new Set(
    (input.previousPlan?.carryOverSkills ?? []).filter(
      (skillId) => !input.mastery[skillId]?.stable,
    ),
  )
  const addUnstableSkills = (stage: StageId) => {
    for (const skillId of STAGE_REQUIRED_SKILLS[stage]) {
      if (!input.mastery[skillId]?.stable) result.add(skillId)
    }
  }
  for (const window of input.previousPlan?.stageWindows ?? []) {
    if (window.endDate > input.today) continue
    addUnstableSkills(window.stage)
  }
  input.skippedStages.forEach(addUnstableSkills)
  return [...result]
}

function stagesSkippedByAllocation(
  currentStage: StageId,
  allocations: ReadonlyArray<{ stage: StageId }>,
): StageId[] {
  const firstAllocatedStage = allocations[0]?.stage
  if (!firstAllocatedStage || firstAllocatedStage <= currentStage) return []
  return STAGES.filter(
    (stage) => stage >= currentStage && stage < firstAllocatedStage,
  )
}

export interface BuildStudyPlanInput {
  targetDate: string
  currentStage: StageId
  historyStartedAt: string
  sessions: readonly SessionLog[]
  attempts: readonly Attempt[]
  mastery: Readonly<Record<SkillId, SkillMastery>>
  previousPlan?: StudyPlan | null
  now?: Date
}

export function buildStudyPlan(input: BuildStudyPlanInput): StudyPlan {
  const now = input.now ?? new Date()
  const today = dateKey(now)
  const remainingDays = Math.max(
    0,
    differenceInDays(input.targetDate, today),
  )
  const attendanceRate = calculateAttendanceRate({
    today,
    historyStartedAt: input.historyStartedAt,
    studyDates: studyDateKeys(input.sessions, input.attempts),
  })
  const effectiveDays = Math.floor(remainingDays * attendanceRate)
  let finalPhaseDays =
    effectiveDays === 0
      ? 0
      : Math.min(
          effectiveDays,
          clamp(Math.round(effectiveDays * 0.15), 7, 21),
        )
  if (effectiveDays - finalPhaseDays < 5) finalPhaseDays = effectiveDays
  const buildDays = effectiveDays - finalPhaseDays
  const finalPhaseStartDate =
    finalPhaseDays === 0
      ? today
      : addDays(input.targetDate, -(finalPhaseDays - 1))
  const allocations = allocateStageDays(buildDays, input.currentStage)

  return {
    generatedAt: now.toISOString(),
    targetDate: input.targetDate,
    remainingDays,
    attendanceRate,
    effectiveDays,
    phase: today >= finalPhaseStartDate ? 'final' : 'build',
    finalPhaseStartDate,
    stageWindows: stageWindows({
      allocations,
      today,
      finalPhaseStartDate,
    }),
    carryOverSkills: carryOverSkills({
      previousPlan: input.previousPlan ?? null,
      mastery: input.mastery,
      today,
      skippedStages: stagesSkippedByAllocation(
        input.currentStage,
        allocations,
      ),
    }),
  }
}
