import type {
  LearningReportPayload,
  ReportPlanSummary,
  ReportStageWindow,
} from './types'
import type {
  SkillId,
  StageId,
} from '../../domain/learner/types'
import type { WeeklySnapshot } from '../../domain/report/types'

const FORMAT_VERSION = 1 as const
const PLAIN_PREFIX = 'ELR1.'
const COMPRESSED_PREFIX = 'ELR1Z.'
const DEFAULT_COMPRESSION_THRESHOLD = 2_000

type ErrorWire = [tag: string, count: number]
type SnapshotWire = [
  weekStart: string,
  studiedDays: number,
  totalMinutes: number,
  spellingAttempts: number,
  spellingRecallAccuracy: number,
  wordStableCount: number,
  writingAttempts: number,
  paragraphCount: number,
  supportLevel: number,
  withinLimitWordsAvg: number | null,
  topErrorTags: ErrorWire[],
  stage: StageId,
]
type WindowWire = [
  stage: StageId,
  startDate: string,
  endDate: string,
  days: number,
]
type PlanWire = [
  targetDate: string,
  remainingDays: number,
  effectiveDays: number,
  phase: 'build' | 'final',
  finalPhaseStartDate: string,
  stageWindows: WindowWire[],
]

interface PayloadWire {
  v: typeof FORMAT_VERSION
  w: SnapshotWire[]
  p: PlanWire | null
  s: SkillId[]
  n: number
}

function snapshotToWire(snapshot: WeeklySnapshot): SnapshotWire {
  return [
    snapshot.weekStart,
    snapshot.studiedDays,
    snapshot.totalMinutes,
    snapshot.spellingAttempts,
    snapshot.spellingRecallAccuracy,
    snapshot.wordStableCount,
    snapshot.writingAttempts,
    snapshot.paragraphCount,
    snapshot.supportLevel,
    snapshot.withinLimitWordsAvg,
    snapshot.topErrorTags.map(({ tag, count }) => [tag, count]),
    snapshot.stage,
  ]
}

function snapshotFromWire(wire: SnapshotWire): WeeklySnapshot {
  return {
    weekStart: wire[0],
    studiedDays: wire[1],
    totalMinutes: wire[2],
    spellingAttempts: wire[3],
    spellingRecallAccuracy: wire[4],
    wordStableCount: wire[5],
    writingAttempts: wire[6],
    paragraphCount: wire[7],
    supportLevel: wire[8],
    withinLimitWordsAvg: wire[9],
    topErrorTags: wire[10].map(([tag, count]) => ({ tag, count })),
    stage: wire[11],
  }
}

function windowToWire(window: ReportStageWindow): WindowWire {
  return [window.stage, window.startDate, window.endDate, window.days]
}

function windowFromWire(wire: WindowWire): ReportStageWindow {
  return {
    stage: wire[0],
    startDate: wire[1],
    endDate: wire[2],
    days: wire[3],
  }
}

function planToWire(plan: ReportPlanSummary | null): PlanWire | null {
  if (!plan) {
    return null
  }
  return [
    plan.targetDate,
    plan.remainingDays,
    plan.effectiveDays,
    plan.phase,
    plan.finalPhaseStartDate,
    plan.stageWindows.map(windowToWire),
  ]
}

function planFromWire(wire: PlanWire | null): ReportPlanSummary | null {
  if (!wire) {
    return null
  }
  return {
    targetDate: wire[0],
    remainingDays: wire[1],
    effectiveDays: wire[2],
    phase: wire[3],
    finalPhaseStartDate: wire[4],
    stageWindows: wire[5].map(windowFromWire),
  }
}

function toWire(payload: LearningReportPayload): PayloadWire {
  return {
    v: FORMAT_VERSION,
    w: payload.snapshots.map(snapshotToWire),
    p: planToWire(payload.plan),
    s: [...payload.stableSkillIds],
    n: payload.unresolvedNoteCount,
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isSnapshotWire(value: unknown): value is SnapshotWire {
  return (
    Array.isArray(value) &&
    value.length === 12 &&
    typeof value[0] === 'string' &&
    value.slice(1, 9).every(isFiniteNumber) &&
    (value[9] === null || isFiniteNumber(value[9])) &&
    Array.isArray(value[10]) &&
    value[10].every(
      (entry) =>
        Array.isArray(entry) &&
        entry.length === 2 &&
        typeof entry[0] === 'string' &&
        isFiniteNumber(entry[1]),
    ) &&
    isFiniteNumber(value[11])
  )
}

function isWindowWire(value: unknown): value is WindowWire {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    isFiniteNumber(value[0]) &&
    typeof value[1] === 'string' &&
    typeof value[2] === 'string' &&
    isFiniteNumber(value[3])
  )
}

function isPlanWire(value: unknown): value is PlanWire {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    typeof value[0] === 'string' &&
    isFiniteNumber(value[1]) &&
    isFiniteNumber(value[2]) &&
    (value[3] === 'build' || value[3] === 'final') &&
    typeof value[4] === 'string' &&
    Array.isArray(value[5]) &&
    value[5].every(isWindowWire)
  )
}

