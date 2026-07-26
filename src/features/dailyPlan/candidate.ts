import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import type {
  SessionItem,
  SkillId,
  WritingTask,
} from '../../domain/learner/types'
import {
  TARGET_RESPONSE_SECONDS,
  type TimedLearningActivity,
} from '../../domain/session/timing'

const SHORT_WRITING_TYPES = new Set<WritingTask['type']>([
  'outline',
  'paragraph',
  'timed',
  'summary',
])

export function writingSessionActivity(
  type: WritingTask['type'],
): 'basicWriting' | 'shortWriting' {
  return SHORT_WRITING_TYPES.has(type) ? 'shortWriting' : 'basicWriting'
}

export function candidate(
  kind: SessionItem['kind'],
  activity: TimedLearningActivity,
  item: {
    id: string
    stage: DailyPlanCandidate['stage']
    skillIds?: SkillId[]
    requiredSkills?: SkillId[]
  },
  priority = 0,
): DailyPlanCandidate {
  return {
    id: `plan:${kind}:${item.id}`,
    kind,
    activity,
    refId: item.id,
    stage: item.stage,
    skillIds: item.skillIds ?? item.requiredSkills ?? [],
    priority,
    estimatedMinutes: TARGET_RESPONSE_SECONDS[activity] / 60,
  }
}
