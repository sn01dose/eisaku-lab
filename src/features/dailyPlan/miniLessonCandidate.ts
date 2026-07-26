import { miniLessons } from '../../data/lessons'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import type {
  MistakeNote,
  StageId,
} from '../../domain/learner/types'
import { candidate } from './candidate'

const MINI_LESSON_TRIGGER_COUNT = 3
const MINI_LESSON_PRIORITY = 5_000

interface TagOccurrences {
  tag: MistakeNote['primaryErrorTag']
  count: number
  firstSeen: number
}

export function buildTriggeredMiniLessonCandidate(
  notes: readonly MistakeNote[],
  stage: StageId,
): DailyPlanCandidate | null {
  const occurrences = new Map<
    MistakeNote['primaryErrorTag'],
    TagOccurrences
  >()

  notes.forEach((note, index) => {
    if (note.conquered) return
    const current = occurrences.get(note.primaryErrorTag)
    occurrences.set(note.primaryErrorTag, {
      tag: note.primaryErrorTag,
      count:
        (current?.count ?? 0) +
        Math.max(0, Math.floor(note.occurrenceCount)),
      firstSeen: current?.firstSeen ?? index,
    })
  })

  const repeatedTags = [...occurrences.values()]
    .filter(({ count }) => count >= MINI_LESSON_TRIGGER_COUNT)
    .sort(
      (left, right) =>
        right.count - left.count || left.firstSeen - right.firstSeen,
    )

  for (const { tag } of repeatedTags) {
    const lesson = miniLessons.find(({ triggerTags }) =>
      triggerTags.some((triggerTag) => triggerTag === tag),
    )
    if (!lesson) continue
    return {
      ...candidate(
        'miniLesson',
        'basicWriting',
        { ...lesson, stage },
        MINI_LESSON_PRIORITY,
      ),
      mandatory: true,
    }
  }

  return null
}
