import type { ReviewCard } from '../learner/types'

export type ReviewQuality = 1 | 2 | 3 | 4 | 5

export interface ReviewOutcome {
  correct: boolean
  usedHint: boolean
  retried: boolean
  responseTimeMs: number
  targetTimeMs: number
}

const MIN_EASE_FACTOR = 1.3
const MAX_EASE_FACTOR = 2.8

function clampEase(value: number): number {
  return Math.min(MAX_EASE_FACTOR, Math.max(MIN_EASE_FACTOR, value))
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function dueDate(reviewedAt: Date, interval: number): string {
  const due = startOfLocalDay(reviewedAt)
  due.setDate(due.getDate() + interval)
  return due.toISOString()
}

export function qualityFromOutcome(outcome: ReviewOutcome): ReviewQuality {
  if (!outcome.correct) return 1
  if (outcome.retried) return 2
  if (outcome.usedHint) return 3
  return outcome.responseTimeMs <= outcome.targetTimeMs ? 5 : 4
}

export function createReviewCard(input: {
  id?: string
  kind: ReviewCard['kind']
  refId: string
  source?: ReviewCard['source']
  now?: Date
}): ReviewCard {
  const now = input.now ?? new Date()
  return {
    id: input.id ?? `card:${input.refId}`,
    kind: input.kind,
    refId: input.refId,
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    lapses: 0,
    lastReviewedAt: null,
    dueAt: dueDate(now, 0),
    lastResult: null,
    hintCount: 0,
    responseTimeMs: null,
    source: input.source ?? 'curriculum',
  }
}

export function scheduleReview(
  card: ReviewCard,
  quality: ReviewQuality,
  reviewedAt = new Date(),
  metadata: { hintCount?: number; responseTimeMs?: number } = {},
): ReviewCard {
  let repetitions = card.repetitions
  let interval = card.interval
  let easeFactor = card.easeFactor
  let lapses = card.lapses

  if (quality >= 3) {
    repetitions += 1
    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }
    const distanceFromPerfect = 5 - quality
    easeFactor +=
      0.1 -
      distanceFromPerfect * (0.08 + distanceFromPerfect * 0.02)
  } else {
    repetitions = 0
    lapses += 1
    easeFactor -= 0.2
    interval = quality === 2 ? 1 : 0
  }

  const lastResult: ReviewCard['lastResult'] =
    quality >= 4
      ? 'correct'
      : quality === 3
        ? 'hinted'
        : quality === 2
          ? 'retried'
          : 'wrong'

  return {
    ...card,
    repetitions,
    interval,
    easeFactor: clampEase(easeFactor),
    lapses,
    lastReviewedAt: reviewedAt.toISOString(),
    dueAt: dueDate(reviewedAt, interval),
    lastResult,
    hintCount: metadata.hintCount ?? card.hintCount,
    responseTimeMs: metadata.responseTimeMs ?? card.responseTimeMs,
  }
}

export function applyReviewOutcome(
  card: ReviewCard,
  outcome: ReviewOutcome,
  reviewedAt = new Date(),
): ReviewCard {
  return scheduleReview(card, qualityFromOutcome(outcome), reviewedAt, {
    hintCount: outcome.usedHint ? Math.max(1, card.hintCount) : 0,
    responseTimeMs: outcome.responseTimeMs,
  })
}

export function boostEaseAfterWriting(
  card: ReviewCard,
  amount = 0.05,
): ReviewCard {
  return { ...card, easeFactor: clampEase(card.easeFactor + amount) }
}

export const REVIEW_EASE_LIMITS = {
  minimum: MIN_EASE_FACTOR,
  maximum: MAX_EASE_FACTOR,
} as const
