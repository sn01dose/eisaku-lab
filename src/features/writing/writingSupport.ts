import type {
  FeedbackResult,
  SpellingWord,
  WritingErrorTag,
  WritingTask,
} from '../../domain/learner/types'
import { wordCount } from '../../utils/format'

export const SELF_CHECKS = [
  '質問に答えています',
  '結論が明確です',
  '理由があります',
  '具体例があります',
  '一文を長くしすぎていません',
  '主語と動詞があります',
  '時制がそろっています',
  '単数・複数を確認しました',
  'スペルを確認しました',
  '知らない難語を無理に使っていません',
]

function normalizeSentence(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
}

export function knownMisspellings(
  answer: string,
  words: readonly SpellingWord[],
): SpellingWord[] {
  const tokens = new Set(answer.toLowerCase().match(/[a-z]+/g) ?? [])
  return words.filter((word) =>
    word.commonMistakes.some((mistake) => tokens.has(mistake.toLowerCase())),
  )
}

export function writingIsCorrect(
  task: WritingTask,
  answer: string,
): boolean {
  const exactTypes: WritingTask['type'][] = [
    'reorder',
    'cloze',
    'matching',
    'translateWithBank',
    'translateWithFrame',
  ]
  if (exactTypes.includes(task.type)) {
    return task.modelAnswers.some(
      (model) => normalizeSentence(model) === normalizeSentence(answer),
    )
  }
  const minimum = task.rubric?.minWords ?? 1
  return (
    answer.trim().length > 0 &&
    wordCount(answer) >= Math.max(1, minimum * 0.7)
  )
}

export function mainErrorTag(
  feedback: FeedbackResult,
): WritingErrorTag | null {
  return (
    feedback.findings.find((finding) => finding.errorTag)?.errorTag ?? null
  )
}

export function supportDescription(level: number): string {
  return [
    '',
    '全文の型と語句バンクを表示しています。',
    '英文の骨格と語句バンクを表示しています。',
    '英文の骨格だけを表示しています。',
    '英訳しやすい日本語だけを表示しています。',
    '問題文だけで組み立てます。',
  ][level]
}
