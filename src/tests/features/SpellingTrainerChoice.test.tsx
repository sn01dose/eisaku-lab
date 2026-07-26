import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spellingWords } from '../../data'
import type { AppState } from '../../domain/learner/types'
import { createReviewCard } from '../../domain/review/scheduler'
import { SpellingTrainer } from '../../features/spelling/SpellingTrainer'
import {
  buildSpellingChoiceOptions,
  supportsSpellingChoice,
} from '../../features/spelling/spellingChoice'
import { createInitialState } from '../../services/storage'

type StateUpdater = AppState | ((previous: AppState) => AppState)

const mockedContext = vi.hoisted(() => ({
  state: null as AppState | null,
  updateState: vi.fn(),
}))

vi.mock('../../app/providers/AppStateProvider', () => ({
  useAppState: () => {
    if (!mockedContext.state) {
      throw new Error('Test AppState is not initialized.')
    }
    return {
      state: mockedContext.state,
      updateState: mockedContext.updateState,
      replaceState: vi.fn(),
      clearData: vi.fn(),
    }
  },
}))

vi.mock('../../services/speech', () => ({
  useSpeech: () => ({
    supported: false,
    available: false,
    speaking: false,
    status: 'unsupported',
    error: null,
    voiceName: null,
    speak: vi.fn(),
    speakSlowly: vi.fn(),
    repeat: vi.fn(),
    test: vi.fn(),
    cancel: vi.fn(),
  }),
}))

beforeEach(() => {
  mockedContext.state = createInitialState(
    new Date('2026-07-26T09:00:00.000Z'),
  )
  mockedContext.updateState.mockImplementation((updater: StateUpdater) => {
    if (!mockedContext.state) {
      throw new Error('Test AppState is not initialized.')
    }
    mockedContext.state =
      typeof updater === 'function'
        ? updater(mockedContext.state)
        : updater
  })
})

afterEach(() => {
  cleanup()
  mockedContext.state = null
  vi.clearAllMocks()
})

describe('SpellingTrainer choice mode', () => {
  it(
    'stores the selected answer string as a non-recall correct attempt',
    async () => {
      const item = spellingWords.find((candidate) => {
        if (!supportsSpellingChoice(candidate)) return false
        return buildSpellingChoiceOptions(candidate).indexOf(candidate.word) > 0
      })
      expect(item).toBeDefined()
      if (!item) return

      render(<SpellingTrainer items={[item]} />)

      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'choice' },
      })

      const correctOption = await screen.findByRole('radio', {
        name: item.word,
      })
      fireEvent.click(correctOption)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(mockedContext.state?.attempts).toHaveLength(1)
      })
      expect(mockedContext.state?.attempts[0]).toMatchObject({
        kind: 'spelling',
        refId: item.id,
        input: item.word,
        correct: true,
        isRecall: false,
      })
    },
    15_000,
  )
})

describe('SpellingTrainer recall phases', () => {
  const item =
    spellingWords.find((candidate) => candidate.word === 'technology') ??
    spellingWords[0]

  it('shows a new word before recall, then hides every chunk from the DOM', () => {
    const { container } = render(<SpellingTrainer items={[item]} />)

    expect(
      screen.getByRole('region', { name: '新出語の提示' }),
    ).toBeInTheDocument()
    expect(
      container.querySelectorAll('.letter-cells__chunk-rule'),
    ).toHaveLength(item.chunks.length)
    expect(mockedContext.state?.attempts).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: '隠して書く' }))

    expect(
      screen.queryByRole('region', { name: '新出語の提示' }),
    ).not.toBeInTheDocument()
    expect(
      container.querySelectorAll('.letter-cells__chunk-rule'),
    ).toHaveLength(0)
    expect(
      container.querySelectorAll('.letter-cells__chunk-label'),
    ).toHaveLength(0)
    expect(mockedContext.state?.attempts).toHaveLength(0)
  })

  it('reveals hints in three stages and caps a correct review at q=3', async () => {
    const onNext = vi.fn()
    const { container } = render(
      <SpellingTrainer items={[item]} onNext={onNext} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '隠して書く' }))

    const hintButton = screen.getByRole('button', { name: 'ヒント' })
    fireEvent.click(hintButton)
    expect(
      container.querySelectorAll('.letter-cells__chunk-rule'),
    ).toHaveLength(item.chunks.length)
    expect(
      container.querySelectorAll('.letter-cells__chunk-label'),
    ).toHaveLength(0)

    fireEvent.click(hintButton)
    expect(
      [...container.querySelectorAll('.letter-cells__chunk-label')].map(
        (element) => element.textContent,
      ),
    ).toEqual([item.chunks[0]])

    fireEvent.click(hintButton)
    expect(
      [...container.querySelectorAll('.letter-cells__chunk-label')].map(
        (element) => element.textContent,
      ),
    ).toEqual(item.chunks)

    const inputGroup = screen.getByRole('group', {
      name: '英単語の綴りを入力',
    })
    const firstCell = within(inputGroup).getAllByRole('textbox')[0]
    fireEvent.paste(firstCell, {
      clipboardData: { getData: () => item.word },
    })
    fireEvent.click(screen.getByRole('button', { name: '答え合わせ' }))

    await waitFor(() => {
      expect(mockedContext.state?.cards[`card:${item.id}`]).toMatchObject({
        repetitions: 1,
        interval: 1,
        lastResult: 'hinted',
        hintCount: 3,
      })
    })
    expect(mockedContext.state?.attempts[0]).toMatchObject({
      isRecall: true,
      hintLevelUsed: 3,
    })
    expect(
      screen.getAllByText('正しい綴りを思い出せました。'),
    ).toHaveLength(1)
    expect(screen.getByText(/^次回の復習：/u)).not.toHaveTextContent(
      'このあと登録します',
    )
    expect(container.querySelector('.progress-dots')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '次へ' }))
    expect(onNext).toHaveBeenCalledOnce()
    expect(
      screen.queryByText('正しい綴りを思い出せました。'),
    ).not.toBeInTheDocument()
    const resetGroup = screen.getByRole('group', {
      name: '英単語の綴りを入力',
    })
    within(resetGroup)
      .getAllByRole('textbox')
      .forEach((cell) => expect(cell).toHaveValue(''))
  })

  it('does not repeat the presentation for a previously reviewed card', () => {
    if (!mockedContext.state) throw new Error('State is not initialized.')
    const card = createReviewCard({
      kind: 'spelling',
      refId: item.id,
      now: new Date('2026-07-20T00:00:00.000Z'),
    })
    mockedContext.state.cards[card.id] = {
      ...card,
      repetitions: 1,
      lastReviewedAt: '2026-07-20T00:00:00.000Z',
      lastResult: 'correct',
    }

    const { container } = render(<SpellingTrainer items={[item]} />)

    expect(
      screen.queryByRole('region', { name: '新出語の提示' }),
    ).not.toBeInTheDocument()
    expect(
      container.querySelectorAll('.letter-cells__chunk-rule'),
    ).toHaveLength(0)
  })
})
