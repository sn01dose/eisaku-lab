import { describe, expect, it } from 'vitest'
import type {
  AppState,
  LearnerProfile,
  SkillId,
  StageId,
} from '../../domain/learner/types'
import {
  addDays,
  buildStudyPlan,
  dateKey,
  STAGE_REQUIRED_SKILLS,
} from '../../domain/plan/buildStudyPlan'
import { refreshStudyPlan } from '../../domain/plan/refreshStudyPlan'
import type { StudyPlan } from '../../domain/plan/types'
import { createInitialState } from '../../services/storage/migrations'

const NOW = new Date('2026-07-26T12:00:00')
const TODAY = dateKey(NOW)

function profile(
  overrides: Partial<LearnerProfile> = {},
): LearnerProfile {
  return {
    nickname: '凪',
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

function basePlan(
  state: AppState,
  currentStage: StageId = 1,
): StudyPlan {
  return buildStudyPlan({
    targetDate: state.profile?.targetDate ?? addDays(TODAY, 90),
    currentStage,
    historyStartedAt: state.profile?.createdAt ?? NOW.toISOString(),
    sessions: state.sessions,
    attempts: state.attempts,
    mastery: state.mastery,
    now: NOW,
  })
}

function markStable(state: AppState, skillId: SkillId): void {
  state.mastery[skillId] = {
    ...state.mastery[skillId],
    stable: true,
    score: 100,
    correctDays: [
      addDays(TODAY, -4),
      addDays(TODAY, -2),
      TODAY,
    ],
    updatedAt: NOW.toISOString(),
  }
}

describe('学習計画の監査境界', () => {
  it('以前の持ち越し技能でも stable になれば除外する', () => {
    const state = createInitialState(NOW)
    state.profile = profile({ currentStage: 2 })
    markStable(state, 'writing.subjectVerb')
    const previousPlan: StudyPlan = {
      ...basePlan(state),
      carryOverSkills: ['writing.subjectVerb', 'writing.article'],
      stageWindows: [
        {
          stage: 1,
          startDate: addDays(TODAY, -10),
          endDate: TODAY,
          days: 5,
        },
      ],
    }

    const next = buildStudyPlan({
      targetDate: state.profile.targetDate ?? TODAY,
      currentStage: 2,
      historyStartedAt: state.profile.createdAt,
      sessions: state.sessions,
      attempts: state.attempts,
      mastery: state.mastery,
      previousPlan,
      now: NOW,
    })

    expect(next.carryOverSkills).not.toContain('writing.subjectVerb')
    expect(next.carryOverSkills).toContain('writing.article')
  })

  it('長期中断後は期限切れになった複数ステージを一度に進む', () => {
    const state = createInitialState(NOW)
    state.profile = profile()
    state.plan = {
      ...basePlan(state),
      stageWindows: [
        {
          stage: 1,
          startDate: addDays(TODAY, -20),
          endDate: addDays(TODAY, -10),
          days: 5,
        },
        {
          stage: 2,
          startDate: addDays(TODAY, -9),
          endDate: TODAY,
          days: 5,
        },
        {
          stage: 3,
          startDate: addDays(TODAY, 1),
          endDate: addDays(TODAY, 10),
          days: 5,
        },
      ],
    }

    const refreshed = refreshStudyPlan(state, NOW)

    expect(refreshed.profile?.currentStage).toBe(3)
    expect(
      refreshed.plan?.stageWindows.every(({ stage }) => stage >= 3),
    ).toBe(true)
    expect(refreshed.plan?.carryOverSkills).toContain(
      'writing.subjectVerb',
    )
    expect(refreshed.plan?.carryOverSkills).toContain(
      'writing.infinitive',
    )
  })

  it('短期計画では最初の配分ステージへ同期し、飛ばした弱点を残す', () => {
    const state = createInitialState(NOW)
    state.profile = profile({
      targetDate: addDays(TODAY, 30),
      createdAt: NOW.toISOString(),
    })
    markStable(state, 'spelling.shortVowel')

    const refreshed = refreshStudyPlan(state, NOW)
    const firstWindow = refreshed.plan?.stageWindows[0]

    expect(firstWindow?.stage).toBe(4)
    expect(refreshed.profile?.currentStage).toBe(firstWindow?.stage)
    expect(
      refreshed.plan?.stageWindows.every(
        ({ stage }) => stage >= (refreshed.profile?.currentStage ?? 1),
      ),
    ).toBe(true)

    const unstableSkippedSkills = ([1, 2, 3] as const)
      .flatMap((stage) => STAGE_REQUIRED_SKILLS[stage])
      .filter((skillId) => !state.mastery[skillId].stable)
    expect(
      unstableSkippedSkills.every((skillId) =>
        refreshed.plan?.carryOverSkills.includes(skillId),
      ),
    ).toBe(true)
    expect(refreshed.plan?.carryOverSkills).not.toContain(
      'spelling.shortVowel',
    )
  })
})
