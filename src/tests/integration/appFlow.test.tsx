import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'
import { diagnosticItems } from '../../data'
import type { AppState } from '../../domain/learner/types'
import { STORAGE_KEY } from '../../services/storage'

function savedState(): AppState {
  const value = localStorage.getItem(STORAGE_KEY)
  if (!value) throw new Error('保存済みの状態がありません。')
  return JSON.parse(value) as AppState
}

beforeEach(() => {
  localStorage.clear()
  window.location.hash = '#/'
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('主要学習フロー', () => {
  it(
    '初回設定から診断、今日の学習、間違い登録、英作文保存、再読込まで進めます',
    async () => {
      const user = userEvent.setup()
      const view = render(<App />)

      expect(
        await screen.findByRole(
          'heading',
          { name: 'はじめの設定' },
          { timeout: 10_000 },
        ),
      ).toBeInTheDocument()
      await user.type(screen.getByLabelText('ニックネーム'), 'なぎ')
      await user.click(
        screen.getByRole('button', { name: '設定を保存して進む' }),
      )

      await waitFor(
        () => {
          expect(window.location.hash).toBe('#/diagnostic')
        },
        { timeout: 5_000 },
      )
      expect(
        await screen.findByText('1 / 30', {}, { timeout: 10_000 }),
      ).toBeInTheDocument()
      for (let index = 0; index < diagnosticItems.length; index += 1) {
        const item = diagnosticItems[index]
        if (item.section === 'spellChoice') {
          await user.click(screen.getAllByRole('radio')[0])
        } else if (item.section === 'dictation') {
          await user.type(screen.getByLabelText('綴り'), 'answer')
        } else if (item.section === 'fillLetters') {
          await user.type(screen.getByLabelText('単語全体を入力'), 'answer')
        } else if (item.section === 'chunking' || item.section === 'reorder') {
          const token = document.querySelector<HTMLButtonElement>(
            '.diagnostic-token:not(:disabled)',
          )
          if (!token) throw new Error(`${item.id} の語句ボタンがありません。`)
          await user.click(token)
        } else {
          await user.type(
            screen.getByLabelText('英文'),
            'I think this is useful because students can learn more.',
          )
        }

        const isLast = index === diagnosticItems.length - 1
        await user.click(
          screen.getByRole('button', {
            name: isLast ? '診断結果を見る' : '回答して次へ',
          }),
        )
        if (!isLast) {
          expect(
            await screen.findByText(`${index + 2} / ${diagnosticItems.length}`),
          ).toBeInTheDocument()
        }
      }

      expect(
        await screen.findByRole(
          'heading',
          { name: 'なぎさんの開始位置' },
          { timeout: 10_000 },
        ),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'ホームへ進む' }))
      await waitFor(
        () => {
          expect(window.location.hash).toBe('#/')
        },
        { timeout: 5_000 },
      )
      expect(
        await screen.findByText(
          '発想する力は、すでにある。',
          { exact: false },
          { timeout: 10_000 },
        ),
      ).toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: '今日の学習を始める' }),
      )
      await waitFor(
        () => {
          expect(window.location.hash).toBe('#/today')
        },
        { timeout: 30_000 },
      )
      await user.click(
        await screen.findByRole(
          'button',
          { name: 'この順で始める' },
          { timeout: 60_000 },
        ),
      )

      const startRecallButton = await screen.findByRole(
        'button',
        { name: '隠して書く' },
        { timeout: 10_000 },
      )
      await user.click(startRecallButton)
      const spellingInputGroup = await screen.findByRole(
        'group',
        { name: '英単語の綴りを入力' },
        { timeout: 10_000 },
      )
      const firstSpellingCell =
        within(spellingInputGroup).getAllByRole('textbox')[0]
      await user.click(firstSpellingCell)
      await user.keyboard('zzzz')
      await user.click(screen.getByRole('button', { name: '答え合わせ' }))
      expect(savedState().notes.length).toBeGreaterThan(0)
      expect(Object.keys(savedState().cards).length).toBeGreaterThan(0)

      await user.click(screen.getByRole('link', { name: 'ホーム' }))
      await user.click(
        await screen.findByRole(
          'link',
          { name: /英作文/ },
          { timeout: 10_000 },
        ),
      )
      const essayAnswer =
        'I study English every day because it helps me share my ideas.'
      await user.type(
        await screen.findByRole('textbox', {}, { timeout: 10_000 }),
        essayAnswer,
      )
      await user.click(screen.getByRole('button', { name: '答え合わせ' }))
      expect(savedState().essays).toHaveLength(1)

      view.unmount()
      act(() => {
        window.location.hash = '#/teacher'
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      })
      render(<App />)

      expect(
        await screen.findByRole(
          'heading',
          { name: '学習状況と調整' },
          { timeout: 10_000 },
        ),
      ).toBeInTheDocument()
      expect(
        (
          await screen.findAllByText(
            essayAnswer,
            {},
            { timeout: 10_000 },
          )
        ).length,
      ).toBeGreaterThan(0)
      expect(savedState().attempts.length).toBeGreaterThan(
        diagnosticItems.length,
      )
    },
    240_000,
  )
})
