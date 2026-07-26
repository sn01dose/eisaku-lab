import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppStateProvider } from '../../app/providers/AppStateProvider'
import type { AppState, WritingTask } from '../../domain/learner/types'
import { WritingTrainer } from '../../features/writing/WritingTrainer'
import { STORAGE_KEY } from '../../services/storage/repository'

const timedTask: WritingTask = {
  id: 'wr-timed-integration',
  stage: 6,
  type: 'timed',
  promptJa: '時間を意識して、毎日の学習について書きなさい。',
  simplifiedJapanese: ['私は毎日英語を勉強します。'],
  modelAnswers: [
    'I study English every day.',
    'Every day, I spend time studying English.',
  ],
  requiredSkills: ['writing.argument'],
  commonErrors: ['wordOrder'],
  explanation: '知っている語で短く正確に書けば十分です。',
  estimatedMinutes: 0.1,
  theme: '勉強法',
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('timed writing integration', () => {
  it(
    'disables the real answer field while the timer is paused',
    () => {
      render(
        <AppStateProvider>
          <WritingTrainer tasks={[timedTask]} spellingWords={[]} />
        </AppStateProvider>,
      )

      const answer = screen.getByRole('textbox', { name: /^解答欄/ })
      fireEvent.click(screen.getByRole('button', { name: '中断する' }))
      expect(answer).toBeDisabled()
      fireEvent.click(screen.getByRole('button', { name: '再開する' }))
      expect(answer).not.toBeDisabled()
    },
    15_000,
  )

  it('stores words written within the limit separately from total words', () => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-26T12:00:00'))
    render(
      <AppStateProvider>
        <WritingTrainer tasks={[timedTask]} spellingWords={[]} />
      </AppStateProvider>,
    )

    const answer = screen.getByRole('textbox', { name: /^解答欄/ })
    fireEvent.change(answer, { target: { value: 'I study' } })
    act(() => vi.advanceTimersByTime(3_000))
    act(() => vi.advanceTimersByTime(4_000))
    expect(answer).not.toBeDisabled()
    fireEvent.change(answer, {
      target: { value: 'I study English every day.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '答え合わせ' }))

    const serialized = window.localStorage.getItem(STORAGE_KEY)
    expect(serialized).not.toBeNull()
    const saved = JSON.parse(serialized ?? '{}') as AppState
    expect(saved.attempts.at(-1)).toMatchObject({
      kind: 'writing',
      refId: timedTask.id,
      withinLimitWordCount: 2,
      totalWordCount: 5,
    })
  })
})
