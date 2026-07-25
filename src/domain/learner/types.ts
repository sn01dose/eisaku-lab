export type StageId = 1 | 2 | 3 | 4 | 5 | 6
export type SupportLevel = 1 | 2 | 3 | 4 | 5

export type SpellingStrategy = 'sound' | 'pattern' | 'morpheme' | 'irregular'

export type SkillId =
  | 'spelling.shortVowel'
  | 'spelling.longVowel'
  | 'spelling.vowelTeam'
  | 'spelling.silentLetter'
  | 'spelling.doubleConsonant'
  | 'spelling.inflection'
  | 'spelling.prefix'
  | 'spelling.suffix'
  | 'spelling.wordFamily'
  | 'spelling.irregular'
  | 'writing.subjectVerb'
  | 'writing.wordOrder'
  | 'writing.tense'
  | 'writing.agreement'
  | 'writing.article'
  | 'writing.plural'
  | 'writing.infinitive'
  | 'writing.gerund'
  | 'writing.relativeClause'
  | 'writing.connector'
  | 'writing.paragraphStructure'
  | 'writing.paraphrase'
  | 'writing.japaneseSimplification'
  | 'writing.argument'
  | 'writing.summary'
  | 'writing.translation'

export const ALL_SKILL_IDS = [
  'spelling.shortVowel',
  'spelling.longVowel',
  'spelling.vowelTeam',
  'spelling.silentLetter',
  'spelling.doubleConsonant',
  'spelling.inflection',
  'spelling.prefix',
  'spelling.suffix',
  'spelling.wordFamily',
  'spelling.irregular',
  'writing.subjectVerb',
  'writing.wordOrder',
  'writing.tense',
  'writing.agreement',
  'writing.article',
  'writing.plural',
  'writing.infinitive',
  'writing.gerund',
  'writing.relativeClause',
  'writing.connector',
  'writing.paragraphStructure',
  'writing.paraphrase',
  'writing.japaneseSimplification',
  'writing.argument',
  'writing.summary',
  'writing.translation',
] as const satisfies readonly SkillId[]

export type SpellingErrorTag =
  | 'vowelChoice'
  | 'consonantChoice'
  | 'doubleConsonant'
  | 'silentLetter'
  | 'omission'
  | 'insertion'
  | 'transposition'
  | 'prefix'
  | 'suffix'
  | 'inflection'
  | 'irregular'
  | 'soundToLetter'
  | 'notRecalled'

export type WritingErrorTag =
  | 'missingSubject'
  | 'missingVerb'
  | 'wordOrder'
  | 'tense'
  | 'thirdPersonS'
  | 'number'
  | 'article'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'fragment'
  | 'runOn'
  | 'literalTranslation'
  | 'wordChoice'
  | 'spelling'
  | 'punctuation'
  | 'capitalization'

export interface SpellingWord {
  id: string
  word: string
  meaningJa: string
  stage: StageId
  partOfSpeech: string
  strategy: SpellingStrategy
  chunks: string[]
  chunkKind: 'phonetic' | 'morpheme'
  chunkLabels?: string[]
  patterns: string[]
  skillIds: SkillId[]
  exampleEn: string
  exampleJa: string
  acceptedAnswers: string[]
  commonMistakes: string[]
  errorTags: SpellingErrorTag[]
  audioHintJa?: string
}

export type WritingTaskType =
  | 'reorder'
  | 'cloze'
  | 'matching'
  | 'translateWithBank'
  | 'translateWithFrame'
  | 'translatePlain'
  | 'combine'
  | 'split'
  | 'deliteralize'
  | 'outline'
  | 'paragraph'
  | 'timed'
  | 'summary'

export interface WritingRubric {
  minWords?: number
  maxWords?: number
  mustInclude?: string[]
  needsReason?: boolean
  needsExample?: boolean
  needsConclusion?: boolean
}

export interface WritingTask {
  id: string
  stage: StageId
  type: WritingTaskType
  promptJa: string
  simplifiedJapanese?: string[]
  wordBank?: string[]
  sentenceFrame?: string
  modelAnswers: string[]
  requiredSkills: SkillId[]
  commonErrors: WritingErrorTag[]
  explanation: string
  rubric?: WritingRubric
  estimatedMinutes: number
  theme: string
}

export interface SimplificationTask {
  id: string
  stage: StageId
  originalJa: string
  targetPoints: Array<
    'subject' | 'oneIdea' | 'concrete' | 'basicWords' | 'connector'
  >
  modelSimplified: string[]
  modelEn?: string[]
  explanation: string
}

export interface MiniLesson {
  id: string
  title: string
  skillIds: SkillId[]
  bodyMd: string
  examples: Array<{ en: string; ja: string }>
  triggerTags: Array<SpellingErrorTag | WritingErrorTag>
}

interface DiagnosticItemBase {
  id: string
  skillIds: SkillId[]
  estimatedSeconds: number
}

export interface SpellChoicePayload {
  promptJa: string
  options: string[]
  answer: string
}

export interface DictationPayload {
  answer: string
  meaningJa?: string
  wordId?: string
}

