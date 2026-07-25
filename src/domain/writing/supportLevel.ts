import type {
  SupportLevel,
  WritingErrorTag,
  WritingTaskType,
} from '../learner/types'

export type { SupportLevel } from '../learner/types'

export interface WritingAttemptOutcome {
  correct: boolean
  hintLevelUsed: number
  errorTags?: readonly WritingErrorTag[]
}

export interface SupportAdjustment {
  level: SupportLevel
  changed: boolean
  direction: 'lessSupport' | 'moreSupport' | 'unchanged'
  fallbackType: WritingTaskType | null
  miniLessonTriggerTag: WritingErrorTag | null
}

const SIMPLER_TASK: Partial<Record<WritingTaskType, WritingTaskType>> = {
  summary: 'outline',
  timed: 'paragraph',
  paragraph: 'outline',
  outline: 'deliteralize',
  combine: 'cloze',
  split: 'reorder',
  deliteralize: 'translateWithFrame',
  translatePlain: 'translateWithFrame',
  translateWithFrame: 'translateWithBank',
  translateWithBank: 'cloze',
  matching: 'reorder',
  cloze: 'reorder',
}

function clampLevel(value: number): SupportLevel {
  return Math.min(5, Math.max(1, value)) as SupportLevel
}

export function findRepeatedErrorTag(
  outcomes: readonly WritingAttemptOutcome[],
): WritingErrorTag | null {
  if (outcomes.length < 3) return null
  const recent = outcomes.slice(-3)
  const firstTags = recent[0].errorTags ?? []
  return (
    firstTags.find((tag) =>
      recent.every((outcome) => outcome.errorTags?.includes(tag)),
    ) ?? null
  )
}

export function simplerWritingTaskType(
  type: WritingTaskType,
): WritingTaskType {
  return SIMPLER_TASK[type] ?? type
}

export function adjustWritingSupport(input: {
  currentLevel: SupportLevel
  recentOutcomes: readonly WritingAttemptOutcome[]
  currentTaskType?: WritingTaskType
}): SupportAdjustment {
  const lastThree = input.recentOutcomes.slice(-3)
  const lastTwo = input.recentOutcomes.slice(-2)
  const earnedLessSupport =
    lastThree.length === 3 &&
    lastThree.every(
      (outcome) => outcome.correct && outcome.hintLevelUsed === 0,
    )
  const needsMoreSupport =
    lastTwo.length === 2 && lastTwo.every((outcome) => !outcome.correct)

  let level = input.currentLevel
  let direction: SupportAdjustment['direction'] = 'unchanged'
  if (earnedLessSupport) {
    level = clampLevel(input.currentLevel + 1)
    if (level !== input.currentLevel) direction = 'lessSupport'
  } else if (needsMoreSupport) {
    level = clampLevel(input.currentLevel - 1)
    if (level !== input.currentLevel) direction = 'moreSupport'
  }

  return {
    level,
    changed: level !== input.currentLevel,
    direction,
    fallbackType:
      needsMoreSupport && input.currentTaskType
        ? simplerWritingTaskType(input.currentTaskType)
        : null,
    miniLessonTriggerTag: findRepeatedErrorTag(input.recentOutcomes),
  }
}

export const nextSupportLevel = adjustWritingSupport
