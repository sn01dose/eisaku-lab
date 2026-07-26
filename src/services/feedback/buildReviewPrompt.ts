import { STAGES } from '../../app/constants'
import { spellingWords as curriculumSpellingWords } from '../../data/spelling'
import { writingTasks as curriculumWritingTasks } from '../../data/writing'
import type {
  AppState,
  SpellingErrorTag,
  SpellingWord,
  StageId,
  WritingErrorTag,
  WritingTask,
  WritingTaskType,
} from '../../domain/learner/types'
import {
  FREE_WRITING_CRITERIA_TEMPLATE,
  REVIEW_PROMPT_TEMPLATE,
  TRANSLATION_CRITERIA,
} from './reviewPromptTemplate'

const DAY_MS = 24 * 60 * 60 * 1000
const VOCABULARY_FALLBACK_THRESHOLD = 80
const VOCABULARY_LIMIT = 400

const TRANSLATION_TYPES = new Set<WritingTaskType>([
  'translateWithBank',
  'translateWithFrame',
  'translatePlain',
  'summary',
])

const TASK_TYPE_LABELS: Readonly<Record<WritingTaskType, string>> = {
  reorder: '並べ替え',
  cloze: '穴埋め',
  matching: '組み合わせ',
  translateWithBank: '語句バンク付き和文英訳',
  translateWithFrame: '骨格付き和文英訳',
  translatePlain: '和文英訳',
  combine: '複数文の接続',
  split: '一文の分割',
  deliteralize: '直訳を避ける言い換え',
  outline: '英作文の構成',
  paragraph: '段落英作文',
  timed: '制限時間付き英作文',
  summary: '要約英作文',
}

const ERROR_TAG_LABELS: Readonly<
  Record<SpellingErrorTag | WritingErrorTag, string>
> = {
  vowelChoice: '母音の選択',
  consonantChoice: '子音の選択',
  doubleConsonant: '子音の重なり',
  silentLetter: '発音しない文字',
  omission: '文字の抜け',
  insertion: '余分な文字',
  transposition: '文字の入れ替わり',
  prefix: '接頭辞',
  suffix: '接尾辞',
  inflection: '語形変化',
  irregular: '例外的な綴り',
  soundToLetter: '音から文字への変換',
  notRecalled: '思い出せなかった語',
  missingSubject: '主語',
  missingVerb: '動詞',
  wordOrder: '語順',
  tense: '時制',
  thirdPersonS: '三人称単数の s',
  number: '単数・複数',
  article: '冠詞',
  pronoun: '代名詞',
  preposition: '前置詞',
  conjunction: '接続語',
  fragment: '文の骨格',
  runOn: '一文の長さ',
  literalTranslation: '直訳',
  wordChoice: '語の選び方',
  spelling: 'スペリング',
  punctuation: '文末記号',
  capitalization: '大文字・小文字',
}

type PromptState = Pick<
  AppState,
  'attempts' | 'customSpellingWords' | 'mastery'
>

export interface BuildReviewPromptInput {
  task: WritingTask
  answer: string
  stage: StageId
  state: PromptState
  now: Date
  includeVocabulary?: boolean
  spellingWords?: readonly SpellingWord[]
  writingTasks?: readonly WritingTask[]
}

export interface ReviewPromptResult {
  prompt: string
  vocabularyCount: number
  vocabularyWords: string[]
  includedVocabulary: boolean
}

interface RankedWord {
  word: string
  rank: number
}

