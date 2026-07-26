export const TIMED_WRITING_SCHEMA_VERSION = 1 as const
export const TIMED_WRITING_WARNING_MS = 3 * 60 * 1000

export interface TimedWritingSnapshot {
  schemaVersion: typeof TIMED_WRITING_SCHEMA_VERSION
  taskId: string
  durationMs: number
  accumulatedMs: number
  runningSinceMs: number | null
  withinTimeWordCount: number | null
  lastObservedWordCount: number
  updatedAtMs: number
}

export type TimedWritingPhase = 'running' | 'warning' | 'paused' | 'overtime'

export interface TimedWritingView {
  phase: TimedWritingPhase
  elapsedMs: number
  remainingMs: number
  overtimeMs: number
  isPaused: boolean
  isOvertime: boolean
  withinTimeWordCount: number
  totalWordCount: number
}

export interface TimedWritingResult {
  durationMs: number
  elapsedMs: number
  completedWithinLimit: boolean
  withinTimeWordCount: number
  totalWordCount: number
}

export interface TimedWritingStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function normalizedNow(nowMs: number): number {
  return Number.isFinite(nowMs) ? Math.max(0, Math.floor(nowMs)) : 0
}

function normalizedWordCount(count: number): number {
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
}

export function timedWritingDurationMs(estimatedMinutes: number): number {
  if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
    throw new RangeError('estimatedMinutes は0より大きい値にしてください。')
  }
  return Math.max(1, Math.round(estimatedMinutes * 60 * 1000))
}

export function createTimedWritingSnapshot(input: {
  taskId: string
  estimatedMinutes: number
  nowMs: number
  initialWordCount?: number
  running?: boolean
}): TimedWritingSnapshot {
  const nowMs = normalizedNow(input.nowMs)
  return {
    schemaVersion: TIMED_WRITING_SCHEMA_VERSION,
    taskId: input.taskId,
    durationMs: timedWritingDurationMs(input.estimatedMinutes),
    accumulatedMs: 0,
    runningSinceMs: input.running === false ? null : nowMs,
    withinTimeWordCount: null,
    lastObservedWordCount: normalizedWordCount(input.initialWordCount ?? 0),
    updatedAtMs: nowMs,
  }
}

export function timedWritingElapsedMs(
  snapshot: TimedWritingSnapshot,
  nowMs: number,
): number {
  if (snapshot.runningSinceMs === null) return snapshot.accumulatedMs
  return (
    snapshot.accumulatedMs +
    Math.max(0, normalizedNow(nowMs) - snapshot.runningSinceMs)
  )
}

export function observeTimedWriting(
  snapshot: TimedWritingSnapshot,
  nowMs: number,
  totalWordCount: number,
): TimedWritingSnapshot {
  const observedAt = normalizedNow(nowMs)
  const elapsedMs = timedWritingElapsedMs(snapshot, observedAt)
  const withinTimeWordCount =
    snapshot.withinTimeWordCount ??
    (elapsedMs >= snapshot.durationMs
      ? snapshot.lastObservedWordCount
      : null)
  return {
    ...snapshot,
    withinTimeWordCount,
    lastObservedWordCount: normalizedWordCount(totalWordCount),
    updatedAtMs: observedAt,
  }
}

export function pauseTimedWriting(
  snapshot: TimedWritingSnapshot,
  nowMs: number,
  totalWordCount: number,
): TimedWritingSnapshot {
  const observed = observeTimedWriting(snapshot, nowMs, totalWordCount)
  if (observed.runningSinceMs === null) return observed
  return {
    ...observed,
    accumulatedMs: timedWritingElapsedMs(observed, nowMs),
    runningSinceMs: null,
  }
}

export function resumeTimedWriting(
  snapshot: TimedWritingSnapshot,
  nowMs: number,
): TimedWritingSnapshot {
  if (snapshot.runningSinceMs !== null) return snapshot
  const resumedAt = normalizedNow(nowMs)
  return {
    ...snapshot,
    runningSinceMs: resumedAt,
    updatedAtMs: resumedAt,
  }
}