function fromWire(value: unknown): LearningReportPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('レポートデータを読み取れませんでした。')
  }
  const wire = value as Partial<PayloadWire>
  if (wire.v !== FORMAT_VERSION) {
    throw new Error('このレポートの書式バージョンには対応していません。')
  }
  if (
    !Array.isArray(wire.w) ||
    !wire.w.every(isSnapshotWire) ||
    (wire.p !== null && !isPlanWire(wire.p)) ||
    !Array.isArray(wire.s) ||
    !wire.s.every((skill) => typeof skill === 'string') ||
    !isFiniteNumber(wire.n)
  ) {
    throw new Error('レポートデータの内容を確認できませんでした。')
  }
  return {
    version: FORMAT_VERSION,
    snapshots: wire.w.map(snapshotFromWire),
    plan: planFromWire(wire.p ?? null),
    stableSkillIds: [...wire.s] as SkillId[],
    unresolvedNoteCount: wire.n,
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '')
}

function base64UrlToBytes(encoded: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(encoded)) {
    throw new Error('レポートコードの文字列が壊れています。')
  }
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  try {
    return Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    )
  } catch {
    throw new Error('レポートコードを読み取れませんでした。')
  }
}

function encodeJson(payload: LearningReportPayload): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(toWire(payload)))
}

function decodeJson(bytes: Uint8Array): LearningReportPayload {
  try {
    return fromWire(JSON.parse(new TextDecoder().decode(bytes)))
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('レポートデータを読み取れませんでした。', {
        cause: error,
      })
    }
    throw error
  }
}

async function collectStream(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  while (true) {
    const result = await reader.read()
    if (result.done) {
      break
    }
    chunks.push(result.value)
    length += result.value.length
  }
  const combined = new Uint8Array(length)
  let offset = 0
  chunks.forEach((chunk) => {
    combined.set(chunk, offset)
    offset += chunk.length
  })
  return combined
}

async function transformBytes(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const output = collectStream(transform.readable)
  const writer = transform.writable.getWriter()
  await writer.write(Uint8Array.from(bytes))
  await writer.close()
  return output
}

export function extractReportCode(text: string): string | null {
  return text.match(/\bELR\d+Z?\.[A-Za-z0-9_-]+/u)?.[0] ?? null
}

function extractPrefixAndBody(input: string): {
  prefix: string
  encoded: string
} {
  const code = extractReportCode(input) ?? input.trim()
  const separator = code.indexOf('.')
  if (separator < 0) {
    throw new Error('取り込み用データが見つかりませんでした。')
  }
  const prefix = code.slice(0, separator)
  const encoded = code.slice(separator + 1)
  if (prefix !== 'ELR1' && prefix !== 'ELR1Z') {
    throw new Error('このレポートの書式バージョンには対応していません。')
  }
  if (!encoded) {
    throw new Error('レポートコードが空です。')
  }
  return { prefix, encoded }
}

export function encodeReportData(payload: LearningReportPayload): string {
  return `${PLAIN_PREFIX}${bytesToBase64Url(encodeJson(payload))}`
}

export function decodeReportData(input: string): LearningReportPayload {
  const { prefix, encoded } = extractPrefixAndBody(input)
  if (prefix === 'ELR1Z') {
    throw new Error('圧縮されたレポートは非同期の取り込みを使用してください。')
  }
  return decodeJson(base64UrlToBytes(encoded))
}

export async function encodeCompressedReportData(
  payload: LearningReportPayload,
): Promise<string> {
  if (typeof CompressionStream === 'undefined') {
    return encodeReportData(payload)
  }
  try {
    const compressed = await transformBytes(
      encodeJson(payload),
      new CompressionStream('deflate-raw'),
    )
    return `${COMPRESSED_PREFIX}${bytesToBase64Url(compressed)}`
  } catch {
    return encodeReportData(payload)
  }
}

export async function encodeReportDataForSharing(
  payload: LearningReportPayload,
  compressionThreshold = DEFAULT_COMPRESSION_THRESHOLD,
): Promise<string> {
  const plain = encodeReportData(payload)
  if (plain.length < compressionThreshold) {
    return plain
  }
  const compressed = await encodeCompressedReportData(payload)
  return compressed.length < plain.length ? compressed : plain
}

export async function decodeReportDataAsync(
  input: string,
): Promise<LearningReportPayload> {
  const { prefix, encoded } = extractPrefixAndBody(input)
  if (prefix === 'ELR1') {
    return decodeJson(base64UrlToBytes(encoded))
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('この環境では圧縮レポートを取り込めません。')
  }
  try {
    const decompressed = await transformBytes(
      base64UrlToBytes(encoded),
      new DecompressionStream('deflate-raw'),
    )
    return decodeJson(decompressed)
  } catch (error) {
    if (error instanceof Error && error.message.includes('レポート')) {
      throw error
    }
    throw new Error('圧縮されたレポートデータを読み取れませんでした。', {
      cause: error,
    })
  }
}
