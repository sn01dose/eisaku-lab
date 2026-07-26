import { useState } from 'react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TimedWritingTimer,
  useTimedWritingTimer,
} from '../../features/writing/timed'

const MINUTE = 60_000

interface HarnessProps {
  taskId?: string
  estimatedMinutes?: number
  initialAnswer?: string
}

function Harness({
  taskId = 'wr-timed-ui',
  estimatedMinutes = 5,
  initialAnswer = 'We learn',
}: HarnessProps): React.JSX.Element {
  const [answer, setAnswer] = useState(initialAnswer)
  const timer = useTimedWritingTimer({
    taskId,
    estimatedMinutes,
    answer,
  })

  return (
    <>
      <TimedWritingTimer timer={timer} />
      <textarea
        aria-label="英文"
        disabled={timer.isPaused}
        onChange={(event) => setAnswer(event.target.value)}
        value={answer}
      />
    </>
  )
}

function countRow(label: string): HTMLElement {
  const term = screen.getByText(label)
  const row = term.parentElement
  if (!row) throw new Error(`${label} の語数行が見つかりません。`)
  return row
}

describe('TimedWritingTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-26T00:00:00.000Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.useRealTimers()
  })

  it('残り3分を琥珀表示し、0秒後も入力と計測を続ける', () => {
    render(<Harness />)
    expect(screen.getByRole('timer')).toHaveTextContent('残り 05:00')
    expect(countRow('時間内')).toHaveTextContent('2語')

    act(() => {
      vi.advanceTimersByTime(2 * MINUTE)
    })
    expect(screen.getByLabelText('制限時間')).toHaveClass(
      'timed-writing-timer--warning',
    )
    expect(screen.getByRole('timer')).toHaveTextContent('残り 03:00')

    fireEvent.change(screen.getByLabelText('英文'), {
      target: { value: 'We learn English' },
    })
    act(() => {
      vi.advanceTimersByTime(3 * MINUTE)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('時間超過 +00:00')
    expect(screen.getByLabelText('英文')).not.toBeDisabled()

    fireEvent.change(screen.getByLabelText('英文'), {
      target: { value: 'We learn English after the limit' },
    })
    expect(countRow('時間内')).toHaveTextContent('3語')
    expect(countRow('総語数')).toHaveTextContent('6語')

    act(() => {
      vi.advanceTimersByTime(MINUTE)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('時間超過 +01:00')
    expect(screen.getByText(/そのまま書き続けられます/)).toBeVisible()
  })

  it('中断状態を保存し、再表示後も停止時間を数えない', () => {
    const first = render(
      <Harness
        estimatedMinutes={10}
        initialAnswer="Public transport is useful"
        taskId="wr-timed-resume"
      />,
    )

    act(() => {
      vi.advanceTimersByTime(2 * MINUTE)
    })
    fireEvent.click(screen.getByRole('button', { name: '中断する' }))
    expect(screen.getByRole('timer')).toHaveTextContent('中断中 残り 08:00')
    expect(screen.getByLabelText('英文')).toBeDisabled()
    first.unmount()

    act(() => {
      vi.advanceTimersByTime(5 * MINUTE)
    })
    render(
      <Harness
        estimatedMinutes={10}
        initialAnswer="Public transport is useful"
        taskId="wr-timed-resume"
      />,
    )
    expect(screen.getByRole('timer')).toHaveTextContent('中断中 残り 08:00')

    fireEvent.click(screen.getByRole('button', { name: '再開する' }))
    act(() => {
      vi.advanceTimersByTime(MINUTE)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('残り 07:00')
  })
})