export function timedWritingView(
  snapshot: TimedWritingSnapshot,
  nowMs: number,
  totalWordCount: number,
): TimedWritingView {
  const elapsedMs = timedWritingElapsedMs(snapshot, nowMs)
  const remainingMs = Math.max(0, snapshot.durationMs - elapsedMs)
  const overtimeMs = Math.max(0, elapsedMs - snapshot.durationMs)
  const isOvertime = elapsedMs >= snapshot.durationMs
  const isPaused = snapshot.runningSinceMs === null
  const phase: TimedWritingPhase = isPaused
    ? 'paused'
    : isOvertime
      ? 'overtime'
      : remainingMs <= TIMED_WRITING_WARNING_MS
        ? 'warning'
        : 'running'
  return {
    phase,
    elapsedMs,
    remainingMs,
    overtimeMs,
    isPaused,
    isOvertime,
    withinTimeWordCount:
      snapshot.withinTimeWordCount ??
      (isOvertime
        ? snapshot.lastObservedWordCount
        : normalizedWordCount(totalWordCount)),
    totalWordCount: normalizedWordCount(totalWordCount),
  }
}

export function createTimedWritingResult(
  snapshot: TimedWritingSnapshot,
  nowMs: number,
  totalWordCount: number,
): TimedWritingResult {
  const observed = observeTimedWriting(snapshot, nowMs, totalWordCount)
  const view = timedWritingView(observed, nowMs, totalWordCount)
  return {
    durationMs: snapshot.durationMs,
    elapsedMs: view.elapsedMs,
    completedWithinLimit: view.elapsedMs <= snapshot.durationMs,
    withinTimeWordCount: view.withinTimeWordCount,
    totalWordCount: view.totalWordCount,
  }
}

export function timedWritingStorageKey(taskId: string): string {
  return `eisaku-lab:timed-writing:${encodeURIComponent(taskId)}`
}

function isSnapshot(value: unknown): value is TimedWritingSnapshot {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  const isNonNegativeFinite = (candidate: unknown): candidate is number =>
    typeof candidate === 'number' &&
    Number.isFinite(candidate) &&
    candidate >= 0
  return (
    item.schemaVersion === TIMED_WRITING_SCHEMA_VERSION &&
    typeof item.taskId === 'string' &&
    Number.isFinite(item.durationMs) &&
    typeof item.durationMs === 'number' &&
    item.durationMs > 0 &&
    isNonNegativeFinite(item.accumulatedMs) &&
    (item.runningSinceMs === null ||
      isNonNegativeFinite(item.runningSinceMs)) &&
    (item.withinTimeWordCount === null ||
      isNonNegativeFinite(item.withinTimeWordCount)) &&
    isNonNegativeFinite(item.lastObservedWordCount) &&
    isNonNegativeFinite(item.updatedAtMs)
  )
}

export function deserializeTimedWritingSnapshot(
  serialized: string,
  expected: { taskId: string; estimatedMinutes: number },
): TimedWritingSnapshot | null {
  try {
    const value: unknown = JSON.parse(serialized)
    if (!isSnapshot(value)) return null
    if (value.taskId !== expected.taskId) return null
    if (value.durationMs !== timedWritingDurationMs(expected.estimatedMinutes)) {
      return null
    }
    return value
  } catch {
    return null
  }
}

export function loadTimedWritingSnapshot(
  storage: TimedWritingStorage,
  taskId: string,
  estimatedMinutes: number,
): TimedWritingSnapshot | null {
  try {
    const serialized = storage.getItem(timedWritingStorageKey(taskId))
    return serialized
      ? deserializeTimedWritingSnapshot(serialized, {
          taskId,
          estimatedMinutes,
        })
      : null
  } catch {
    return null
  }
}

export function saveTimedWritingSnapshot(
  storage: TimedWritingStorage,
  snapshot: TimedWritingSnapshot,
): boolean {
  try {
    storage.setItem(
      timedWritingStorageKey(snapshot.taskId),
      JSON.stringify(snapshot),
    )
    return true
  } catch {
    return false
  }
}

export function removeTimedWritingSnapshot(
  storage: TimedWritingStorage,
  taskId: string,
): boolean {
  try {
    storage.removeItem(timedWritingStorageKey(taskId))
    return true
  } catch {
    return false
  }
}
