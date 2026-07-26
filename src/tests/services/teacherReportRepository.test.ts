import { describe, expect, it } from 'vitest'
import type { WeeklySnapshot } from '../../domain/report/types'
import type { LearningReportPayload } from '../../services/report'
import {
  TEACHER_REPORT_STORAGE_KEY,
  TeacherReportRepository,
  type TeacherReportStorage,
} from '../../services/report/teacherReportRepository'
import { STORAGE_KEY } from '../../services/storage'

class MemoryStorage implements TeacherReportStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

function snapshot(
  weekStart: string,
  wordStableCount: number,
): WeeklySnapshot {
  return {
    weekStart,
    studiedDays: 5,
    totalMinutes: 150,
    spellingAttempts: 100,
    spellingRecallAccuracy: 0.72,
    wordStableCount,
    writingAttempts: 20,
    paragraphCount: 2,
    supportLevel: 4,
    withinLimitWordsAvg: 75,
    topErrorTags: [{ tag: 'article', count: 4 }],
    stage: 3,
  }
}

function payload(...snapshots: WeeklySnapshot[]): LearningReportPayload {
  return {
    version: 1,
    snapshots,
    plan: null,
    stableSkillIds: ['spelling.suffix'],
    unresolvedNoteCount: 3,
  }
}

describe('TeacherReportRepository', () => {
  it('stores teacher imports under a separate key without changing AppState', () => {
    const storage = new MemoryStorage()
    const learnerState = '{"schemaVersion":3,"profile":{"nickname":"非共有"}}'
    storage.setItem(STORAGE_KEY, learnerState)
    const repository = new TeacherReportRepository(storage)

    repository.importPayload(
      payload(snapshot('2026-07-20', 61)),
      '2026-07-27T09:00:00.000Z',
    )

    expect(storage.getItem(TEACHER_REPORT_STORAGE_KEY)).not.toBeNull()
    expect(storage.getItem(STORAGE_KEY)).toBe(learnerState)
    expect(repository.load()).toMatchObject([
      {
        weekStart: '2026-07-20',
        importedAt: '2026-07-27T09:00:00.000Z',
        unresolvedNoteCount: 3,
        stableSkillIds: ['spelling.suffix'],
      },
    ])
  })

  it('accumulates weeks in date order and replaces a repeated week', () => {
    const repository = new TeacherReportRepository(new MemoryStorage())
    repository.importPayload(
      payload(
        snapshot('2026-07-20', 61),
        snapshot('2026-07-13', 47),
      ),
      '2026-07-27T09:00:00.000Z',
    )
    const updated = repository.importPayload(
      payload(snapshot('2026-07-20', 65)),
      '2026-07-28T09:00:00.000Z',
    )

    expect(updated.map(({ weekStart }) => weekStart)).toEqual([
      '2026-07-13',
      '2026-07-20',
    ])
    expect(updated[1]).toMatchObject({
      importedAt: '2026-07-28T09:00:00.000Z',
      snapshot: { wordStableCount: 65 },
    })
  })

  it('removes only the selected imported week and can clear the archive', () => {
    const storage = new MemoryStorage()
    const repository = new TeacherReportRepository(storage)
    repository.importPayload(
      payload(
        snapshot('2026-07-13', 47),
        snapshot('2026-07-20', 61),
      ),
    )

    expect(repository.removeWeek('2026-07-13')).toHaveLength(1)
    expect(repository.load()[0]?.weekStart).toBe('2026-07-20')

    repository.clear()
    expect(repository.load()).toEqual([])
    expect(storage.getItem(TEACHER_REPORT_STORAGE_KEY)).toBeNull()
  })

  it('ignores a broken teacher archive without touching learner data', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{"learner":"kept"}')
    storage.setItem(TEACHER_REPORT_STORAGE_KEY, '{broken')
    const repository = new TeacherReportRepository(storage)

    expect(repository.load()).toEqual([])
    expect(storage.getItem(STORAGE_KEY)).toBe('{"learner":"kept"}')
  })
})
