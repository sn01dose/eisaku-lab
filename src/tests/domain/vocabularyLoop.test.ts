import { describe, expect, it } from 'vitest'
import { spellingWords, writingTaskIdsForWord } from '../../data'
import type { AppState, Attempt } from '../../domain/learner/types'
import { buildDailyCandidates } from '../../features/dailyPlan/buildCandidates'

function stateWithSpellingAttempt(at: string): AppState {
  const word = spellingWords.find((item) => item.word === 'study')
  if (!word) throw new Error('study spelling word is required')
  const attempt: Attempt = {
    id: 'attempt:spelling-reuse',
    at,
    kind: 'spelling',
    refId: word.id,
    isRecall: true,
    input: 'stady',
    correct: false,
    hintLevelUsed: 0,
    responseTimeMs: 20_000,
    errorTags: ['vowelChoice'],
    skillIds: word.skillIds,
  }
  return {
    schemaVersion: 1,
    profile: {
      nickname: 'test',
      dailyMinutes: 30,
      goal: 'university',
      useSpeech: false,
      targetDate: null,
      currentStage: 1,
      recommendedStage: 1,
      supportLevel: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    cards: {},
    attempts: [attempt],
    mastery: {} as AppState['mastery'],
    notes: [],
    essays: [],
    diagnostic: null,
    sessions: [],
  }
}

describe('spelling-to-writing vocabulary loop', () => {
  const now = new Date('2026-07-26T12:00:00.000Z')

  it('adds a writing task containing a recently missed spelling word', () => {
    const taskIds = writingTaskIdsForWord('study')
    expect(taskIds.length).toBeGreaterThan(0)
    const candidates = buildDailyCandidates(
      stateWithSpellingAttempt('2026-07-26T11:00:00.000Z'),
      now,
    )
    expect(
      candidates.weak.some(
        (candidate) =>
          candidate.kind === 'writing' && taskIds.includes(candidate.refId),
      ),
    ).toBe(true)
  })

  it('does not force the task after the 48-hour reuse window', () => {
    const taskIds = writingTaskIdsForWord('study')
    const candidates = buildDailyCandidates(
      stateWithSpellingAttempt('2026-07-24T11:59:59.000Z'),
      now,
    )
    expect(
      candidates.weak.some(
        (candidate) =>
          candidate.kind === 'writing' && taskIds.includes(candidate.refId),
      ),
    ).toBe(false)
  })
})
