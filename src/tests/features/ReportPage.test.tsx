import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../../domain/learner/types'
import { addDays } from '../../domain/plan/buildStudyPlan'
import { weekStartKey } from '../../domain/report/weeklySnapshot'
import type { WeeklySnapshot } from '../../domain/report/types'
import { createInitialState } from '../../services/storage'
import { ReportPage } from '../../pages/ReportPage'

const mockedContext = vi.hoisted(() => ({
  state: null as AppState | null,
}))

vi.mock('../../app/providers/AppStateProvider', () => ({
  useAppState: () => {
    if (!mockedContext.state) {
      throw new Error('テスト用の AppState が設定されていません。')
    }
    return {
      state: mockedContext.state,
      updateState: vi.fn(),
      replaceState: vi.fn(),
      clearData: vi.fn(),
    }
  },
}))

vi.mock('../../data/writing', () => ({
  writingTasks: [],
}))

vi.mock('../../services/report', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../services/report')>()
  return {
    ...actual,
    encodeReportDataForSharing: vi
      .fn()
      .mockResolvedValue('ELR1.encoded-report-data'),
  }
})

const ESSAY_BODY =
  'I can explain my opinion with words that I know and use well.'

function snapshot(
  weekStart: string,
  overrides: Partial<WeeklySnapshot> = {},
): WeeklySnapshot {
  return {
    weekStart,
    studiedDays: 5,
    totalMinutes: 155,
    spellingAttempts: 148,
    spellingRecallAccuracy: 0.71,
    wordStableCount: 61,
    writingAttempts: 26,
    paragraphCount: 2,
    supportLevel: 4,
    withinLimitWordsAvg: 78,
    topErrorTags: [
      { tag: 'thirdPersonS', count: 8 },
      { tag: 'article', count: 6 },
    ],
    stage: 3,
    ...overrides,
  }
}

function reportState(): AppState {
  const now = new Date()
  const currentWeek = weekStartKey(now)
  const previousWeek = addDays(currentWeek, -7)
  const state = createInitialState(now)
  return {
    ...state,
    profile: {
      nickname: '共有しない名前',
      dailyMinutes: 30,
      goal: 'university',
      useSpeech: true,
      targetDate: null,
      currentStage: 3,
      recommendedStage: 3,
      supportLevel: 4,
      createdAt: `${previousWeek}T09:00:00.000Z`,
    },
    weeklySnapshots: [
      snapshot(previousWeek, {
        spellingRecallAccuracy: 0.64,
        wordStableCount: 47,
        supportLevel: 3,
        withinLimitWordsAvg: 61,
      }),
      snapshot(currentWeek),
    ],
    essays: [
      {
        id: 'essay:report-test',
        taskId: 'wr-0001',
        stage: 3,
        answer: ESSAY_BODY,
        createdAt: `${addDays(currentWeek, 1)}T10:00:00.000Z`,
        updatedAt: `${addDays(currentWeek, 1)}T10:00:00.000Z`,
        feedback: null,
      },
    ],
  }
}

function essayToggle(): HTMLInputElement {
  return screen.getByRole('checkbox', {
    name: /英作文の本文を含める/,
  })
}

function transferToggle(): HTMLInputElement {
  return screen.getByRole('checkbox', {
    name: /取り込み用データを付ける/,
  })
}

beforeEach(() => {
  mockedContext.state = reportState()
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: undefined,
  })
})

afterEach(() => {
  cleanup()
  mockedContext.state = null
  vi.restoreAllMocks()
})

describe('ReportPage', () => {
  it('keeps essay text off and transfer data on by default, with the full report visible', () => {
    render(<ReportPage />)

    expect(essayToggle()).not.toBeChecked()
    expect(transferToggle()).toBeChecked()

    const preview = screen.getByLabelText('共有されるレポート全文')
    expect(preview).toHaveTextContent('英作ラボ 学習レポート')
    expect(preview).toHaveTextContent('■ 今週')
    expect(preview).toHaveTextContent('■ スペリング')
    expect(preview).toHaveTextContent('■ 英作文')
    expect(preview).toHaveTextContent('■ 繰り返している誤り')
    expect(preview).toHaveTextContent('---DATA---')
    expect(preview.textContent).toMatch(/\bELR1\./u)
    expect(preview).not.toHaveTextContent(ESSAY_BODY)
  }, 15_000)

  it('omits the learner-comment heading while the comment is empty', () => {
    render(<ReportPage />)

    expect(
      screen.getByLabelText('共有されるレポート全文'),
    ).not.toHaveTextContent('■ 本人から')
  })

  it('includes only the opted-in essay text and learner comment in the preview', () => {
    render(<ReportPage />)

    fireEvent.click(essayToggle())
    fireEvent.change(
      screen.getByRole('textbox', { name: 'ひとこと添える（任意）' }),
      { target: { value: '来週は時制を確認してから書きます。' } },
    )

    const preview = screen.getByLabelText('共有されるレポート全文')
    expect(preview).toHaveTextContent('■ 英作文の本文')
    expect(preview).toHaveTextContent(ESSAY_BODY)
    expect(preview).toHaveTextContent('■ 本人から')
    expect(preview).toHaveTextContent(
      '来週は時制を確認してから書きます。',
    )
  })

  it('copies the exact preview when the Web Share API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(<ReportPage />)

    await waitFor(() =>
      expect(
        screen.getByLabelText('共有されるレポート全文'),
      ).toHaveTextContent('ELR1.encoded-report-data'),
    )
    const preview =
      screen.getByLabelText('共有されるレポート全文').textContent ?? ''

    fireEvent.click(screen.getByRole('button', { name: '共有する' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(preview))
    expect(screen.getByText('レポートをコピーしました。')).toBeInTheDocument()
  })
})
