import { describe, expect, it } from 'vitest'
import type {
  Attempt,
  LearnerProfile,
  StageId,
} from '../../domain/learner/types'
import {
  addDays,
  buildStudyPlan,
  dateKey,
  differenceInDays,
} from '../../domain/plan/buildStudyPlan'
import { refreshStudyPlan } from '../../domain/plan/refreshStudyPlan'
import { generateDailyPlan } from '../../domain/dailyPlan/generateDailyPlan'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import { buildDailyCandidates } from '../../features/dailyPlan/buildCandidates'
import { createInitialState } from '../../services/storage/migrations'

const NOW = new Date('2026-07-26T12:00:00')
const TODAY = dateKey(NOW)

function attemptOn(day: string, index: number): Attempt {
  return {
    id: `attempt-${index}`,
    at: `${day}T12:00:00`,
    kind: 'writing',
    refId: 'wr-0001',
    isRecall: true,
    input: 'I study English.',
    correct: true,
    hintLevelUsed: 0,
    responseTimeMs: 60_000,
    errorTags: [],
    skillIds: ['writing.subjectVerb'],
  }
}

function attendanceAttempts(rate: 'full' | 'low'): Attempt[] {
  if (rate === 'low') return []
  return Array.from({ length: 28 }, (_, index) =>
    attemptOn(addDays(TODAY, index - 27), index),
  )
}

function planFor(
  remainingDays: number,
  options: { currentStage?: StageId; attendance?: 'full' | 'low' } = {},
) {
  const state = createInitialState(NOW)
  return buildStudyPlan({
    targetDate: addDays(TODAY, remainingDays),
    currentStage: options.currentStage ?? 1,
    historyStartedAt: addDays(TODAY, -40),
    sessions: [],
    attempts: attendanceAttempts(options.attendance ?? 'full'),
    mastery: state.mastery,
    now: NOW,
  })
}

function profile(overrides: Partial<LearnerProfile> = {}): LearnerProfile {
  return {
    nickname: 'ハンギョドン',
    dailyMinutes: 30,
    goal: 'selective',
    useSpeech: true,
    targetDate: addDays(TODAY, 90),
    currentStage: 1,
    recommendedStage: 1,
    supportLevel: 3,
    createdAt: `${addDays(TODAY, -40)}T12:00:00`,
    ...overrides,
  }
}

describe('buildStudyPlan', () => {
  it.each([180, 90, 30, 7])(
    'keeps stage and final allocations within %i effective days',
    (remainingDays) => {
      const plan = planFor(remainingDays)
      const stageDays = plan.stageWindows.reduce(
        (total, window) => total + window.days,
        0,
      )
      const finalDays =
        differenceInDays(plan.targetDate, plan.finalPhaseStartDate) + 1
      expect(stageDays + finalDays).toBe(plan.effectiveDays)
      expect(plan.remainingDays).toBe(remainingDays)
      expect(plan.stageWindows.every((window) => window.days >= 5)).toBe(true)
      expect(finalDays).toBeGreaterThanOrEqual(7)
      expect(finalDays).toBeLessThanOrEqual(21)
    },
  )

  it('does not allocate time to completed lower stages', () => {
    const plan = planFor(180, { currentStage: 4 })
    expect(plan.stageWindows.every((window) => window.stage >= 4)).toBe(true)
  })

  it('shrinks upper-stage time when attendance is lower', () => {
    const full = planFor(180)
    const low = planFor(180, { attendance: 'low' })
    const stageSixDays = (plan: typeof full) =>
      plan.stageWindows.find(({ stage }) => stage === 6)?.days ?? 0
    expect(low.attendanceRate).toBe(0.5)
    expect(stageSixDays(low)).toBeLessThan(stageSixDays(full))
  })

  it('carries unstable skills forward after a stage window ends', () => {
    const state = createInitialState(NOW)
    const previous = {
      ...planFor(90),
      stageWindows: [
        {
          stage: 1 as const,
          startDate: addDays(TODAY, -5),
          endDate: TODAY,
          days: 5,
        },
      ],
    }
    const next = buildStudyPlan({
      targetDate: addDays(TODAY, 89),
      currentStage: 2,
      historyStartedAt: addDays(TODAY, -40),
      sessions: [],
      attempts: attendanceAttempts('full'),
      mastery: state.mastery,
      previousPlan: previous,
      now: NOW,
    })
    expect(next.carryOverSkills).toContain('writing.subjectVerb')
    expect(next.carryOverSkills).toContain('spelling.shortVowel')
  })
})

describe('study-plan integration', () => {
  it('advances at a window deadline and keeps unstable skills', () => {
    const state = createInitialState(NOW)
    state.profile = profile()
    state.plan = {
      ...planFor(90),
      stageWindows: [
        {
          stage: 1,
          startDate: addDays(TODAY, -5),
          endDate: TODAY,
          days: 5,
        },
      ],
    }
    const refreshed = refreshStudyPlan(state, NOW)
    expect(refreshed.profile?.currentStage).toBe(2)
    expect(refreshed.plan?.carryOverSkills).toContain('writing.subjectVerb')
  })

  it('keeps the current behavior when targetDate is null', () => {
    const state = createInitialState(NOW)
    state.profile = profile({ targetDate: null })
    expect(refreshStudyPlan(state, NOW).plan).toBeNull()
    expect(buildDailyCandidates(state, NOW).newItems.length).toBeGreaterThan(0)
  })

  it('removes new work in the final phase and uses the 70/30 pools', () => {
    const state = createInitialState(NOW)
    state.profile = profile()
    state.plan = { ...planFor(7), phase: 'final' }
    const candidates = buildDailyCandidates(state, NOW)
    expect(candidates.newItems).toEqual([])
    const daily = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      phase: 'final',
      ...candidates,
      now: NOW,
    })
    expect(daily.counts.new).toBe(0)
    expect(daily.items.every((item) => item.source !== 'new')).toBe(true)
  })

  it('allocates 70% review and 30% weak work when both pools are sufficient', () => {
    const makePool = (
      prefix: string,
      count: number,
    ): DailyPlanCandidate[] =>
      Array.from({ length: count }, (_, index) => ({
        id: `plan:writing:${prefix}-${index}`,
        kind: 'writing',
        activity: index % 4 === 0 ? 'shortWriting' : 'basicWriting',
        refId: `${prefix}-${index}`,
        stage: 1,
        skillIds: ['writing.subjectVerb'],
      }))
    const daily = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      phase: 'final',
      review: makePool('review', 40),
      weak: makePool('weak', 40),
      newItems: makePool('new', 40),
      now: NOW,
    })
    const selected = daily.counts.review + daily.counts.weak

    expect(daily.counts.new).toBe(0)
    expect(daily.counts.review).toBe(Math.round(selected * 0.7))
    expect(daily.counts.weak).toBe(selected - daily.counts.review)
  })

  it('puts carry-over skills into the next weak pool', () => {
    const state = createInitialState(NOW)
    state.profile = profile({ currentStage: 6 })
    state.plan = {
      ...planFor(90, { currentStage: 6 }),
      carryOverSkills: ['writing.translation'],
    }
    const candidates = buildDailyCandidates(state, NOW)
    expect(candidates.weak.flatMap((item) => item.skillIds)).toContain(
      'writing.translation',
    )
  })
})
