import type {
  DiagnosticItem,
  MiniLesson,
  SimplificationTask,
  SpellingErrorTag,
  SpellingStrategy,
  SpellingWord,
  StageId,
  SkillId,
  WritingErrorTag,
  WritingTask,
  WritingTaskType,
} from '../domain/learner/types'

export type SpellingSeed = readonly [
  word: string,
  meaningJa: string,
  partOfSpeech: string,
  strategy: SpellingStrategy,
  chunks: readonly string[],
  chunkKind: 'phonetic' | 'morpheme',
  patterns: readonly string[],
  skillIds: readonly SkillId[],
  exampleEn: string,
  exampleJa: string,
  commonMistakes: readonly string[],
  errorTags: readonly SpellingErrorTag[],
  chunkLabels?: readonly string[],
  acceptedAnswers?: readonly string[],
  audioHintJa?: string,
]

export const makeSpellingWords = (
  stage: StageId,
  firstNumber: number,
  seeds: readonly SpellingSeed[],
): SpellingWord[] =>
  seeds.map((seed, index) => {
    const [
      word,
      meaningJa,
      partOfSpeech,
      strategy,
      chunks,
      chunkKind,
      patterns,
      skillIds,
      exampleEn,
      exampleJa,
      commonMistakes,
      errorTags,
      chunkLabels,
      acceptedAnswers = [],
      audioHintJa,
    ] = seed
    return {
      id: `sp-${String(firstNumber + index).padStart(4, '0')}`,
      word,
      meaningJa,
      stage,
      partOfSpeech,
      strategy,
      chunks: [...chunks],
      chunkKind,
      ...(chunkLabels ? { chunkLabels: [...chunkLabels] } : {}),
      patterns: [...patterns],
      skillIds: [...skillIds],
      exampleEn,
      exampleJa,
      acceptedAnswers: [...new Set([word, ...acceptedAnswers])],
      commonMistakes: [...commonMistakes],
      errorTags: [...errorTags],
      ...(audioHintJa ? { audioHintJa } : {}),
    }
  })

export type ShortWritingSeed = readonly [
  promptJa: string,
  modelAnswers: readonly [string, string, ...string[]],
  requiredSkills: readonly SkillId[],
  commonErrors: readonly WritingErrorTag[],
  type: WritingTaskType,
  theme: string,
  explanation: string,
  wordBank?: readonly string[],
  sentenceFrame?: string,
  simplifiedJapanese?: readonly string[],
  sentencePatternId?: string,
]

export const makeShortWritingTasks = (
  stage: StageId,
  firstNumber: number,
  seeds: readonly ShortWritingSeed[],
): WritingTask[] =>
  seeds.map((seed, index) => {
    const [
      promptJa,
      modelAnswers,
      requiredSkills,
      commonErrors,
      type,
      theme,
      explanation,
      wordBank,
      sentenceFrame,
      simplifiedJapanese,
      sentencePatternId,
    ] = seed
    return {
      id: `wr-${String(firstNumber + index).padStart(4, '0')}`,
      stage,
      type,
      ...(sentencePatternId ? { sentencePatternId } : {}),
      promptJa,
      ...(simplifiedJapanese ? { simplifiedJapanese: [...simplifiedJapanese] } : {}),
      ...(wordBank ? { wordBank: [...wordBank] } : {}),
      ...(sentenceFrame ? { sentenceFrame } : {}),
      modelAnswers: [...modelAnswers],
      requiredSkills: [...requiredSkills],
      commonErrors: [...commonErrors],
      explanation,
      estimatedMinutes: stage <= 2 ? 2 : 3,
      theme,
    }
  })

export type SimplifiedJapaneseByTaskId = Readonly<
  Record<string, readonly [string, ...string[]]>
>

export const withRequiredSimplifiedJapanese = (
  tasks: readonly WritingTask[],
  simplifications: SimplifiedJapaneseByTaskId,
): WritingTask[] =>
  tasks.map((task) => {
    const simplifiedJapanese =
      task.simplifiedJapanese ?? simplifications[task.id]
    if (!simplifiedJapanese) {
      throw new Error(`${task.id} に simplifiedJapanese がありません。`)
    }
    return { ...task, simplifiedJapanese: [...simplifiedJapanese] }
  })

export interface PatternVariant {
  promptJa: string
  modelAnswers: readonly [string, string, ...string[]]
  theme: string
  simplifiedJapanese?: readonly string[]
}

export interface SentencePatternSeed {
  sentencePatternId: string
  stage: StageId
  sentenceFrame: string
  requiredSkills: readonly SkillId[]
  commonErrors: readonly WritingErrorTag[]
  explanation: string
  variants: readonly [PatternVariant, PatternVariant, PatternVariant, PatternVariant, ...PatternVariant[]]
}

const supportedTypes: Record<StageId, readonly WritingTaskType[]> = {
  1: ['translateWithBank', 'translateWithFrame', 'translatePlain', 'reorder', 'cloze'],
  2: ['translateWithBank', 'translateWithFrame', 'translatePlain', 'combine', 'deliteralize'],
  3: ['translateWithBank', 'translateWithFrame', 'translatePlain', 'combine', 'deliteralize'],
  4: ['translateWithBank', 'translateWithFrame', 'translatePlain', 'combine', 'deliteralize'],
  5: ['translateWithBank', 'translateWithFrame', 'translatePlain', 'combine', 'deliteralize'],
  6: ['translateWithBank', 'translateWithFrame', 'translatePlain', 'combine', 'deliteralize'],
}

