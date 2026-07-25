import type {
  DiagnosticItem,
  SkillId,
  StageId,
} from '../learner/types'

export interface DiagnosticScoredResponse {
  item: DiagnosticItem
  correct: boolean
  score?: number
}

export interface DiagnosticSectionResult {
  section: DiagnosticItem['section']
  earned: number
  possible: number
  rate: number
}

export interface DiagnosticRecommendation {
  recommendedStage: StageId
  overallRate: number
  stageRates: Partial<Record<StageId, number>>
  sectionResults: DiagnosticSectionResult[]
}

const SKILL_STAGE: Record<SkillId, StageId> = {
  'spelling.shortVowel': 1,
  'spelling.longVowel': 1,
  'spelling.vowelTeam': 1,
  'spelling.silentLetter': 1,
  'spelling.doubleConsonant': 1,
  'spelling.inflection': 1,
  'spelling.prefix': 2,
  'spelling.suffix': 2,
  'spelling.wordFamily': 3,
  'spelling.irregular': 3,
  'writing.subjectVerb': 1,
  'writing.wordOrder': 1,
  'writing.tense': 1,
  'writing.agreement': 1,
  'writing.article': 1,
  'writing.plural': 1,
  'writing.infinitive': 2,
  'writing.gerund': 2,
  'writing.relativeClause': 2,
  'writing.connector': 3,
  'writing.paragraphStructure': 3,
  'writing.paraphrase': 4,
  'writing.japaneseSimplification': 4,
  'writing.argument': 4,
  'writing.summary': 6,
  'writing.translation': 5,
}

const SECTIONS: DiagnosticItem['section'][] = [
  'spellChoice',
  'dictation',
  'fillLetters',
  'chunking',
  'basicTranslate',
  'reorder',
  'shortOpinion',
]

function clampRate(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function diagnosticItemStage(item: DiagnosticItem): StageId {
  return item.skillIds.reduce<StageId>(
    (highest, skillId) =>
      Math.max(highest, SKILL_STAGE[skillId]) as StageId,
    1,
  )
}

export function recommendStageFromRate(rate: number): StageId {
  const normalized = clampRate(rate)
  if (normalized < 0.45) return 1
  if (normalized < 0.6) return 2
  if (normalized < 0.72) return 3
  if (normalized < 0.82) return 4
  if (normalized < 0.9) return 5
  return 6
}

export function recommendDiagnosticStage(
  responses: readonly DiagnosticScoredResponse[],
): DiagnosticRecommendation {
  const normalizedResponses = responses.map((response) => ({
    ...response,
    score: clampRate(response.score ?? (response.correct ? 1 : 0)),
  }))
  const earned = normalizedResponses.reduce(
    (total, response) => total + response.score,
    0,
  )
  const overallRate =
    normalizedResponses.length === 0 ? 0 : earned / normalizedResponses.length

  const stageRates: Partial<Record<StageId, number>> = {}
  for (const stage of [1, 2, 3, 4, 5, 6] as const) {
    const atStage = normalizedResponses.filter(
      ({ item }) => diagnosticItemStage(item) === stage,
    )
    if (atStage.length > 0) {
      stageRates[stage] =
        atStage.reduce((total, response) => total + response.score, 0) /
        atStage.length
    }
  }

  let recommendedStage = recommendStageFromRate(overallRate)
  for (const stage of [1, 2, 3, 4, 5] as const) {
    const rate = stageRates[stage]
    if (rate !== undefined && rate < 0.6) {
      recommendedStage = Math.min(recommendedStage, stage) as StageId
      break
    }
  }

  const sectionResults = SECTIONS.flatMap((section) => {
    const inSection = normalizedResponses.filter(
      ({ item }) => item.section === section,
    )
    if (inSection.length === 0) return []
    const sectionEarned = inSection.reduce(
      (total, response) => total + response.score,
      0,
    )
    return [
      {
        section,
        earned: sectionEarned,
        possible: inSection.length,
        rate: sectionEarned / inSection.length,
      },
    ]
  })

  return {
    recommendedStage,
    overallRate,
    stageRates,
    sectionResults,
  }
}

export const recommendStage = recommendDiagnosticStage
