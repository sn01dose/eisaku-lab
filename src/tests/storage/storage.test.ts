import { describe, expect, it } from 'vitest'
import type { Attempt } from '../../domain/learner/types'
import {
  createInitialState,
  CURRENT_SCHEMA_VERSION,
  migrateState,
} from '../../services/storage/migrations'
import {
  AppStateRepository,
  type StorageLike,
} from '../../services/storage/repository'
import {
  exportStateToJson,
  importStateFromJson,
} from '../../services/export/jsonBackup'
import {
  exportAttemptsToCsv,
  exportProgressToCsv,
} from '../../services/export/progressCsv'

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

const now = new Date('2026-07-20T12:00:00.000Z')

function attempt(index: number): Attempt {
  return {
    id: `attempt-${index}`,
    at: now.toISOString(),
    kind: 'spelling',
    refId: 'sp-0001',
    isRecall: true,
    input: 'developement',
    correct: false,
    hintLevelUsed: 0,
    responseTimeMs: 3200,
    errorTags: ['suffix'],
    skillIds: ['spelling.suffix'],
  }
}

describe('migrateState', () => {
  it('version なしの保存データを現行versionへ移行する', () => {
    const migrated = migrateState(
      {
        profile: { nickname: '凪', dailyMinutes: 30 },
        attempts: [attempt(1)],
      },
      now,
    )
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(migrated.profile?.nickname).toBe('凪')
    expect(migrated.attempts).toHaveLength(1)
    expect(Object.keys(migrated.mastery).length).toBeGreaterThan(20)
  })

  it('version 1へ計画とカスタム語彙の初期値を補って移行する', () => {
    const migrated = migrateState(
      {
        schemaVersion: 1,
        profile: { nickname: 'ハンギョドン', dailyMinutes: 30 },
        attempts: [attempt(1)],
      },
      now,
    )

    expect(migrated).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      plan: null,
      weeklySnapshots: [],
      customSpellingWords: {},
    })
    expect(migrated.attempts).toHaveLength(1)
  })

  it('version 2へ週次スナップショットの初期値を補う', () => {
    const migrated = migrateState(
      {
        schemaVersion: 2,
        profile: { nickname: 'ハンギョドン', dailyMinutes: 30 },
      },
      now,
    )

    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(migrated.weeklySnapshots).toEqual([])
  })

  it('未来versionのデータを拒否する', () => {
    expect(() =>
      migrateState({ schemaVersion: CURRENT_SCHEMA_VERSION + 1 }),
    ).toThrow(/新しい形式/)
  })
})

describe('AppStateRepository', () => {
  it('保存後に同じ状態を復元する', () => {
    const storage = new MemoryStorage()
    const repository = new AppStateRepository(storage)
    const state = createInitialState(now)
    state.attempts.push(attempt(1))
    repository.save(state)
    expect(repository.load()).toEqual(state)
  })

  it('attemptsを直近1000件に制限する', () => {
    const repository = new AppStateRepository(new MemoryStorage())
    const state = createInitialState(now)
    state.attempts = Array.from({ length: 1002 }, (_, index) => attempt(index))
    const saved = repository.save(state)
    expect(saved.attempts).toHaveLength(1000)
    expect(saved.attempts[0].id).toBe('attempt-2')
  })

  it('週が切り替わった保存時に前週のスナップショットを生成する', () => {
    const repository = new AppStateRepository(
      new MemoryStorage(),
      'eisaku-lab:test-weekly',
      () => new Date('2026-07-20T12:00:00.000Z'),
    )
    const state = createInitialState(
      new Date('2026-07-13T12:00:00.000Z'),
    )
    state.profile = {
      nickname: 'ハンギョドン',
      dailyMinutes: 30,
      goal: 'selective',
      useSpeech: false,
      targetDate: null,
      currentStage: 3,
      recommendedStage: 3,
      supportLevel: 3,
      createdAt: '2026-07-13T12:00:00.000Z',
    }
    state.attempts = [
      {
        ...attempt(1),
        at: '2026-07-14T12:00:00.000Z',
      },
    ]

    const saved = repository.save(state)

    expect(saved.weeklySnapshots).toHaveLength(1)
    expect(saved.weeklySnapshots[0]).toMatchObject({
      weekStart: '2026-07-13',
      studiedDays: 1,
      spellingAttempts: 1,
    })
  })

  it('壊れた保存値では初期状態へ安全に戻る', () => {
    const storage = new MemoryStorage()
    storage.setItem('eisaku-lab:state', '{broken')
    const repository = new AppStateRepository(storage)
    expect(repository.load()).toMatchObject({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profile: null,
    })
  })
})

describe('バックアップとCSV', () => {
  it('JSON export → import で同一状態に戻る', () => {
    const state = createInitialState(now)
    state.attempts.push(attempt(1))
    const restored = importStateFromJson(exportStateToJson(state))
    expect(restored).toEqual(state)
  })

  it('不正なJSONには読みやすいエラーを返す', () => {
    expect(() => importStateFromJson('{')).toThrow(/JSONを読み取れません/)
  })

  it('進捗と解答履歴をCSVへ出力する', () => {
    const state = createInitialState(now)
    state.attempts.push(attempt(1))
    expect(exportProgressToCsv(state)).toContain('技能ID,習熟度')
    expect(exportAttemptsToCsv(state)).toContain('developement')
    expect(exportAttemptsToCsv(state)).toContain('suffix')
  })
})
