import { simplificationTasks } from '../../data/simplification'
import { spellingWords } from '../../data/spelling'
import { writingTasks } from '../../data/writing'
import type {
  AppState,
  WritingErrorTag,
} from '../../domain/learner/types'
import type { DailyPlanCandidate } from '../../domain/dailyPlan/generateDailyPlan'
import {
  calculateResponseTimeAverages,
  type ResponseTimeAverages,
  type ResponseTimeSample,
  type TimedLearningActivity,
} from '../../domain/session/timing'
import { candidate, writingSessionActivity } from './candidate'
import {
  buildFinalPhaseWeakCandidates,
  prioritizeFinalPhaseReview,
} from './finalPhaseCandidates'
import { buildTriggeredMiniLessonCandidate } from './miniLessonCandidate'
import { writingReuseCandidates } from './writingReuseCandidates'

export { writingSessionActivity } from './candidate'

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
  const availableSpellingWords = [
    ...spellingWords,
    ...Object.values(state.customSpellingWords),
  ]
  const finalPhase = state.plan?.phase === 'final'
  const recentWrongCutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000
  const recentWrongSpelling = new Map<string, number>()
  for (const attempt of state.attempts) {
    if (
      attempt.kind !== 'spelling' ||
      attempt.correct ||
      new Date(attempt.at).getTime() < recentWrongCutoff
    ) {
      continue
    }
    recentWrongSpelling.set(
      attempt.refId,
      (recentWrongSpelling.get(attempt.refId) ?? 0) + 1,
    )
  }
  const spellingById = new Map(
    availableSpellingWords.map((item) => [item.id, item]),
  )
  const writingById = new Map(writingTasks.map((item) => [item.id, item]))
  const simplifyById = new Map(simplificationTasks.map((item) => [item.id, item]))
  const review: DailyPlanCandidate[] = []

  for (const card of Object.values(state.cards)) {
    const due = new Date(card.dueAt).getTime() <= now.getTime()
    const finalSpellingPriority =
      finalPhase && card.kind === 'spelling' && card.lapses > 0
    if (!due && !finalSpellingPriority) continue
    if (card.kind === 'spelling') {
      const item = spellingById.get(card.refId)
      if (item) {
        review.push({
          ...candidate(
            'spelling',
            'spellingReview',
            item,
            card.lapses * 100 +
              (recentWrongSpelling.get(card.refId) ?? 0) * 10,
          ),
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

  if (finalPhase) {
    prioritizeFinalPhaseReview({
      state,
      now,
      review,
      spellingById,
      writingById,
      simplifyById,
    })
  }

  const weakMastery = Object.values(state.mastery)
    .filter((mastery) => mastery.score < 55 && !mastery.stable)
    .sort((left, right) => left.score - right.score)
  const carryOverSkills = new Set(state.plan?.carryOverSkills ?? [])
  const weakSkills = new Set([
    ...carryOverSkills,
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
  const finalCandidates = finalPhase
    ? buildFinalPhaseWeakCandidates({
        state,
        stage,
        reviewIds,
        recentWrongSpelling,
        spellingById,
        writingById,
      })
    : { writing: [], recentWrongSpelling: [] }
  const weakSpelling = availableSpellingWords
    .filter(
      (item) =>
        item.stage <= stage &&
        !reviewIds.has(item.id) &&
        item.skillIds.some((skill) => weakSkills.has(skill)),
    )
    .sort(
      (left, right) =>
        Number(right.skillIds.some((skill) => carryOverSkills.has(skill))) -
          Number(left.skillIds.some((skill) => carryOverSkills.has(skill))) ||
        left.stage - right.stage ||
        left.id.localeCompare(right.id),
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
    .sort(
      (left, right) =>
        Number(
          right.requiredSkills.some((skill) => carryOverSkills.has(skill)),
        ) -
          Number(
            left.requiredSkills.some((skill) => carryOverSkills.has(skill)),
          ) ||
        left.stage - right.stage ||
        left.id.localeCompare(right.id),
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
  const noteErrorTags = new Set<WritingErrorTag>(
    state.notes
      .filter(
        (note) =>
          !note.conquered &&
          [
            'missingSubject',
            'missingVerb',
            'wordOrder',
            'tense',
            'thirdPersonS',
            'number',
            'article',
            'pronoun',
            'preposition',
            'conjunction',
            'fragment',
            'runOn',
            'literalTranslation',
            'wordChoice',
            'spelling',
            'punctuation',
            'capitalization',
          ].includes(note.primaryErrorTag),
      )
      .map((note) => note.primaryErrorTag as WritingErrorTag),
  )
  const feedbackWriting = writingTasks
    .filter(
      (item) =>
        item.stage <= stage &&
        item.commonErrors.some((tag) => noteErrorTags.has(tag)) &&
        !reviewIds.has(item.id) &&
        !reuseWritingIds.has(item.id),
    )
    .slice(0, 12)
    .map((item) =>
      candidate(
        'writing',
        writingSessionActivity(item.type),
        item,
        700,
      ),
    )
  const miniLessonCandidate = buildTriggeredMiniLessonCandidate(
    state.notes,
    stage,
  )
  const weakByRef = new Map<string, DailyPlanCandidate>()
  for (const item of [
    ...(miniLessonCandidate ? [miniLessonCandidate] : []),
    ...finalCandidates.writing,
    ...feedbackWriting,
    ...reuseWriting,
    ...finalCandidates.recentWrongSpelling,
    ...weakSpelling,
    ...weakWriting,
  ]) {
    const current = weakByRef.get(item.refId)
    if (!current || (item.priority ?? 0) > (current.priority ?? 0)) {
      weakByRef.set(item.refId, item)
    }
  }
  const weak = [...weakByRef.values()]
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

  const newItems = finalPhase
    ? []
    : [
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