const makeWordBank = (answer: string): string[] => {
  const words = answer
    .replace(/[.,;:!?"'()]/g, '')
    .split(/\s+/)
    .filter(Boolean)
  const midpoint = Math.ceil(words.length / 2)
  return [...words.slice(midpoint), ...words.slice(0, midpoint)]
}

export const makeSentencePatternTasks = (
  firstNumber: number,
  patterns: readonly SentencePatternSeed[],
): WritingTask[] => {
  let nextNumber = firstNumber
  return patterns.flatMap((pattern) =>
    pattern.variants.map((variant, index) => {
      const type = supportedTypes[pattern.stage][index % supportedTypes[pattern.stage].length]
      const task: WritingTask = {
        id: `wr-${String(nextNumber).padStart(4, '0')}`,
        stage: pattern.stage,
        type,
        sentencePatternId: pattern.sentencePatternId,
        promptJa: variant.promptJa,
        ...(variant.simplifiedJapanese
          ? { simplifiedJapanese: [...variant.simplifiedJapanese] }
          : {}),
        ...(type === 'translateWithBank'
          ? { wordBank: makeWordBank(variant.modelAnswers[0]) }
          : {}),
        ...(type === 'translateWithFrame' || type === 'cloze'
          ? { sentenceFrame: pattern.sentenceFrame }
          : {}),
        modelAnswers: [...variant.modelAnswers],
        requiredSkills: [...pattern.requiredSkills],
        commonErrors: [...pattern.commonErrors],
        explanation: pattern.explanation,
        estimatedMinutes: pattern.stage <= 2 ? 2 : 3,
        theme: variant.theme,
      }
      nextNumber += 1
      return task
    }),
  )
}

export type AdvancedTranslationVariant = readonly [
  promptJa: string,
  simplifiedJapanese: readonly [string, ...string[]],
  safeAnswer: string,
  naturalAnswer: string,
  theme: string,
]

export interface AdvancedTranslationPatternSeed {
  sentencePatternId: string
  requiredSkills: readonly SkillId[]
  commonErrors: readonly WritingErrorTag[]
  explanation: string
  variants: readonly [
    AdvancedTranslationVariant,
    AdvancedTranslationVariant,
    AdvancedTranslationVariant,
    AdvancedTranslationVariant,
    AdvancedTranslationVariant,
    ...AdvancedTranslationVariant[],
  ]
}

export const makeAdvancedTranslationTasks = (
  stage: 5 | 6,
  firstNumber: number,
  patterns: readonly AdvancedTranslationPatternSeed[],
): WritingTask[] => {
  let nextNumber = firstNumber
  return patterns.flatMap((pattern) =>
    pattern.variants.map(([promptJa, simplifiedJapanese, safeAnswer, naturalAnswer, theme]) => {
      const task: WritingTask = {
        id: `wr-${String(nextNumber).padStart(4, '0')}`,
        stage,
        type: 'translatePlain',
        sentencePatternId: pattern.sentencePatternId,
        promptJa,
        simplifiedJapanese: [...simplifiedJapanese],
        modelAnswers: [safeAnswer, naturalAnswer],
        requiredSkills: [
          ...new Set<SkillId>([
            'writing.translation',
            'writing.japaneseSimplification',
            ...pattern.requiredSkills,
          ]),
        ],
        commonErrors: [
          ...new Set<WritingErrorTag>([
            'literalTranslation',
            ...pattern.commonErrors,
          ]),
        ],
        explanation: pattern.explanation,
        estimatedMinutes: 3,
        theme,
      }
      nextNumber += 1
      return task
    }),
  )
}

export type ExtendedWritingSeed = readonly [
  promptJa: string,
  modelAnswers: readonly [string, string, ...string[]],
  requiredSkills: readonly SkillId[],
  commonErrors: readonly WritingErrorTag[],
  type: 'outline' | 'paragraph' | 'timed' | 'summary',
  theme: string,
  explanation: string,
  minWords: number,
  maxWords: number,
  needsReason: boolean,
  needsExample: boolean,
  needsConclusion: boolean,
  simplifiedJapanese?: readonly string[],
]

export const makeExtendedWritingTasks = (
  stage: StageId,
  firstNumber: number,
  seeds: readonly ExtendedWritingSeed[],
): WritingTask[] =>
  seeds.map((seed, index) => {
    const [
      promptJa,
      modelAnswers,
      requiredSkills,
      commonErrors,
      type,
      theme,
      explanation,
      minWords,
      maxWords,
      needsReason,
      needsExample,
      needsConclusion,
      simplifiedJapanese,
    ] = seed
    return {
      id: `wr-${String(firstNumber + index).padStart(4, '0')}`,
      stage,
      type,
      promptJa,
      ...(simplifiedJapanese ? { simplifiedJapanese: [...simplifiedJapanese] } : {}),
      modelAnswers: [...modelAnswers],
      requiredSkills: [...requiredSkills],
      commonErrors: [...commonErrors],
      explanation,
      rubric: { minWords, maxWords, needsReason, needsExample, needsConclusion },
      estimatedMinutes: Math.max(5, Math.ceil(maxWords / 18)),
      theme,
    }
  })

export const defineSimplificationTasks = <T extends readonly SimplificationTask[]>(tasks: T): T => tasks
export const defineMiniLessons = <T extends readonly MiniLesson[]>(lessons: T): T => lessons
export const defineDiagnosticItems = <T extends readonly DiagnosticItem[]>(items: T): T => items
