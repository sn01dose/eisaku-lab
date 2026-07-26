import {
  useEffect,
  useRef,
  type MutableRefObject,
} from 'react'
import type { WritingTask } from '../../../domain/learner/types'
import { TimedWritingTimer } from './TimedWritingTimer'
import {
  useTimedWritingTimer,
  type TimedWritingController,
} from './useTimedWritingTimer'

export function TimedTaskClock({
  task,
  answer,
  controllerRef,
  onPausedChange,
}: {
  task: WritingTask
  answer: string
  controllerRef: MutableRefObject<TimedWritingController | null>
  onPausedChange?: (paused: boolean) => void
}): React.JSX.Element {
  const timer = useTimedWritingTimer({
    taskId: task.id,
    estimatedMinutes: task.estimatedMinutes,
    answer,
  })
  const latestTimer = useRef(timer)

  useEffect(() => {
    latestTimer.current = timer
    controllerRef.current = timer
  }, [controllerRef, timer])

  useEffect(() => {
    onPausedChange?.(timer.isPaused)
  }, [onPausedChange, timer.isPaused])

  useEffect(
    () => () => {
      latestTimer.current.pause()
      controllerRef.current = null
    },
    [controllerRef],
  )

  return <TimedWritingTimer timer={timer} />
}
