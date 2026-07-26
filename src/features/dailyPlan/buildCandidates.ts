import { simplificationTasks } from '../../data/simplification'
import { writingTaskIdsForWord } from '../../data/index/wordToTasks'
import { spellingWords } from '../../data/spelling'
import { writingTasks } from '../../data/writing'
import type {
  AppState,
  SessionItem,
  SkillId,
  SpellingWord,
  WritingTask,
} from '../../domain/learner/types'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import {
  calculateResponseTimeAverages,
  TARGET_RESPONSE_SECONDS,
  type ResponseTimeAverages,
  type ResponseTimeSample,
  type TimedLearningActivity,
} from '../../domain/session/timing'

const SHORT_WRITING_TYPES = new Set<WritingTask['type']>([
  'outline',
  'paragraph',
  'timed',
  'summary',
])

const SPELLING_REUSE_WINDOW_MS = 48 * 60 * 60 * 1000

export function writingSessionActivity(
  type: WritingTask['type'],
): 'basicWriting' | 'shortWriting' {
  return SHORT_WRITING_TYPES.has(type) ? 'shortWriting' : 'basicWriting'
}

function candidate(
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

export function buildResponseTimeSamples(state: AppState): ResponseTimeSample[] {
  const writingById = new Map(writingTasks.map((item) => [item.id, item]))
  const seenSpelling = new Set<string>()
  const samples: ResponseTimeSample[] = []

  for (const attempt of state.attempts) {
    if (!Number.isFinite(attempt.responseTimeMs) || attempt.responseTimeMs <= 0) {
      continue
    }
    let activity: TimedLearningActivity | null = null
    if (attempt.kind === 'spelling') {
      activity = seenSpelling.has(attempt.refId)
        ? 'spellingReview'
        : 'spellingNew'
      seenSpelling.add(attempt.refId)
    } else if (attempt.kind === 'writing') {
      const task = writingById.get(attempt.refId)
      activity = task ? writingSessionActivity(task.type) : 'basicWriting'
    } else if (attempt.kind === 'simplification') {
      activity = 'basicWriting'
    }
    if (activity) {
      samples.push({ activity, responseTimeMs: attempt.responseTimeMs })
    }
  }
  return samples
}

export function buildResponseTimeAverages(
  state: AppState,
): ResponseTimeAverages {
  return calculateResponseTimeAverages(buildResponseTimeSamples(state))
}

function writingReuseCandidates(
  state: AppState,
  now: Date,
  stage: DailyPlanCandidate['stage'],
  spellingById: ReadonlyMap<string, SpellingWord>,
  writingById: ReadonlyMap<string, WritingTask>,
): DailyPlanCandidate[] {
  const words = state.attempts
    .filter((attempt) => {
      const ageMs = now.getTime() - new Date(attempt.at).getTime()
      return (
        attempt.kind === 'spelling' &&
        !attempt.correct &&
        ageMs >= 0 &&
        ageMs <= SPELLING_REUSE_WINDOW_MS
      )
    })
    .sort(
      (left, right) =>
        new Date(right.at).getTime() - new Date(left.at).getTime(),
    )
    .map((attempt) => spellingById.get(attempt.refId))
    .filter((word): word is SpellingWord => Boolean(word))

  const result = new Map<string, DailyPlanCandidate>()
  for (const word of words) {
    const maximumStage = Math.max(stage, word.stage)
    const task = writingTaskIdsForWord(word.word)
      .map((taskId) => writingById.get(taskId))
      .filter(
        (item): item is WritingTask =>
          item !== undefined && item.stage <= maximumStage,
      )
      .sort(
        (left, right) =>
          Number(SHORT_WRITING_TYPES.has(left.type)) -
            Number(SHORT_WRITING_TYPES.has(right.type)) ||
          Math.abs(left.stage - word.stage) - Math.abs(right.stage - word.stage) ||
          left.id.localeCompare(right.id),
      )[0]
    if (!task || result.has(task.id)) continue
    result.set(
      task.id,
      candidate(
        'writing',
        writingSessionActivity(task.type),
        task,
        1_000 - result.size,
      ),
    )
  }
  return [...result.values()]
}

export interface DailyCandidatePools {
  review: DailyPlanCandidate[]
  weak: DailyPlanCandidate[]
  newItems: DailyPlanCandidate[]
  averageResponseTimeMs: ResponseTimeAverages
}

export function buildDailyCandidates(
  state: AppState,
  now = new Date(),
): DailyCandidatePools {
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
      if (item) {
        review.push({
          ...candidate('spelling', 'spellingReview', item, card.lapses),
          dueAt: card.dueAt,
        })
      }
    } else if (card.kind === 'writing') {
      const item = writingById.get(card.refId)
      if (item) {
        review.push({
          ...candidate(
            'writing',
            writingSessionActivity(item.type),
            item,
            card.lapses,
          ),
          dueAt: card.dueAt,
        })
      }
    } else {
      const item = simplifyById.get(card.refId)
      if (item) {
        review.push({
          ...candidate(
            'simplification',
            'basicWriting',
            {
              ...item,
              skillIds: ['writing.japaneseSimplification'],
            },
            card.lapses,
          ),
          dueAt: card.dueAt,
        })
      }
    }
  }

  const weakMastery = Object.values(state.mastery)
    .filter((mastery) => mastery.score < 55 && !mastery.stable)
    .sort((left, right) => left.score - right.score)
  const weakSkills = new Set([
    ...weakMastery
      .filter(({ skillId }) => skillId.startsWith('spelling.'))
      .slice(0, 5)
      .map(({ skillId }) => skillId),
    ...weakMastery
      .filter(({ skillId }) => skillId.startsWith('writing.'))
      .slice(0, 7)
      .map(({ skillId }) => skillId),
  ])
  const reviewIds = new Set(review.map(({ refId }) => refId))
  const reuseWriting = writingReuseCandidates(
    state,
    now,
    stage,
    spellingById,
    writingById,
  ).filter((item) => !reviewIds.has(item.refId))
  const reuseWritingIds = new Set(reuseWriting.map(({ refId }) => refId))
  const weakSpelling = spellingWords
    .filter(
      (item) =>
        item.stage <= stage &&
        !reviewIds.has(item.id) &&
        item.skillIds.some((skill) => weakSkills.has(skill)),
    )
    .slice(0, 20)
    .map((item) =>
      candidate('spelling', 'spellingReview', item, 100 - item.stage),
    )
  const weakWriting = writingTasks
    .filter(
      (item) =>
        item.stage <= stage &&
        !reviewIds.has(item.id) &&
        !reuseWritingIds.has(item.id) &&
        item.requiredSkills.some((skill) => weakSkills.has(skill)),
    )
    .slice(0, 12)
    .map((item) =>
      candidate(
        'writing',
        writingSessionActivity(item.type),
        item,
        80 - item.stage,
      ),
    )
  const weak = [...reuseWriting, ...weakSpelling, ...weakWriting]
  const reservedIds = new Set(
    [...review, ...weak].map(({ refId }) => refId),
  )
  const eligibleNewWriting = writingTasks.filter(
    (item) =>
      item.stage === stage &&
      !attempted.has(item.id) &&
      !reservedIds.has(item.id),
  )
  const newWriting = [
    ...eligibleNewWriting
      .filter((item) => writingSessionActivity(item.type) === 'basicWriting')
      .slice(0, 24),
    ...eligibleNewWriting
      .filter((item) => writingSessionActivity(item.type) === 'shortWriting')
      .slice(0, 8),
  ]

  const newItems = [
    ...spellingWords
      .filter(
        (item) =>
          item.stage === stage &&
          !attempted.has(item.id) &&
          !reservedIds.has(item.id),
      )
      .slice(0, 30)
      .map((item) => candidate('spelling', 'spellingNew', item)),
    ...newWriting.map((item) =>
      candidate('writing', writingSessionActivity(item.type), item),
    ),
    ...simplificationTasks
      .filter(
        (item) =>
          item.stage === stage &&
          !attempted.has(item.id) &&
          !reservedIds.has(item.id),
      )
      .slice(0, 8)
      .map((item) =>
        candidate('simplification', 'basicWriting', {
          ...item,
          skillIds: ['writing.japaneseSimplification'],
        }),
      ),
  ]
  return {
    review,
    weak,
    newItems,
    averageResponseTimeMs: buildResponseTimeAverages(state),
  }
}
