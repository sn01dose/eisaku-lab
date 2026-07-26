import { describe, expect, it } from 'vitest'
import type {
  Attempt,
  ReviewCard,
  WritingTask,
} from '../../domain/learner/types'
import {
  buildWeeklySnapshot,
  countWordStableCards,
  isWordStableReviewCard,
  MAX_WEEKLY_SNAPSHOTS,
  refreshWeeklySnapshots,
  weekStartKey,
} from '../../domain/report/weeklySnapshot'
import { createInitialState } from '../../services/storage/migrations'

function localDate(
  year: number,
  month: number,
  day: number,
  hour = 12,
): Date {
  return new Date(year, month - 1, day, hour)
}

function stateWithProfile(createdAt = localDate(2026, 7, 13).toISOString()) {
  const state = createInitialState(localDate(2026, 7, 13))
  state.profile = {
    nickname: 'ハンギョドン',
    dailyMinutes: 30,
    goal: 'selective',
    useSpeech: false,
    targetDate: '2027-02-20',
    currentStage: 3,
    recommendedStage: 3,
    supportLevel: 4,
    createdAt,
  }
  return state
}

function attempt(
  id: string,
  at: Date,
  overrides: Partial<Attempt> = {},
): Attempt {
  return {
    id,
    at: at.toISOString(),
    kind: 'spelling',
    refId: 'sp-0001',
    isRecall: true,
    input: 'answer',
    correct: true,
    hintLevelUsed: 0,
    responseTimeMs: 30_000,
    errorTags: [],
    skillIds: ['spelling.shortVowel'],
    ...overrides,
  }
}

function spellingCard(
  refId: string,
  overrides: Partial<ReviewCard> = {},
): ReviewCard {
  return {
    id: `card:${refId}`,
    kind: 'spelling',
    refId,
    repetitions: 3,
    interval: 7,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewedAt: localDate(2026, 7, 19).toISOString(),
    dueAt: localDate(2026, 7, 26).toISOString(),
    lastResult: 'correct',
    hintCount: 0,
    responseTimeMs: 12_000,
    source: 'curriculum',
    ...overrides,
  }
}

const paragraphTask: WritingTask = {
  id: 'wr-report-paragraph',
  stage: 3,
  type: 'paragraph',
  promptJa: '学習方法について書いてください。',
  modelAnswers: [
    'I review what I learned every day.',
    'I study the same points again each day.',
  ],
  requiredSkills: ['writing.paragraphStructure'],
  commonErrors: ['article'],
  explanation: '短い文を正確につなぎます。',
  estimatedMinutes: 8,
  theme: '勉強法',
}

describe('word-level stable count', () => {
  it('3回以上かつ直近が自力正解のスペリングカードだけを数える', () => {
    const correct = spellingCard('sp-0001')
    const hinted = spellingCard('sp-0002', { lastResult: 'hinted' })
    const twice = spellingCard('sp-0003', { repetitions: 2 })
    const writing = spellingCard('wr-0001', { kind: 'writing' })

    expect(isWordStableReviewCard(correct)).toBe(true)
    expect(isWordStableReviewCard(hinted)).toBe(false)
    expect(isWordStableReviewCard(twice)).toBe(false)
    expect(isWordStableReviewCard(writing)).toBe(false)
    expect(
      countWordStableCards({
        [correct.id]: correct,
        [hinted.id]: hinted,
        [twice.id]: twice,
        [writing.id]: writing,
      }),
    ).toBe(1)
  })

  it('英作文の誤りから追加した語も同じ条件で数える', () => {
    const custom = spellingCard('custom:environment', {
      source: 'writingMistake',
    })
    expect(countWordStableCards({ [custom.id]: custom })).toBe(1)
  })
})

describe('buildWeeklySnapshot', () => {
  it('月曜から日曜までの集計値を生成する', () => {
    const state = stateWithProfile()
    state.cards = {
      'card:sp-0001': spellingCard('sp-0001'),
      'card:custom:environment': spellingCard('custom:environment', {
        source: 'writingMistake',
      }),
    }
    state.attempts = [
      attempt('sp-ok', localDate(2026, 7, 14, 10)),
      attempt('sp-wrong', localDate(2026, 7, 15, 10), {
        correct: false,
        errorTags: ['suffix'],
      }),
      attempt('writing', localDate(2026, 7, 15, 11), {
        kind: 'writing',
        refId: paragraphTask.id,
        responseTimeMs: 60_000,
        withinLimitWordCount: 78,
        totalWordCount: 82,
        errorTags: ['article', 'suffix'],
        skillIds: ['writing.paragraphStructure'],
      }),
    ]
    state.essays = [
      {
        id: 'essay-report',
        taskId: paragraphTask.id,
        stage: 3,
        answer: 'I review what I learned every day.',
        createdAt: localDate(2026, 7, 15, 11).toISOString(),
        updatedAt: localDate(2026, 7, 15, 11).toISOString(),
        feedback: null,
      },
    ]

    const snapshot = buildWeeklySnapshot(
      state,
      '2026-07-13',
      [paragraphTask],
    )

    expect(snapshot).toMatchObject({
      weekStart: '2026-07-13',
      studiedDays: 2,
      totalMinutes: 2,
      spellingAttempts: 2,
      spellingRecallAccuracy: 0.5,
      wordStableCount: 2,
      writingAttempts: 1,
      paragraphCount: 1,
      supportLevel: 4,
      withinLimitWordsAvg: 78,
      stage: 3,
    })
    expect(snapshot?.topErrorTags).toEqual([
      { tag: 'suffix', count: 2 },
      { tag: 'article', count: 1 },
    ])
  })
})

describe('refreshWeeklySnapshots', () => {
  it('週が切り替わるまでは保存せず、月曜に前週を生成する', () => {
    const state = stateWithProfile()
    state.attempts = [attempt('sp-ok', localDate(2026, 7, 14))]

    const sunday = refreshWeeklySnapshots(
      state,
      localDate(2026, 7, 19),
    )
    expect(sunday.weeklySnapshots).toHaveLength(0)

    const monday = refreshWeeklySnapshots(
      state,
      localDate(2026, 7, 20),
    )
    expect(monday.weeklySnapshots).toHaveLength(1)
    expect(monday.weeklySnapshots[0]).toMatchObject({
      weekStart: '2026-07-13',
      studiedDays: 1,
    })
  })

  it('26週を超えた履歴は古い週から除く', () => {
    const state = stateWithProfile(
      localDate(2025, 1, 6).toISOString(),
    )
    const refreshed = refreshWeeklySnapshots(
      state,
      localDate(2026, 7, 20),
    )

    expect(refreshed.weeklySnapshots).toHaveLength(
      MAX_WEEKLY_SNAPSHOTS,
    )
    expect(refreshed.weeklySnapshots[0].weekStart).toBe('2026-01-19')
    expect(refreshed.weeklySnapshots.at(-1)?.weekStart).toBe('2026-07-13')
  })

  it('週の起点を月曜日へ正規化する', () => {
    expect(weekStartKey(localDate(2026, 7, 20))).toBe('2026-07-20')
    expect(weekStartKey(localDate(2026, 7, 26))).toBe('2026-07-20')
  })
})
