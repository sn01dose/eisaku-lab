import { STAGES } from '../../app/constants'
import type {
  SkillId,
  SpellingErrorTag,
  WritingErrorTag,
} from '../../domain/learner/types'
import type { StudyPlan } from '../../domain/plan/types'
import type { WeeklySnapshot } from '../../domain/report/types'
import { encodeReportData } from './reportCodec'
import type {
  BuildLearningReportInput,
  BuiltLearningReport,
  LearningReportPayload,
  ReportPlanSummary,
} from './types'

const ERROR_TAG_LABELS: Record<
  SpellingErrorTag | WritingErrorTag,
  string
> = {
  vowelChoice: '母音の選び方',
  consonantChoice: '子音の選び方',
  doubleConsonant: '二重子音',
  silentLetter: 'silent letter',
  omission: '文字の抜け',
  insertion: '余分な文字',
  transposition: '文字の入れ替わり',
  prefix: '接頭辞',
  suffix: '接尾辞',
  inflection: '語形変化',
  irregular: '例外的な綴り',
  soundToLetter: '音から文字への変換',
  notRecalled: '綴りの想起',
  missingSubject: '主語',
  missingVerb: '動詞',
  wordOrder: '語順',
  tense: '時制',
  thirdPersonS: '三単現の s',
  number: '単数・複数',
  article: '冠詞',
  pronoun: '代名詞',
  preposition: '前置詞',
  conjunction: '接続語',
  fragment: '文の骨格',
  runOn: '一文の長さ',
  literalTranslation: '直訳',
  wordChoice: '語の選び方',
  spelling: 'スペル',
  punctuation: '文末記号',
  capitalization: '大文字・小文字',
}

const SPELLING_REPORT_TAGS = new Set<SpellingErrorTag>([
  'vowelChoice',
  'consonantChoice',
  'doubleConsonant',
  'silentLetter',
  'omission',
  'insertion',
  'transposition',
  'prefix',
  'suffix',
  'inflection',
  'irregular',
  'soundToLetter',
  'notRecalled',
])

