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
    ] = seed
    return {
      id: `wr-${String(firstNumber + index).padStart(4, '0')}`,
      stage,
      type,
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
