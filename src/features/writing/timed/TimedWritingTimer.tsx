import type { TimedWritingController } from './useTimedWritingTimer'
import { formatTimedWritingClock } from './format'
import './timed-writing.css'

export interface TimedWritingTimerProps {
  timer: TimedWritingController
  className?: string
}

export function TimedWritingTimer({
  timer,
  className,
}: TimedWritingTimerProps): React.JSX.Element {
  const pausedClock = timer.isOvertime
    ? `+${formatTimedWritingClock(timer.overtimeMs)}`
    : `残り ${formatTimedWritingClock(timer.remainingMs)}`
  const clockLabel = timer.isPaused
    ? `中断中 ${pausedClock}`
    : timer.isOvertime
      ? `時間超過 +${formatTimedWritingClock(timer.overtimeMs)}`
      : `残り ${formatTimedWritingClock(timer.remainingMs)}`
  const notice =
    timer.phase === 'warning'
      ? '残り3分以内です。結論と見直しを優先しましょう。'
      : timer.isOvertime
        ? '制限時間を過ぎても、そのまま書き続けられます。'
        : timer.isPaused
          ? 'タイマーを中断しています。再開すると続きから計測します。'
          : '時間配分を確認しながら書きましょう。'

  return (
    <section
      aria-label="制限時間"
      className={[
        'timed-writing-timer',
        `timed-writing-timer--${timer.phase}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="timed-writing-timer__main">
        <div>
          <p className="timed-writing-timer__label">制限時間</p>
          <p
            aria-label={clockLabel}
            className="timed-writing-timer__clock"
            role="timer"
          >
            {clockLabel}
          </p>
        </div>
        <button
          className="timed-writing-timer__control"
          onClick={timer.isPaused ? timer.resume : timer.pause}
          type="button"
        >
          {timer.isPaused ? '再開する' : '中断する'}
        </button>
      </div>

      <p aria-live="polite" className="timed-writing-timer__notice">
        {notice}
      </p>

      <dl className="timed-writing-timer__counts">
        <div>
          <dt>時間内</dt>
          <dd>{timer.withinTimeWordCount}語</dd>
        </div>
        <div>
          <dt>総語数</dt>
          <dd>{timer.totalWordCount}語</dd>
        </div>
      </dl>
    </section>
  )
}