function dateValue(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function addDays(date: string, days: number): string {
  return new Date(dateValue(date) + days * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

function formatDate(date: string): string {
  return date.replace(/-/g, '/')
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`
  }
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return `${hours}時間${remaining ? `${remaining}分` : ''}`
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function stageName(stage: number): string {
  return STAGES.find((candidate) => candidate.id === stage)?.name ?? `Stage ${stage}`
}

function errorTagLabel(tag: string): string {
  return ERROR_TAG_LABELS[tag as keyof typeof ERROR_TAG_LABELS] ?? tag
}

function sortAndDedupeSnapshots(
  snapshots: readonly WeeklySnapshot[],
): WeeklySnapshot[] {
  const byWeek = new Map<string, WeeklySnapshot>()
  snapshots.forEach((snapshot) => byWeek.set(snapshot.weekStart, snapshot))
  return [...byWeek.values()].sort(
    (left, right) => dateValue(left.weekStart) - dateValue(right.weekStart),
  )
}

function aggregateErrors(
  snapshots: readonly WeeklySnapshot[],
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>()
  snapshots.forEach((snapshot) => {
    snapshot.topErrorTags.forEach(({ tag, count }) => {
      counts.set(tag, (counts.get(tag) ?? 0) + count)
    })
  })
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
    .slice(0, 5)
}

function weightedAccuracy(snapshots: readonly WeeklySnapshot[]): number {
  const totalAttempts = snapshots.reduce(
    (sum, snapshot) => sum + snapshot.spellingAttempts,
    0,
  )
  if (!totalAttempts) {
    return 0
  }
  return (
    snapshots.reduce(
      (sum, snapshot) =>
        sum + snapshot.spellingRecallAccuracy * snapshot.spellingAttempts,
      0,
    ) / totalAttempts
  )
}

function averageWithinLimit(
  snapshots: readonly WeeklySnapshot[],
): number | null {
  const values = snapshots.flatMap(({ withinLimitWordsAvg }) =>
    withinLimitWordsAvg === null ? [] : [withinLimitWordsAvg],
  )
  if (!values.length) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function compareSuffix(
  previous: WeeklySnapshot | null,
  value: (snapshot: WeeklySnapshot) => string,
): string {
  return previous ? `（前週 ${value(previous)}）` : '（前週 —）'
}

function stableDifference(
  latest: WeeklySnapshot,
  previous: WeeklySnapshot | null,
): string {
  if (!previous) {
    return '（前週 —）'
  }
  const difference = latest.wordStableCount - previous.wordStableCount
  const sign = difference > 0 ? '+' : difference < 0 ? '' : '±'
  return `（${sign}${difference}）`
}

function supportDescription(
  latest: WeeklySnapshot,
  previous: WeeklySnapshot | null,
): string {
  if (!previous) {
    return `${latest.supportLevel}（前週 —）`
  }
  const difference = latest.supportLevel - previous.supportLevel
  if (difference > 0) {
    return `${previous.supportLevel} → ${latest.supportLevel}（支援が${difference}段階減りました）`
  }
  if (difference < 0) {
    return `${previous.supportLevel} → ${latest.supportLevel}（支援を${Math.abs(difference)}段階増やしました）`
  }
  return `${latest.supportLevel}（前週 ${previous.supportLevel}）`
}

function summarizePlan(plan: StudyPlan | null | undefined): ReportPlanSummary | null {
  if (!plan) {
    return null
  }
  return {
    targetDate: plan.targetDate,
    remainingDays: plan.remainingDays,
    effectiveDays: plan.effectiveDays,
    phase: plan.phase,
    finalPhaseStartDate: plan.finalPhaseStartDate,
    stageWindows: plan.stageWindows.map((window) => ({ ...window })),
  }
}

function planLine(
  plan: StudyPlan | null | undefined,
  latest: WeeklySnapshot,
  periodEnd: string,
): string | null {
  const window = plan?.stageWindows.find(({ stage }) => stage === latest.stage)
  if (!window) {
    return null
  }
  const remaining = Math.max(
    0,
    Math.ceil((dateValue(window.endDate) - dateValue(periodEnd)) / 86_400_000),
  )
  return `このステージの予定期間：あと${remaining}日`
}

function buildPayload(
  input: BuildLearningReportInput,
  selected: readonly WeeklySnapshot[],
): LearningReportPayload {
  const withPrevious = input.previousSnapshot
    ? [...selected, input.previousSnapshot]
    : [...selected]
  return {
    version: 1,
    snapshots: sortAndDedupeSnapshots(withPrevious).slice(-3),
    plan: summarizePlan(input.plan),
    stableSkillIds: [...new Set<SkillId>(input.stableSkillIds ?? [])].sort(),
    unresolvedNoteCount: Math.max(0, input.unresolvedNoteCount ?? 0),
  }
}

export function buildLearningReport(
  input: BuildLearningReportInput,
): BuiltLearningReport {
  const selected = sortAndDedupeSnapshots(input.selectedSnapshots)
  if (!selected.length) {
    throw new Error('レポートに含める週の集計がありません。')
  }
  const latest = selected.at(-1) as WeeklySnapshot
  const previous = input.previousSnapshot ?? null
  const periodStart = selected[0].weekStart
  const periodEnd = addDays(latest.weekStart, 6)
  const label = selected.length === 1 ? '今週' : '直近2週間'
  const studiedDays = selected.reduce(
    (sum, snapshot) => sum + snapshot.studiedDays,
    0,
  )
  const totalMinutes = selected.reduce(
    (sum, snapshot) => sum + snapshot.totalMinutes,
    0,
  )
  const spellingAttempts = selected.reduce(
    (sum, snapshot) => sum + snapshot.spellingAttempts,
    0,
  )
  const writingAttempts = selected.reduce(
    (sum, snapshot) => sum + snapshot.writingAttempts,
    0,
  )
  const paragraphs = selected.reduce(
    (sum, snapshot) => sum + snapshot.paragraphCount,
    0,
  )
  const shortWriting = Math.max(0, writingAttempts - paragraphs)
  const errors = aggregateErrors(selected)
  const spellingErrors = errors.filter(({ tag }) =>
    SPELLING_REPORT_TAGS.has(tag as SpellingErrorTag),
  )
  const withinLimit = averageWithinLimit(selected)
  const payload = buildPayload(input, selected)
  const transferCode = encodeReportData(payload)
  const lines = [
    '英作ラボ 学習レポート',
    `${formatDate(periodStart)} - ${formatDate(periodEnd)}`,
    '',
    `■ ${label}`,
    `学習した日：${studiedDays}日 / 合計 ${formatMinutes(totalMinutes)}`,
    `現在のステージ：${stageName(latest.stage)}`,
  ]
  const schedule = planLine(input.plan, latest, periodEnd)
  if (schedule) {
    lines.push(schedule)
  }
  lines.push(
    '',
    '■ スペリング',
    `出題 ${spellingAttempts}問 / 思い出して書けた割合 ${formatPercent(weightedAccuracy(selected))}${compareSuffix(previous, (snapshot) => formatPercent(snapshot.spellingRecallAccuracy))}`,
    `自力で書けるようになった語：${latest.wordStableCount}語${stableDifference(latest, previous)}`,
    `つまずいた型：${spellingErrors.length ? spellingErrors.slice(0, 3).map(({ tag }) => errorTagLabel(tag)).join('、') : '記録はありません'}`,
    '',
    '■ 英作文',
    `短文 ${shortWriting}問 / 段落 ${paragraphs}本`,
    `支援レベル：${supportDescription(latest, previous)}`,
    `制限時間内に書けた語数：${withinLimit === null ? '—' : `${Math.round(withinLimit)}語`}${compareSuffix(previous, (snapshot) => snapshot.withinLimitWordsAvg === null ? '—' : `${Math.round(snapshot.withinLimitWordsAvg)}語`)}`,
    '',
    '■ 繰り返している誤り',
  )
  if (errors.length) {
    errors.forEach(({ tag, count }, index) => {
      lines.push(`${index + 1}. ${errorTagLabel(tag)}（${count}回）`)
    })
  } else {
    lines.push('記録はありません')
  }
  const comment = input.personalComment?.trim()
  if (comment) {
    lines.push('', '■ 本人から', comment)
  }
  if (input.includeEssays && input.essays?.length) {
    lines.push('', '■ 英作文の本文')
    input.essays.forEach(({ createdAt, answer }) => {
      lines.push(formatDate(createdAt.slice(0, 10)), answer)
    })
  }
  if (input.includeTransferData !== false) {
    lines.push('', '---DATA---', transferCode)
  }
  return {
    text: lines.join('\n'),
    transferCode,
    payload,
  }
}
