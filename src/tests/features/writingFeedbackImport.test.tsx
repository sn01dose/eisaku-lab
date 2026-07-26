import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  AppState,
  SavedEssay,
  SpellingWord,
} from '../../domain/learner/types'
import { ManualFeedbackForm } from '../../features/writingFeedback/ManualFeedbackForm'
import {
  importManualFeedback,
  isCustomSpellingRefId,
  validateManualFeedback,
  type ManualFeedbackDraft,
} from '../../services/feedback/importFeedback'
import { createInitialState } from '../../services/storage/migrations'

afterEach(cleanup)

const savedEssay: SavedEssay = {
  id: 'essay:feedback-test',
  taskId: 'wr-0001',
  stage: 3,
  answer: 'Technology developement quickly and it change our lives.',
  createdAt: '2026-07-26T09:00:00.000Z',
  updatedAt: '2026-07-26T09:00:00.000Z',
  feedback: null,
}

const developmentWord: SpellingWord = {
  id: 'sp-development',
  word: 'development',
  meaningJa: '発展・発達',
  stage: 3,
  partOfSpeech: '名詞',
  strategy: 'morpheme',
  chunks: ['develop', 'ment'],
  chunkKind: 'morpheme',
  chunkLabels: ['語幹', '接尾辞'],
  patterns: ['suffix-ment'],
  skillIds: ['spelling.suffix'],
  exampleEn: 'Technology supports development.',
  exampleJa: '技術は発展を支えます。',
  acceptedAnswers: ['development'],
  commonMistakes: ['developement'],
  errorTags: ['suffix'],
}

function stateWithEssay(): AppState {
  return {
    ...createInitialState(new Date('2026-07-26T00:00:00.000Z')),
    essays: [savedEssay],
  }
}

function idFactory(): (prefix: string) => string {
  let index = 0
  return (prefix) => `${prefix}:test-${index++}`
}

function fullDraft(): ManualFeedbackDraft {
  return {
    correctedAnswer:
      'Technology develops quickly, and it changes our lives.',
    positiveMessage: '伝えたい内容と因果関係は明確です。',
    grammarFindings: [
      {
        errorTag: 'article',
        message: '冠詞が必要か確認します。',
        priority: 'secondary',
        input: 'Technology',
        correction: 'The technology',
      },
      {
        errorTag: 'tense',
        message: '今回は動詞の時制をそろえましょう。',
        priority: 'primary',
        input: 'it change',
        correction: 'it changes',
      },
    ],
    spellingCorrections: [
      {
        input: 'developement',
        correction: 'development',
        errorTag: 'insertion',
      },
    ],
  }
}

describe('manual writing feedback import', () => {
  it('stores priority feedback, one writing note, and a known-word card due tomorrow', () => {
    const now = new Date('2026-07-26T10:30:00.000Z')
    const result = importManualFeedback({
      state: stateWithEssay(),
      essayId: savedEssay.id,
      draft: fullDraft(),
      spellingWords: [developmentWord],
      now,
      makeId: idFactory(),
    })

    expect(result.summary).toMatchObject({
      primaryErrorTag: 'tense',
      notesCreated: 3,
      notesUpdated: 0,
      cardsCreated: 1,
      knownSpellingCards: 1,
      customSpellingCards: 0,
    })
    const feedback = result.state.essays[0]?.feedback
    expect(feedback?.findings[1]).toMatchObject({
      severity: 'important',
      errorTag: 'tense',
    })
    expect(feedback?.findings[2]).toMatchObject({
      severity: 'check',
      errorTag: 'article',
    })

    const writingNotes = result.state.notes.filter(
      (note) => note.kind === 'writing',
    )
    expect(writingNotes).toHaveLength(2)
    expect(writingNotes.find(({ primaryErrorTag }) => primaryErrorTag === 'tense')).toMatchObject({
      refId: savedEssay.taskId,
      primaryErrorTag: 'tense',
      errorTags: ['tense'],
      input: 'it change',
      correction: 'it changes',
    })
    expect(writingNotes.flatMap((note) => note.skillIds)).toEqual(
      expect.arrayContaining(['writing.tense', 'writing.article']),
    )

    const card = result.state.cards['card:sp-development']
    const expectedDue = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).toISOString()
    expect(card).toMatchObject({
      refId: developmentWord.id,
      kind: 'spelling',
      interval: 1,
      dueAt: expectedDue,
      source: 'writingMistake',
    })
    expect(
      result.state.notes.find((note) => note.kind === 'spelling'),
    ).toMatchObject({
      refId: developmentWord.id,
      input: 'developement',
      correction: 'development',
      primaryErrorTag: 'insertion',
      errorTags: ['insertion'],
      skillIds: ['spelling.wordFamily'],
      reviewCardId: 'card:sp-development',
    })
  })

  it('creates a minimal manual card when the corrected word is not registered', () => {
    const result = importManualFeedback({
      state: stateWithEssay(),
      essayId: savedEssay.id,
      draft: {
        correctedAnswer: savedEssay.answer,
        positiveMessage: '',
        grammarFindings: [],
        spellingCorrections: [
          {
            input: 'algoritmic',
            correction: 'algorithmic',
            meaningJa: 'アルゴリズムの',
            errorTag: 'consonantChoice',
          },
        ],
      },
      spellingWords: [developmentWord],
      now: new Date('2026-07-26T10:30:00.000Z'),
      makeId: idFactory(),
    })

    expect(result.summary).toMatchObject({
      primaryErrorTag: null,
      cardsCreated: 1,
      knownSpellingCards: 0,
      customSpellingCards: 1,
    })
    const note = result.state.notes[0]
    expect(note && isCustomSpellingRefId(note.refId)).toBe(true)
    expect(note).toMatchObject({
      correction: 'algorithmic',
      reviewCardId: 'card:custom-spelling:algorithmic',
    })
    expect(
      result.state.cards['card:custom-spelling:algorithmic'],
    ).toMatchObject({
      refId: 'custom-spelling:algorithmic',
      source: 'writingMistake',
      interval: 1,
    })
    expect(
      result.state.customSpellingWords['custom-spelling:algorithmic'],
    ).toMatchObject({
      word: 'algorithmic',
      meaningJa: 'アルゴリズムの',
      stage: 3,
    })
  })

  it('updates active notes instead of duplicating them on a second import', () => {
    const first = importManualFeedback({
      state: stateWithEssay(),
      essayId: savedEssay.id,
      draft: fullDraft(),
      spellingWords: [developmentWord],
      now: new Date('2026-07-26T10:30:00.000Z'),
      makeId: idFactory(),
    })
    const second = importManualFeedback({
      state: first.state,
      essayId: savedEssay.id,
      draft: fullDraft(),
      spellingWords: [developmentWord],
      now: new Date('2026-07-26T11:30:00.000Z'),
      makeId: idFactory(),
    })

    expect(second.state.notes).toHaveLength(3)
    expect(second.state.notes.every((note) => note.occurrenceCount === 2)).toBe(
      true,
    )
    expect(second.summary).toMatchObject({
      notesCreated: 0,
      notesUpdated: 3,
      cardsCreated: 0,
    })
  })

  it('validates actionable feedback and one-word spelling fields', () => {
    expect(
      validateManualFeedback({
        correctedAnswer: '',
        positiveMessage: '',
        grammarFindings: [],
        spellingCorrections: [],
      }),
    ).toHaveLength(2)
    expect(
      validateManualFeedback({
        correctedAnswer: savedEssay.answer,
        positiveMessage: '',
        grammarFindings: [],
        spellingCorrections: [
          {
            input: 'two words',
            correction: 'one-word',
            errorTag: 'insertion',
          },
        ],
      }),
    ).toContain('スペル欄には英単語を1語ずつ入力してください。')
    expect(
      validateManualFeedback({
        correctedAnswer: savedEssay.answer,
        positiveMessage: '',
        grammarFindings: [],
        spellingCorrections: [
          {
            input: 'developement',
            correction: 'development',
            errorTag: '',
          },
        ],
      }),
    ).toContain('スペルの誤りの種類を選択してください。')
  })
})