export interface FillLettersPayload {
  display: string
  answer: string
  meaningJa?: string
}

export interface ChunkingPayload {
  word: string
  answer: string[]
  options?: string[]
}

export interface BasicTranslatePayload {
  promptJa: string
  modelAnswers: string[]
}

export interface ReorderPayload {
  promptJa?: string
  tokens: string[]
  modelAnswers: string[]
}

export interface ShortOpinionPayload {
  promptJa: string
  modelAnswers: string[]
  rubric?: WritingRubric
}

export type DiagnosticItem =
  | (DiagnosticItemBase & {
      section: 'spellChoice'
      payload: SpellChoicePayload
    })
  | (DiagnosticItemBase & { section: 'dictation'; payload: DictationPayload })
  | (DiagnosticItemBase & {
      section: 'fillLetters'
      payload: FillLettersPayload
    })
  | (DiagnosticItemBase & { section: 'chunking'; payload: ChunkingPayload })
  | (DiagnosticItemBase & {
      section: 'basicTranslate'
      payload: BasicTranslatePayload
    })
  | (DiagnosticItemBase & { section: 'reorder'; payload: ReorderPayload })
  | (DiagnosticItemBase & {
      section: 'shortOpinion'
      payload: ShortOpinionPayload
    })

export interface ReviewCard {
  id: string
  kind: 'spelling' | 'writing' | 'simplification'
  refId: string
  repetitions: number
  interval: number
  easeFactor: number
  lapses: number
  lastReviewedAt: string | null
  dueAt: string
  lastResult: 'correct' | 'hinted' | 'retried' | 'wrong' | null
  hintCount: number
  responseTimeMs: number | null
  source: 'curriculum' | 'writingMistake' | 'manual'
}

export interface Attempt {
  id: string
  at: string
  kind: 'spelling' | 'writing' | 'simplification' | 'diagnostic'
  refId: string
  isRecall: boolean
  input: string
  correct: boolean
  hintLevelUsed: number
  responseTimeMs: number
  errorTags: Array<SpellingErrorTag | WritingErrorTag>
  skillIds: SkillId[]
}

export interface SkillMastery {
  skillId: SkillId
  score: number
  correctDays: string[]
  stable: boolean
  updatedAt: string
}

export interface LearnerProfile {
  nickname: string
  dailyMinutes: 15 | 30 | 45
  goal: 'foundation' | 'commonTest' | 'university' | 'selective'
  useSpeech: boolean
  targetDate: string | null
  currentStage: StageId
  recommendedStage: StageId
  supportLevel: SupportLevel
  createdAt: string
}

export interface MistakeNote {
  id: string
  at: string
  updatedAt: string
  kind: 'spelling' | 'writing' | 'simplification'
  refId: string
  input: string
  correction: string
  primaryErrorTag: SpellingErrorTag | WritingErrorTag
  errorTags: Array<SpellingErrorTag | WritingErrorTag>
  skillIds: SkillId[]
  occurrenceCount: number
  conquered: boolean
  reviewCardId: string | null
}

export interface FeedbackFinding {
  id: string
  severity: 'important' | 'check' | 'positive'
  message: string
  errorTag?: WritingErrorTag
}

export interface FeedbackResult {
  findings: FeedbackFinding[]
  wordCount: number
  sentenceCount: number
  checkedAt: string
}

export interface FeedbackProvider {
  review(input: {
    task: WritingTask
    answer: string
    stage: StageId
  }): Promise<FeedbackResult>
}
export interface SavedEssay {
  id: string
  taskId: string
  stage: StageId
  answer: string
  createdAt: string
  updatedAt: string
  feedback: FeedbackResult | null
}

export interface DiagnosticAnswer {
  itemId: string
  input: string | string[]
  correct: boolean
  answeredAt: string
}

export interface DiagnosticState {
  startedAt: string
  updatedAt: string
  completedAt: string | null
  currentIndex: number
  itemIds: string[]
  answers: DiagnosticAnswer[]
  recommendedStage: StageId | null
}

export type LearningItemKind =
  | 'spelling'
  | 'writing'
  | 'simplification'
  | 'miniLesson'
  | 'reflection'

export interface SessionItem {
  id: string
  kind: LearningItemKind
  refId: string
  source: 'review' | 'weak' | 'new' | 'foundation' | 'reflection'
  estimatedMinutes: number
  stage: StageId
  skillIds: SkillId[]
}

export interface SessionLog {
  id: string
  plannedFor: string
  startedAt: string
  updatedAt: string
  completedAt: string | null
  status: 'planned' | 'inProgress' | 'completed'
  items: SessionItem[]
  currentIndex: number
  completedItemIds: string[]
}

export interface AppState {
  schemaVersion: number
  profile: LearnerProfile | null
  cards: Record<string, ReviewCard>
  attempts: Attempt[]
  mastery: Record<SkillId, SkillMastery>
  notes: MistakeNote[]
  essays: SavedEssay[]
  diagnostic: DiagnosticState | null
  sessions: SessionLog[]
}
