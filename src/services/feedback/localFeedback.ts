import type {
  FeedbackFinding,
  FeedbackResult,
  SpellingWord,
  WritingErrorTag,
  WritingTask,
} from '../../domain/learner/types'
import { wordCount } from '../../utils/format'
import type { FeedbackProvider } from './types'

interface FindingDraft {
  priority: number
  message: string
  errorTag?: WritingErrorTag
}

const SUBJECTS = new Set([
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'this',
  'that',
  'people',
  'students',
])

const COMMON_VERBS =
  /\b(?:am|is|are|was|were|be|have|has|had|do|does|did|can|could|will|would|should|may|might|must|need|needs|use|uses|make|makes|help|helps|learn|learns|think|believe)\b/i

function splitSentences(answer: string): string[] {
  return answer
    .trim()
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function repeatedWord(answer: string): string | null {
  const ignored = new Set([
    'the',
    'a',
    'an',
    'to',
    'of',
    'and',
    'is',
    'are',
    'i',
    'it',
    'we',
    'that',
  ])
  const counts = new Map<string, number>()
  for (const word of answer.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (ignored.has(word)) continue
    counts.set(word, (counts.get(word) ?? 0) + 1)
  }
  return (
    [...counts.entries()]
      .filter(([, count]) => count >= 4)
      .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null
  )
}

function likelyMissingCore(sentence: string): boolean {
  const words = sentence.toLowerCase().match(/[a-z]+/g) ?? []
  const hasSubject =
    words.some((word) => SUBJECTS.has(word)) ||
    /^[A-Z][a-z]+(?:s)?\b/.test(sentence)
  const hasVerb = COMMON_VERBS.test(sentence) || /\b[a-z]+(?:ed|ing)\b/i.test(sentence)
  return words.length >= 3 && (!hasSubject || !hasVerb)
}

function findKnownMisspelling(
  answer: string,
  spellingWords: readonly SpellingWord[],
): string | null {
  const tokens = new Set(answer.toLowerCase().match(/[a-z]+/g) ?? [])
  for (const item of spellingWords) {
    const mistake = item.commonMistakes.find((candidate) =>
      tokens.has(candidate.toLowerCase()),
    )
    if (mistake) return `${mistake} → ${item.word}`
  }
  return null
}

function collectChecks(
  task: WritingTask,
  answer: string,
  spellingWords: readonly SpellingWord[],
): FindingDraft[] {
  const checks: FindingDraft[] = []
  const trimmed = answer.trim()
  const sentences = splitSentences(trimmed)
  const words = wordCount(trimmed)

  if (!/^[A-Z]/.test(trimmed)) {
    checks.push({
      priority: 95,
      message: '文頭を大文字にしたか確認してみましょう。',
      errorTag: 'capitalization',
    })
  }
  if (!/[.!?]$/.test(trimmed)) {
    checks.push({
      priority: 90,
      message: '最後に文末記号があるか確認してみましょう。',
      errorTag: 'punctuation',
    })
  }
  const missingCore = sentences.find(likelyMissingCore)
  if (missingCore) {
    checks.push({
      priority: 100,
      message: '主語と動詞がそろっているか確認してみましょう。',
      errorTag: 'missingVerb',
    })
  }
  if (sentences.some((sentence) => wordCount(sentence) > 25)) {
    checks.push({
      priority: 88,
      message: '長い一文を、内容ごとに二つへ分けられるか確認しましょう。',
      errorTag: 'runOn',
    })
  }
  const knownMisspelling = findKnownMisspelling(trimmed, spellingWords)
  if (knownMisspelling) {
    checks.push({
      priority: 98,
      message: `綴りを一つ確認しましょう：${knownMisspelling}`,
      errorTag: 'spelling',
    })
  }
  const repeat = repeatedWord(trimmed)
  if (repeat) {
    checks.push({
      priority: 55,
      message: `「${repeat}」の繰り返しを、代名詞や別の基本語で減らせるか確認しましょう。`,
      errorTag: 'wordChoice',
    })
  }
  if (task.rubric?.minWords && words < task.rubric.minWords) {
    checks.push({
      priority: 80,
      message: `目安の${task.rubric.minWords}語に向けて、理由か具体例を一つ足しましょう。`,
      errorTag: 'fragment',
    })
  }
  if (
    task.rubric?.needsReason &&
    !/\b(?:because|since|reason)\b/i.test(trimmed)
  ) {
    checks.push({
      priority: 82,
      message: '理由が読み手に伝わる接続を一つ加えられるか確認しましょう。',
      errorTag: 'conjunction',
    })
  }
  if (
    task.rubric?.needsExample &&
    !/\b(?:for example|for instance|such as)\b/i.test(trimmed)
  ) {
    checks.push({
      priority: 72,
      message: '具体例を示す一文を加えられるか確認しましょう。',
      errorTag: 'fragment',
    })
  }
  const missingRequired = task.rubric?.mustInclude?.find(
    (phrase) => !trimmed.toLowerCase().includes(phrase.toLowerCase()),
  )
  if (missingRequired) {
    checks.push({
      priority: 86,
      message: `指定語句「${missingRequired}」を使えているか確認しましょう。`,
      errorTag: 'wordChoice',
    })
  }
  return checks.sort((left, right) => right.priority - left.priority)
}

export function evaluateWritingLocally(
  task: WritingTask,
  answer: string,
  spellingWords: readonly SpellingWord[] = [],
): FeedbackResult {
  const words = wordCount(answer)
  const sentences = splitSentences(answer)
  const checks = collectChecks(task, answer, spellingWords).slice(0, 2)
  const findings: FeedbackFinding[] = [
    {
      id: 'local-positive',
      severity: 'positive',
      message:
        words > 0
          ? '内容を英語にしようとする骨格はできています。'
          : '考える準備はできています。まず短い一文から始めましょう。',
    },
    ...checks.map((check, index) => ({
      id: `local-check-${index}`,
      severity: index === 0 ? ('important' as const) : ('check' as const),
      message: check.message,
      errorTag: check.errorTag,
    })),
  ]
  return {
    findings,
    wordCount: words,
    sentenceCount: sentences.length,
    checkedAt: new Date().toISOString(),
  }
}

export class LocalFeedbackProvider implements FeedbackProvider {
  constructor(private readonly spellingWords: readonly SpellingWord[] = []) {}

  async review({
    task,
    answer,
  }: Parameters<FeedbackProvider['review']>[0]): Promise<FeedbackResult> {
    return evaluateWritingLocally(task, answer, this.spellingWords)
  }
}