describe('ManualFeedbackForm', () => {
  it('parses pasted feedback and saves only confirmed rows', () => {
    let importedState: AppState | null = null
    const onSubmit = vi.fn((draft: ManualFeedbackDraft) => {
      importedState = importManualFeedback({
        state: stateWithEssay(),
        essayId: savedEssay.id,
        draft,
        spellingWords: [developmentWord],
        now: new Date('2026-07-26T10:30:00.000Z'),
        makeId: idFactory(),
      }).state
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(
      <ManualFeedbackForm
        essay={savedEssay}
        spellingWords={[developmentWord]}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(
      screen.getByRole('textbox', { name: /返ってきた添削結果/ }),
      {
        target: {
          value: `---FIX---
★ it change｜it changes｜thirdPersonS｜動詞の形を確認
developement｜development｜insertion｜余分な e を確認
our life｜our lives｜unknownTag｜分類を確認
---END---

### 書き直し
Technology development quickly and it changes our lives.`,
        },
      },
    )

    expect(
      screen.getByRole('textbox', { name: /返ってきた添削結果/ }),
    ).not.toHaveAttribute('autocorrect')
    expect(screen.getByText('★ 最重要')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Technology development quickly and it changes our lives.',
      ),
    ).toBeInTheDocument()

    const confirmations = screen.getAllByRole('checkbox', { name: '確定' })
    expect(confirmations).toHaveLength(3)
    expect(confirmations[2]).toBeDisabled()
    fireEvent.click(confirmations[0]!)
    fireEvent.click(confirmations[1]!)
    fireEvent.click(
      screen.getByRole('button', { name: '確定した指摘を取り込む' }),
    )

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      correctedAnswer: savedEssay.answer,
      grammarFindings: [
        {
          errorTag: 'thirdPersonS',
          priority: 'primary',
        },
      ],
      spellingCorrections: [
        {
          input: 'developement',
          correction: 'development',
          errorTag: 'insertion',
        },
      ],
    })
    expect(importedState).not.toBeNull()
    const savedState = importedState as unknown as AppState
    expect(savedState.notes).toHaveLength(2)
    expect(savedState.cards['card:sp-development']).toBeDefined()
    expect(
      savedState.notes.some(({ input }) => input === 'our life'),
    ).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  }, 30_000)

  it('does not confirm an unknown tag until the learner selects one', () => {
    const onSubmit = vi.fn()
    render(<ManualFeedbackForm essay={savedEssay} onSubmit={onSubmit} />)

    fireEvent.click(
      screen.getByRole('button', { name: '＋ 指摘を追加' }),
    )
    fireEvent.change(screen.getByRole('textbox', { name: '修正前' }), {
      target: { value: 'it change' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '修正後' }), {
      target: { value: 'it changes' },
    })
    const confirmation = screen.getByRole('checkbox', { name: '確定' })
    expect(confirmation).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'すべて確定' }))
    expect(confirmation).not.toBeChecked()
    fireEvent.click(
      screen.getByRole('button', { name: '確定した指摘を取り込む' }),
    )

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      '保存する指摘を1件以上確定してください。',
    )
  }, 15_000)
})
