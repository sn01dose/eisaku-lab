import { describe, expect, it } from 'vitest'
import {
  createTimedWritingResult,
  createTimedWritingSnapshot,
  deserializeTimedWritingSnapshot,
  loadTimedWritingSnapshot,
  observeTimedWriting,
  pauseTimedWriting,
  resumeTimedWriting,
  saveTimedWritingSnapshot,
  timedWritingDurationMs,
  timedWritingElapsedMs,
  timedWritingStorageKey,
  timedWritingView,
  type TimedWritingStorage,
} from '../../features/writing/timed'

const MINUTE = 60_000

function createMemoryStorage(): TimedWritingStorage & {
  values: Map<string, string>
} {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

describe('制限時間作文の純粋ロジック', () => {
  it('estimatedMinutes をミリ秒へ変換し、不正値を拒否する', () => {
    expect(timedWritingDurationMs(12)).toBe(12 * MINUTE)
    expect(timedWritingDurationMs(0.5)).toBe(30_000)
    expect(() => timedWritingDurationMs(0)).toThrow(RangeError)
    expect(() => timedWritingDurationMs(Number.NaN)).toThrow(RangeError)
  })

  it('残り3分から警告し、0秒後も超過時間を計測する', () => {
    const snapshot = createTimedWritingSnapshot({
      taskId: 'wr-timed-01',
      estimatedMinutes: 5,
      nowMs: 1_000,
      initialWordCount: 2,
    })

    expect(timedWritingView(snapshot, 1_000, 2).phase).toBe('running')
    const warning = timedWritingView(snapshot, 1_000 + 2 * MINUTE, 2)
    expect(warning.phase).toBe('warning')
    expect(warning.remainingMs).toBe(3 * MINUTE)

    const overtime = timedWritingView(
      snapshot,
      1_000 + 5 * MINUTE + 30_000,
      7,
    )
    expect(overtime.phase).toBe('overtime')
    expect(overtime.remainingMs).toBe(0)
    expect(overtime.overtimeMs).toBe(30_000)
  })

  it('期限時点の語数を固定し、期限後の語数は総語数だけに加える', () => {
    const started = createTimedWritingSnapshot({
      taskId: 'wr-timed-02',
      estimatedMinutes: 5,
      nowMs: 0,
      initialWordCount: 2,
    })
    const justBefore = observeTimedWriting(
      started,
      5 * MINUTE - 1_000,
      6,
    )
    const atLimit = observeTimedWriting(justBefore, 5 * MINUTE, 6)
    const continued = observeTimedWriting(atLimit, 6 * MINUTE, 10)
    const view = timedWritingView(continued, 6 * MINUTE, 10)

    expect(view.withinTimeWordCount).toBe(6)
    expect(view.totalWordCount).toBe(10)
    expect(view.isOvertime).toBe(true)
  })

  it('中断中の時間を加算せず、再開後は続きから計測する', () => {
    const started = createTimedWritingSnapshot({
      taskId: 'wr-timed-03',
      estimatedMinutes: 10,
      nowMs: 0,
    })
    const paused = pauseTimedWriting(started, 2 * MINUTE, 4)

    expect(paused.runningSinceMs).toBeNull()
    expect(timedWritingElapsedMs(paused, 20 * MINUTE)).toBe(2 * MINUTE)
    expect(timedWritingView(paused, 20 * MINUTE, 4).phase).toBe('paused')

    const resumed = resumeTimedWriting(paused, 20 * MINUTE)
    expect(timedWritingElapsedMs(resumed, 21 * MINUTE)).toBe(3 * MINUTE)
  })

  it('提出時に時間内完了と時間内・総語数を記録できる', () => {
    const started = createTimedWritingSnapshot({
      taskId: 'wr-timed-04',
      estimatedMinutes: 5,
      nowMs: 0,
      initialWordCount: 3,
    })
    const beforeLimit = createTimedWritingResult(
      started,
      4 * MINUTE,
      18,
    )
    expect(beforeLimit).toMatchObject({
      completedWithinLimit: true,
      withinTimeWordCount: 18,
      totalWordCount: 18,
    })

    const observed = observeTimedWriting(started, 4 * MINUTE, 18)
    const overtime = createTimedWritingResult(
      observed,
      6 * MINUTE,
      24,
    )
    expect(overtime).toMatchObject({
      completedWithinLimit: false,
      withinTimeWordCount: 18,
      totalWordCount: 24,
    })
  })
})

describe('制限時間作文の永続化', () => {
  it('同じ課題・制限時間のスナップショットだけを復元する', () => {
    const storage = createMemoryStorage()
    const snapshot = pauseTimedWriting(
      createTimedWritingSnapshot({
        taskId: 'wr-timed-save',
        estimatedMinutes: 8,
        nowMs: 10_000,
      }),
      70_000,
      12,
    )

    expect(saveTimedWritingSnapshot(storage, snapshot)).toBe(true)
    expect(loadTimedWritingSnapshot(storage, 'wr-timed-save', 8)).toEqual(
      snapshot,
    )
    expect(loadTimedWritingSnapshot(storage, 'wr-timed-save', 9)).toBeNull()
  })

  it('壊れたJSONや不正な数値を復元しない', () => {
    const expected = { taskId: 'wr-timed-invalid', estimatedMinutes: 5 }
    expect(deserializeTimedWritingSnapshot('{broken', expected)).toBeNull()

    const invalid = {
      ...createTimedWritingSnapshot({
        taskId: expected.taskId,
        estimatedMinutes: expected.estimatedMinutes,
        nowMs: 0,
      }),
      accumulatedMs: -1,
    }
    expect(
      deserializeTimedWritingSnapshot(JSON.stringify(invalid), expected),
    ).toBeNull()
  })

  it('課題IDを安全な保存キーへ変換する', () => {
    expect(timedWritingStorageKey('wr 01/意見')).toBe(
      'eisaku-lab:timed-writing:wr%2001%2F%E6%84%8F%E8%A6%8B',
    )
  })
})
