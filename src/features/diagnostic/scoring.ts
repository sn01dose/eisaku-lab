import type {
  DiagnosticAnswer,
  DiagnosticItem,
} from '../../domain/learner/types'
import type { DiagnosticScoredResponse } from '../../domain/diagnostic/recommendation'
import { normalizeAnswer } from '../../domain/attempts/spellDiff'

export interface DiagnosticAnswerScore {
  correct: boolean
  score: number
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function normalizeDiagnosticText(value: string): string {
  return normalizeAnswer(value)
    .replace(/[.,!?;:"()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toText(input: string | string[]): string {
  return Array.isArray(input) ? input.join(' ') : input
}

function words(value: string): string[] {
  return normalizeDiagnosticText(value).match(/[a-z]+(?:'[a-z]+)?/g) ?? []
}

function sequenceSimilarity(left: string, right: string): number {
  const leftWords = words(left)
  const rightWords = words(right)
  if (leftWords.length === 0 || rightWords.length === 0) return 0
  const matrix = Array.from({ length: leftWords.length + 1 }, () =>
    Array.from({ length: rightWords.length + 1 }, () => 0),
  )
  for (let i = 1; i <= leftWords.length; i += 1) {
    for (let j = 1; j <= rightWords.length; j += 1) {
      matrix[i][j] =
        leftWords[i - 1] === rightWords[j - 1]
          ? matrix[i - 1][j - 1] + 1
          : Math.max(matrix[i - 1][j], matrix[i][j - 1])
    }
  }
  return (2 * matrix[leftWords.length][rightWords.length]) /
    (leftWords.length + rightWords.length)
}

function bestModelSimilarity(answer: string, models: readonly string[]): number {
  return models.reduce(
    (best, model) => Math.max(best, sequenceSimilarity(answer, model)),
    0,
  )
}

function sentenceMechanics(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const startsWithCapital = /^[A-Z]/.test(trimmed)
  const endsWithPunctuation = /[.!?]$/.test(trimmed)
  return (Number(startsWithCapital) + Number(endsWithPunctuation)) / 2
}

function hasLikelyClause(value: string): boolean {
  const tokens = words(value)
  const subjects = new Set([
    'i',
    'we',
    'you',
    'he',
    'she',
    'it',
    'they',
    'students',
    'people',
    'schools',
    'technology',
    'ai',
  ])
  const commonVerbs = new Set([
    'am',
    'is',
    'are',
    'was',
    'were',
    'be',
    'have',
    'has',
    'do',
    'does',
    'did',
    'can',
    'could',
    'should',
    'will',
    'would',
    'study',
    'learn',
    'use',
    'read',
    'think',
    'help',
    'make',
    'need',
  ])
  return (
    tokens.some((token) => subjects.has(token)) &&
    tokens.some(
      (token) =>
        commonVerbs.has(token) || token.endsWith('ed') || token.endsWith('ing'),
    )
  )
}

function scoreOpenAnswer(
  answer: string,
  item: Extract<DiagnosticItem, { section: 'shortOpinion' }>,
): DiagnosticAnswerScore {
  const answerWords = words(answer)
  const rubric = item.payload.rubric
  const targetMinimum = rubric?.minWords ?? 30
  const lengthScore = clamp(answerWords.length / targetMinimum)
  const checks = [
    hasLikelyClause(answer),
    sentenceMechanics(answer) >= 0.5,
  ]
  if (rubric?.needsReason) {
    checks.push(/\b(?:because|since|reason)\b/i.test(answer))
  }
  if (rubric?.needsExample) {
    checks.push(/\b(?:for example|for instance|such as)\b/i.test(answer))
  }
  if (rubric?.needsConclusion) {
    checks.push(/\b(?:therefore|thus|in conclusion|so)\b/i.test(answer))
  }
  const checklistScore =
    checks.filter(Boolean).length / Math.max(1, checks.length)
  const score = 0.55 * lengthScore + 0.45 * checklistScore
  return { correct: score >= 0.68, score }
}

export function scoreDiagnosticAnswer(
  item: DiagnosticItem,
  input: string | string[],
): DiagnosticAnswerScore {
  if (item.section === 'spellChoice') {
    const correct =
      normalizeAnswer(toText(input)) === normalizeAnswer(item.payload.answer)
    return { correct, score: correct ? 1 : 0 }
  }
  if (item.section === 'dictation' || item.section === 'fillLetters') {
    const correct =
      normalizeAnswer(toText(input)) === normalizeAnswer(item.payload.answer)
    return { correct, score: correct ? 1 : 0 }
  }
  if (item.section === 'chunking') {
    const actual = Array.isArray(input)
      ? input.map(normalizeAnswer)
      : input.split(/\s+/).filter(Boolean).map(normalizeAnswer)
    const expected = item.payload.answer.map(normalizeAnswer)
    const correct =
      actual.length === expected.length &&
      actual.every((chunk, index) => chunk === expected[index])
    const matchingPositions = actual.filter(
      (chunk, index) => chunk === expected[index],
    ).length
    return {
      correct,
      score: expected.length === 0 ? 0 : matchingPositions / expected.length,
    }
  }
  if (item.section === 'shortOpinion') {
    return scoreOpenAnswer(toText(input), item)
  }

  const answer = toText(input)
  const normalized = normalizeDiagnosticText(answer)
  const exact = item.payload.modelAnswers.some(
    (model) => normalizeDiagnosticText(model) === normalized,
  )
  if (exact) return { correct: true, score: 1 }
  const similarity = bestModelSimilarity(answer, item.payload.modelAnswers)
  const structure = hasLikelyClause(answer) ? 1 : 0
  const mechanics = sentenceMechanics(answer)
  const score = 0.72 * similarity + 0.18 * structure + 0.1 * mechanics
  return { correct: score >= 0.72, score }
}

export function buildScoredDiagnosticResponses(
  items: readonly DiagnosticItem[],
  answers: readonly DiagnosticAnswer[],
): DiagnosticScoredResponse[] {
  const answerById = new Map(answers.map((answer) => [answer.itemId, answer]))
  return items.flatMap((item) => {
    const answer = answerById.get(item.id)
    if (!answer) return []
    const result = scoreDiagnosticAnswer(item, answer.input)
    return [{ item, correct: result.correct, score: result.score }]
  })
}
