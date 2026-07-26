import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { wordCount } from '../../../utils/format'
import {
  createTimedWritingResult,
  createTimedWritingSnapshot,
  loadTimedWritingSnapshot,
  observeTimedWriting,
  pauseTimedWriting,
  removeTimedWritingSnapshot,
  resumeTimedWriting,
  saveTimedWritingSnapshot,
  timedWritingDurationMs,
  timedWritingView,
  type TimedWritingResult,
  type TimedWritingSnapshot,
  type TimedWritingStorage,
  type TimedWritingView,
} from './model'

export interface UseTimedWritingTimerOptions {
  taskId: string
  estimatedMinutes: number
  answer: string
  storage?: TimedWritingStorage | null
  tickMs?: number
  now?: () => number
  onSnapshotChange?: (snapshot: TimedWritingSnapshot) => void
}

export interface TimedWritingController extends TimedWritingView {
  snapshot: TimedWritingSnapshot
  pause: () => void
  resume: () => void
  restart: () => void
  clear: () => void
  result: () => TimedWritingResult
}

function browserStorage(): TimedWritingStorage | null {
  return typeof window === 'undefined' ? null : window.localStorage
}

export function useTimedWritingTimer({
  taskId,
  estimatedMinutes,
  answer,
  storage = browserStorage(),
  tickMs = 1000,
  now = Date.now,
  onSnapshotChange,
}: UseTimedWritingTimerOptions): TimedWritingController {
  const totalWordCount = wordCount(answer)
  const clearedRef = useRef(false)
  const durationMs = timedWritingDurationMs(estimatedMinutes)
  const timerKey = `${encodeURIComponent(taskId)}:${durationMs}`
  const seedSnapshot = useMemo(() => {
    const restored = storage
      ? loadTimedWritingSnapshot(storage, taskId, estimatedMinutes)
      : null
    return (
      restored ??
      createTimedWritingSnapshot({
        taskId,
        estimatedMinutes,
        nowMs: now(),
        initialWordCount: 0,
      })
    )
  }, [
    estimatedMinutes,
    now,
    storage,
    taskId,
  ])
  const [snapshots, setSnapshots] = useState<
    Record<string, TimedWritingSnapshot>
  >(() => ({ [timerKey]: seedSnapshot }))
  const snapshot = snapshots[timerKey] ?? seedSnapshot
  const updateSnapshot = useCallback(
    (
      update: (
        current: TimedWritingSnapshot,
      ) => TimedWritingSnapshot,
    ) => {
      setSnapshots((current) => ({
        ...current,
        [timerKey]: update(current[timerKey] ?? seedSnapshot),
      }))
    },
    [seedSnapshot, timerKey],
  )

  useEffect(() => {
    if (snapshot.runningSinceMs === null) return
    const timerId = window.setInterval(() => {
      const observedAt = now()
      updateSnapshot((current) =>
        observeTimedWriting(current, observedAt, totalWordCount),
      )
    }, Math.max(250, tickMs))
    return () => window.clearInterval(timerId)
  }, [
    now,
    snapshot.runningSinceMs,
    tickMs,
    totalWordCount,
    updateSnapshot,
  ])

  useEffect(() => {
    if (storage) saveTimedWritingSnapshot(storage, snapshot)
    onSnapshotChange?.(snapshot)
  }, [onSnapshotChange, snapshot, storage])

  const pause = useCallback(() => {
    if (clearedRef.current) return
    const pausedAt = now()
    const paused = pauseTimedWriting(snapshot, pausedAt, totalWordCount)
    if (storage) saveTimedWritingSnapshot(storage, paused)
    setSnapshots((current) => ({
      ...current,
      [timerKey]: paused,
    }))
  }, [now, snapshot, storage, timerKey, totalWordCount])

  const resume = useCallback(() => {
    const resumedAt = now()
    updateSnapshot((current) => resumeTimedWriting(current, resumedAt))
  }, [now, updateSnapshot])

  const restart = useCallback(() => {
    clearedRef.current = false
    if (storage) removeTimedWritingSnapshot(storage, taskId)
    const restarted =
      createTimedWritingSnapshot({
        taskId,
        estimatedMinutes,
        nowMs: now(),
        initialWordCount: totalWordCount,
      })
    setSnapshots((current) => ({
      ...current,
      [timerKey]: restarted,
    }))
  }, [
    estimatedMinutes,
    now,
    storage,
    taskId,
    timerKey,
    totalWordCount,
  ])

  const result = useCallback(
    () => createTimedWritingResult(snapshot, now(), totalWordCount),
    [now, snapshot, totalWordCount],
  )

  const clear = useCallback(() => {
    clearedRef.current = true
    if (storage) removeTimedWritingSnapshot(storage, taskId)
  }, [storage, taskId])

  const view = useMemo(
    () => timedWritingView(snapshot, now(), totalWordCount),
    [now, snapshot, totalWordCount],
  )

  return {
    ...view,
    snapshot,
    pause,
    resume,
    restart,
    clear,
    result,
  }
}
