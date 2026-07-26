import type { SkillId } from '../../domain/learner/types'
import type { WeeklySnapshot } from '../../domain/report/types'
import type {
  LearningReportPayload,
  ReportPlanSummary,
} from './types'

export const TEACHER_REPORT_STORAGE_KEY = 'eisaku-lab:teacher-reports'
const TEACHER_REPORT_SCHEMA_VERSION = 1

export interface TeacherReportStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface TeacherReportWeek {
  weekStart: string
  snapshot: WeeklySnapshot
  importedAt: string
  plan: ReportPlanSummary | null
  stableSkillIds: SkillId[]
  unresolvedNoteCount: number
}

interface TeacherReportArchive {
  schemaVersion: typeof TEACHER_REPORT_SCHEMA_VERSION
  weeks: TeacherReportWeek[]
}

function browserStorage(): TeacherReportStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isSnapshot(value: unknown): value is WeeklySnapshot {
  if (!isRecord(value)) return false
  return (
    typeof value.weekStart === 'string' &&
    isFiniteNumber(value.studiedDays) &&
    isFiniteNumber(value.totalMinutes) &&
    isFiniteNumber(value.spellingAttempts) &&
    isFiniteNumber(value.spellingRecallAccuracy) &&
    isFiniteNumber(value.wordStableCount) &&
    isFiniteNumber(value.writingAttempts) &&
    isFiniteNumber(value.paragraphCount) &&
    isFiniteNumber(value.supportLevel) &&
    (value.withinLimitWordsAvg === null ||
      isFiniteNumber(value.withinLimitWordsAvg)) &&
    Array.isArray(value.topErrorTags) &&
    value.topErrorTags.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.tag === 'string' &&
        isFiniteNumber(entry.count),
    ) &&
    isFiniteNumber(value.stage)
  )
}

function isWeek(value: unknown): value is TeacherReportWeek {
  return (
    isRecord(value) &&
    typeof value.weekStart === 'string' &&
    typeof value.importedAt === 'string' &&
    isSnapshot(value.snapshot) &&
    (value.plan === null || isRecord(value.plan)) &&
    Array.isArray(value.stableSkillIds) &&
    value.stableSkillIds.every((skillId) => typeof skillId === 'string') &&
    isFiniteNumber(value.unresolvedNoteCount)
  )
}

function cloneWeek(week: TeacherReportWeek): TeacherReportWeek {
  return {
    ...week,
    snapshot: {
      ...week.snapshot,
      topErrorTags: week.snapshot.topErrorTags.map((entry) => ({ ...entry })),
    },
    plan: week.plan
      ? {
          ...week.plan,
          stageWindows: week.plan.stageWindows.map((window) => ({ ...window })),
        }
      : null,
    stableSkillIds: [...week.stableSkillIds],
  }
}

function normalizeWeeks(value: unknown): TeacherReportWeek[] {
  if (
    !isRecord(value) ||
    value.schemaVersion !== TEACHER_REPORT_SCHEMA_VERSION ||
    !Array.isArray(value.weeks)
  ) {
    return []
  }
  const byWeek = new Map<string, TeacherReportWeek>()
  value.weeks.filter(isWeek).forEach((week) => {
    if (week.snapshot.weekStart === week.weekStart) {
      byWeek.set(week.weekStart, cloneWeek(week))
    }
  })
  return [...byWeek.values()].sort((left, right) =>
    left.weekStart.localeCompare(right.weekStart),
  )
}

export class TeacherReportRepository {
  private readonly storage: TeacherReportStorage | null
  private readonly key: string
  private memoryWeeks: TeacherReportWeek[] = []

  constructor(
    storage: TeacherReportStorage | null = browserStorage(),
    key = TEACHER_REPORT_STORAGE_KEY,
  ) {
    this.storage = storage
    this.key = key
  }

  load(): TeacherReportWeek[] {
    if (!this.storage) return this.memoryWeeks.map(cloneWeek)
    try {
      const serialized = this.storage.getItem(this.key)
      return serialized ? normalizeWeeks(JSON.parse(serialized)) : []
    } catch {
      return []
    }
  }

  importPayload(
    payload: LearningReportPayload,
    importedAt = new Date().toISOString(),
  ): TeacherReportWeek[] {
    if (payload.version !== 1) {
      throw new Error('このレポートの書式バージョンには対応していません。')
    }
    if (payload.snapshots.length === 0) {
      throw new Error('レポートに週の集計が含まれていません。')
    }
    const byWeek = new Map(
      this.load().map((week) => [week.weekStart, week] as const),
    )
    payload.snapshots.forEach((snapshot) => {
      byWeek.set(snapshot.weekStart, {
        weekStart: snapshot.weekStart,
        snapshot: {
          ...snapshot,
          topErrorTags: snapshot.topErrorTags.map((entry) => ({ ...entry })),
        },
        importedAt,
        plan: payload.plan
          ? {
              ...payload.plan,
              stageWindows: payload.plan.stageWindows.map((window) => ({
                ...window,
              })),
            }
          : null,
        stableSkillIds: [...payload.stableSkillIds],
        unresolvedNoteCount: Math.max(0, payload.unresolvedNoteCount),
      })
    })
    return this.save([...byWeek.values()])
  }

  removeWeek(weekStart: string): TeacherReportWeek[] {
    return this.save(
      this.load().filter((week) => week.weekStart !== weekStart),
    )
  }

  clear(): void {
    this.memoryWeeks = []
    try {
      this.storage?.removeItem(this.key)
    } catch {
      // Memory state is still cleared when browser storage is unavailable.
    }
  }

  private save(weeks: readonly TeacherReportWeek[]): TeacherReportWeek[] {
    const normalized = [...weeks]
      .map(cloneWeek)
      .sort((left, right) => left.weekStart.localeCompare(right.weekStart))
    const archive: TeacherReportArchive = {
      schemaVersion: TEACHER_REPORT_SCHEMA_VERSION,
      weeks: normalized,
    }
    this.memoryWeeks = normalized.map(cloneWeek)
    try {
      this.storage?.setItem(this.key, JSON.stringify(archive))
    } catch {
      // Keep the in-memory copy so the current view remains usable.
    }
    return normalized.map(cloneWeek)
  }
}

let defaultRepository: TeacherReportRepository | null = null

export function getTeacherReportRepository(): TeacherReportRepository {
  defaultRepository ??= new TeacherReportRepository()
  return defaultRepository
}
