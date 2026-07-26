import { describe, expect, it } from 'vitest'
import { writingTasks } from '../../data/writing'
import type {
  AppState,
  Attempt,
  LearnerProfile,
} from '../../domain/learner/types'
import { generateDailyPlan } from '../../domain/dailyPlan/generateDailyPlan'
import { createInitialState } from '../../services/storage'
import {
  buildDailyCandidates,
  buildResponseTimeAverages,
  writingSessionActivity,
} from '../../features/dailyPlan/buildCandidates'

const profile: LearnerProfile = {
  nickname: '凪',
  dailyMinutes: 30,
  goal: 'university',
  useSpeech: false,
  targetDate: null,
  currentStage: 1,
  recommendedStage: 1,
  supportLevel: 1,
  createdAt: '2026-07-01T00:00:00.000Z',
}

function stateWithProfile(): AppState {
  return { ...createInitialState(new Date('2026-07-01T00:00:00.000Z')), profile }
}

function attempt(
  id: string,
  kind: Attempt['kind'],
  refId: string,
  responseTimeMs: number,
): Attempt {
  return {
    id,
    at: `2026-07-${String(Number(id.replace(/\D/g, '')) + 1).padStart(2, '0')}T00:00:00.000Z`,
    kind,
    refId,
    isRecall: true,
    input: 'answer',
    correct: true,
    hintLevelUsed: 0,
    responseTimeMs,
    errorTags: [],
    skillIds: [],
  }
}

describe('buildDailyCandidates', () => {
  it('初期状態でも30分の各種目候補を構成する', () => {
    const state = stateWithProfile()
    const pools = buildDailyCandidates(
      state,
      new Date('2026-07-20T00:00:00.000Z'),
    )
    const all = [...pools.review, ...pools.weak, ...pools.newItems]
    const count = (activity: NonNullable<(typeof all)[number]['activity']>) =>
      new Set(
        all
          .filter((candidate) => candidate.activity === activity)
          .map(({ refId }) => refId),
      ).size

    expect(count('spellingReview')).toBeGreaterThanOrEqual(12)
    expect(count('spellingNew')).toBeGreaterThanOrEqual(10)
    expect(count('basicWriting')).toBeGreaterThanOrEqual(7)
    expect(count('shortWriting')).toBeGreaterThanOrEqual(2)

    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      ...pools,
    })
    expect(plan.activityCounts).toEqual({
      spellingReview: 12,
      spellingNew: 10,
      basicWriting: 7,
      shortWriting: 2,
      reflection: 1,
    })
  })

  it('作文形式を基本英文と短い英作文に分ける', () => {
    expect(writingSessionActivity('reorder')).toBe('basicWriting')
    expect(writingSessionActivity('translatePlain')).toBe('basicWriting')
    expect(writingSessionActivity('paragraph')).toBe('shortWriting')
    expect(writingSessionActivity('timed')).toBe('shortWriting')
  })
})

describe('buildResponseTimeAverages', () => {
  it('単語の初回を新規、2回目以降を復習として移動平均に渡す', () => {
    const state = stateWithProfile()
    state.attempts = [
      attempt('a1', 'spelling', 'sp-0001', 20_000),
      attempt('a2', 'spelling', 'sp-0001', 40_000),
      attempt('a3', 'spelling', 'sp-0002', 30_000),
      attempt('a4', 'spelling', 'sp-0001', 60_000),
    ]
    const averages = buildResponseTimeAverages(state)
    expect(averages.spellingNew).toBe(25_000)
    expect(averages.spellingReview).toBe(50_000)
  })

  it('作文を教材形式に応じた種目へ集計する', () => {
    const basic = writingTasks.find(
      ({ type }) => writingSessionActivity(type) === 'basicWriting',
    )
    const short = writingTasks.find(
      ({ type }) => writingSessionActivity(type) === 'shortWriting',
    )
    expect(basic).toBeDefined()
    expect(short).toBeDefined()
    const state = stateWithProfile()
    state.attempts = [
      attempt('a1', 'writing', basic?.id ?? '', 70_000),
      attempt('a2', 'writing', short?.id ?? '', 240_000),
      attempt('a3', 'simplification', 'sj-0001', 90_000),
    ]
    const averages = buildResponseTimeAverages(state)
    expect(averages.basicWriting).toBe(80_000)
    expect(averages.shortWriting).toBe(240_000)
  })
})
