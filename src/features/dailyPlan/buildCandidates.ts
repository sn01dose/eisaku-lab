import {
  simplificationTasks,
  spellingWords,
  writingTasks,
} from '../../data'
import type {
  AppState,
  SessionItem,
  SkillId,
} from '../../domain/learner/types'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'

function candidate(
  kind: SessionItem['kind'],
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
    refId: item.id,
    stage: item.stage,
    skillIds: item.skillIds ?? item.requiredSkills ?? [],
    priority,
    estimatedMinutes: kind === 'writing' ? 4 : 2,
  }
}

export function buildDailyCandidates(state: AppState, now = new Date()): {
  review: DailyPlanCandidate[]
  weak: DailyPlanCandidate[]
  newItems: DailyPlanCandidate[]
} {
  const attempted = new Set(state.attempts.map((attempt) => attempt.refId))
  const stage = state.profile?.currentStage ?? 1
  const spellingById = new Map(spellingWords.map((item) => [item.id, item]))
  const writingById = new Map(writingTasks.map((item) => [item.id, item]))
  const simplifyById = new Map(simplificationTasks.map((item) => [item.id, item]))
  const review: DailyPlanCandidate[] = []

  for (const card of Object.values(state.cards)) {
    if (new Date(card.dueAt).getTime() > now.getTime()) continue
    if (card.kind === 'spelling') {
      const item = spellingById.get(card.refId)
      if (item) review.push({ ...candidate('spelling', item, card.lapses), dueAt: card.dueAt })
    } else if (card.kind === 'writing') {
      const item = writingById.get(card.refId)
      if (item) review.push({ ...candidate('writing', item, card.lapses), dueAt: card.dueAt })
    } else {
      const item = simplifyById.get(card.refId)
      if (item) {
        review.push({
          ...candidate('simplification', {
            ...item,
            skillIds: ['writing.japaneseSimplification'],
          }),
          dueAt: card.dueAt,
        })
      }
    }
  }

  const weakSkills = new Set(
    Object.values(state.mastery)
      .filter((mastery) => mastery.score < 55 && !mastery.stable)
      .sort((left, right) => left.score - right.score)
      .slice(0, 8)
      .map((mastery) => mastery.skillId),
  )
  const weak = [
    ...spellingWords
      .filter(
        (item) =>
          item.stage <= stage &&
          item.skillIds.some((skill) => weakSkills.has(skill)),
      )
      .slice(0, 20)
      .map((item) => candidate('spelling', item, 100 - item.stage)),
    ...writingTasks
      .filter(
        (item) =>
          item.stage <= stage &&
          item.requiredSkills.some((skill) => weakSkills.has(skill)),
      )
      .slice(0, 12)
      .map((item) => candidate('writing', item, 80 - item.stage)),
  ]
  const newItems = [
    ...spellingWords
      .filter((item) => item.stage === stage && !attempted.has(item.id))
      .slice(0, 30)
      .map((item) => candidate('spelling', item)),
    ...writingTasks
      .filter((item) => item.stage === stage && !attempted.has(item.id))
      .slice(0, 20)
      .map((item) => candidate('writing', item)),
    ...simplificationTasks
      .filter((item) => item.stage === stage && !attempted.has(item.id))
      .slice(0, 8)
      .map((item) =>
        candidate('simplification', {
          ...item,
          skillIds: ['writing.japaneseSimplification'],
        }),
      ),
  ]
  return { review, weak, newItems }
}
