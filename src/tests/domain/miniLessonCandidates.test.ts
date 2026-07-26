import { describe, expect, it } from 'vitest'
import { miniLessons } from '../../data/lessons'
import { generateDailyPlan } from '../../domain/dailyPlan/generateDailyPlan'
import type {
  MistakeNote,
  SpellingErrorTag,
} from '../../domain/learner/types'
import { buildDailyCandidates } from '../../features/dailyPlan/buildCandidates'
import { createInitialState } from '../../services/storage'

const NOW = new Date('2026-07-26T12:00:00.000Z')

function mistakeNote(
  id: string,
  tag: SpellingErrorTag,
  occurrenceCount: number,
  conquered = false,
): MistakeNote {
  return {
    id,
    at: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    kind: 'spelling',
    refId: `sp-${id}`,
    input: '',
    correction: '',
    primaryErrorTag: tag,
    errorTags: [tag],
    skillIds: [],
    occurrenceCount,
    conquered,
    reviewCardId: null,
  }
}

describe('日次計画のミニレッスン候補', () => {
  it('未克服の同一タグが累計3回未満なら追加しない', () => {
    const state = createInitialState(NOW)
    state.notes = [
      mistakeNote('note-1', 'vowelChoice', 1),
      mistakeNote('note-2', 'vowelChoice', 1),
      mistakeNote('note-conquered', 'vowelChoice', 10, true),
    ]

    const candidates = buildDailyCandidates(state, NOW)
    expect(
      candidates.weak.filter(({ kind }) => kind === 'miniLesson'),
    ).toEqual([])
  })

  it('累計3回以上なら必須候補を1本だけ追加し、計画にも1本だけ入れる', () => {
    const state = createInitialState(NOW)
    state.notes = [
      mistakeNote('note-1', 'vowelChoice', 1),
      mistakeNote('note-2', 'vowelChoice', 2),
      mistakeNote('note-3', 'omission', 4),
    ]

    const candidates = buildDailyCandidates(state, NOW)
    const lessonCandidates = candidates.weak.filter(
      ({ kind }) => kind === 'miniLesson',
    )
    expect(lessonCandidates).toHaveLength(1)
    expect(lessonCandidates[0]).toMatchObject({
      activity: 'basicWriting',
      mandatory: true,
    })
    expect(lessonCandidates[0]?.priority).toBeGreaterThan(1_000)
    const selectedLesson = miniLessons.find(
      ({ id }) => id === lessonCandidates[0]?.refId,
    )
    expect(selectedLesson).toBeDefined()
    expect(
      selectedLesson?.triggerTags.some((tag) =>
        ['vowelChoice', 'omission'].includes(tag),
      ),
    ).toBe(true)

    const plan = generateDailyPlan({
      dailyMinutes: 30,
      currentStage: 1,
      ...candidates,
      now: NOW,
    })
    expect(plan.items.filter(({ kind }) => kind === 'miniLesson')).toHaveLength(
      1,
    )
  })
})