function tokenizeEnglish(input: string): string[] {
  return (input.match(/[A-Za-z]+(?:[’'][A-Za-z]+)*(?:-[A-Za-z]+)*/g) ?? [])
    .map((word) => word.replaceAll('’', "'").toLowerCase())
}

function taskWords(task: WritingTask): string[] {
  return [
    ...tokenizeEnglish((task.wordBank ?? []).join(' ')),
    ...task.modelAnswers.flatMap(tokenizeEnglish),
  ]
}

function stableSkillUpdatedAt(
  word: SpellingWord,
  state: PromptState,
): number | null {
  const timestamps = word.skillIds.flatMap((skillId) => {
    const mastery = state.mastery[skillId]
    if (!mastery?.stable) return []
    const timestamp = Date.parse(mastery.updatedAt)
    return [Number.isNaN(timestamp) ? 0 : timestamp]
  })
  return timestamps.length > 0 ? Math.max(...timestamps) : null
}

function addUniqueRanked(
  target: RankedWord[],
  seen: Set<string>,
  words: readonly string[],
  rank: number,
): void {
  words.forEach((rawWord) => {
    tokenizeEnglish(rawWord).forEach((word) => {
      if (!seen.has(word)) {
        seen.add(word)
        target.push({ word, rank })
      }
    })
  })
}

function buildVocabulary(
  input: BuildReviewPromptInput,
): string[] {
  const spellingCorpus = [
    ...(input.spellingWords ?? curriculumSpellingWords),
    ...Object.values(input.state.customSpellingWords),
  ]
  const writingCorpus = input.writingTasks ?? curriculumWritingTasks
  const selected: RankedWord[] = []
  const seen = new Set<string>()

  addUniqueRanked(selected, seen, taskWords(input.task), Number.MAX_SAFE_INTEGER)

  spellingCorpus
    .flatMap((word) => {
      const rank = stableSkillUpdatedAt(word, input.state)
      return rank === null ? [] : [{ word: word.word, rank }]
    })
    .sort((a, b) => b.rank - a.rank || a.word.localeCompare(b.word))
    .forEach(({ word, rank }) => addUniqueRanked(selected, seen, [word], rank))

  if (selected.length < VOCABULARY_FALLBACK_THRESHOLD) {
    addUniqueRanked(
      selected,
      seen,
      spellingCorpus
        .filter(({ stage }) => stage <= 2)
        .map(({ word }) => word),
      -1,
    )
    addUniqueRanked(
      selected,
      seen,
      writingCorpus
        .filter(({ stage }) => stage <= input.stage)
        .flatMap(({ modelAnswers }) => modelAnswers.flatMap(tokenizeEnglish)),
      -2,
    )
  }

  return selected
    .slice(0, VOCABULARY_LIMIT)
    .map(({ word }) => word)
    .sort((a, b) => a.localeCompare(b))
}

function recentErrorTags(state: PromptState, now: Date): string {
  const nowMs = now.getTime()
  const startMs = nowMs - 30 * DAY_MS
  const counts = new Map<
    SpellingErrorTag | WritingErrorTag,
    { count: number; latestAt: number }
  >()

  state.attempts.forEach((attempt) => {
    const at = Date.parse(attempt.at)
    if (Number.isNaN(at) || at < startMs || at > nowMs) return
    attempt.errorTags.forEach((tag) => {
      const current = counts.get(tag) ?? { count: 0, latestAt: 0 }
      counts.set(tag, {
        count: current.count + 1,
        latestAt: Math.max(current.latestAt, at),
      })
    })
  })

  if (counts.size === 0) return '（まだ十分なデータがありません）'

  return [...counts]
    .sort(
      ([tagA, a], [tagB, b]) =>
        b.count - a.count ||
        b.latestAt - a.latestAt ||
        tagA.localeCompare(tagB),
    )
    .slice(0, 3)
    .map(([tag, { count }]) => `${ERROR_TAG_LABELS[tag]}（${count}回）`)
    .join('、')
}

function freeWritingCriteria(task: WritingTask): string {
  const stage = STAGES.find(({ id }) => id === task.stage) ?? STAGES[0]
  const [stageMin, stageMax] = stage.words.match(/\d+/g) ?? ['指定なし', '指定なし']
  return FREE_WRITING_CRITERIA_TEMPLATE.replace(
    /{{(minWords|maxWords)}}/g,
    (placeholder) =>
      placeholder === '{{minWords}}'
        ? String(task.rubric?.minWords ?? stageMin)
        : String(task.rubric?.maxWords ?? stageMax),
  )
}

function renderTemplate(values: Readonly<Record<string, string>>): string {
  return REVIEW_PROMPT_TEMPLATE.replace(
    /{{([A-Za-z]+)}}/g,
    (_placeholder, key: string) => values[key] ?? '',
  )
}

export function buildReviewPrompt(
  input: BuildReviewPromptInput,
): ReviewPromptResult {
  const stage = STAGES.find(({ id }) => id === input.stage) ?? STAGES[0]
  const vocabularyWords = buildVocabulary(input)
  const includeVocabulary = input.includeVocabulary ?? true
  const simplifiedJapaneseBlock = input.task.simplifiedJapanese?.length
    ? `（英訳しやすく言い換えた日本語）\n${input.task.simplifiedJapanese.join('\n')}`
    : ''
  const criteriaBlock = TRANSLATION_TYPES.has(input.task.type)
    ? TRANSLATION_CRITERIA
    : freeWritingCriteria(input.task)

  return {
    prompt: renderTemplate({
      stageName: stage.name,
      stageGoal: stage.target,
      recentTags: recentErrorTags(input.state, input.now),
      taskTypeLabel: TASK_TYPE_LABELS[input.task.type],
      promptJa: input.task.promptJa,
      simplifiedJapaneseBlock,
      answer: input.answer,
      modelAnswerSafe: input.task.modelAnswers[0] ?? '',
      criteriaBlock,
      stableWords: includeVocabulary
        ? `（${vocabularyWords.length}語）\n${vocabularyWords.join(', ')}`
        : '（語彙リストは含めていません）',
    }),
    vocabularyCount: vocabularyWords.length,
    vocabularyWords,
    includedVocabulary: includeVocabulary,
  }
}
