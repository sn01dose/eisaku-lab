import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { WeeklySnapshot } from '../../domain/report/types'
import { TeacherReportPanel } from '../../features/report/TeacherReportPanel'
import {
  encodeReportData,
  type LearningReportPayload,
} from '../../services/report'
import {
  TeacherReportRepository,
  type TeacherReportStorage,
} from '../../services/report/teacherReportRepository'

afterEach(cleanup)

class MemoryStorage implements TeacherReportStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const current: WeeklySnapshot = {
  weekStart: '2026-07-20',
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
}

function payload(): LearningReportPayload {
  return {
    version: 1,
    snapshots: [current],
    plan: null,
    stableSkillIds: ['writing.agreement'],
    unresolvedNoteCount: 5,
  }
}

describe('TeacherReportPanel', () => {
  it('extracts ELR data from a full report and renders four trend views', async () => {
    const repository = new TeacherReportRepository(new MemoryStorage())
    render(<TeacherReportPanel repository={repository} />)
    const fullReport = `英作ラボ 学習レポート
2026/07/20 - 2026/07/26

---DATA---
${encodeReportData(payload())}`

    fireEvent.change(
      screen.getByRole('textbox', { name: '受け取ったレポート全文' }),
      { target: { value: fullReport } },
    )

    expect(screen.getByText('ELR1 形式を検出しました。')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'レポートを取り込む' }),
    )

    await waitFor(() =>
      expect(screen.getByText(/1週分の集計を/)).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('heading', { name: '実定着語数の推移' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '想起正解率の推移' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '繰り返している誤りの推移' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: '支援レベルとステージの変化',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('三人称単数の s')).toBeInTheDocument()
    expect(repository.load()).toHaveLength(1)
  }, 15_000)

  it('rejects an unsupported version without saving guessed data', async () => {
    const repository = new TeacherReportRepository(new MemoryStorage())
    render(<TeacherReportPanel repository={repository} />)

    fireEvent.change(
      screen.getByRole('textbox', { name: '受け取ったレポート全文' }),
      { target: { value: '---DATA---\nELR2.eyJ2IjoyfQ' } },
    )
    expect(screen.getByText('ELR2 形式を検出しました。')).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'レポートを取り込む' }),
    )

    await waitFor(() =>
      expect(screen.getByText(/書式バージョンには対応していません/)).toBeInTheDocument(),
    )
    expect(repository.load()).toEqual([])
    expect(
      screen.queryByRole('heading', { name: '実定着語数の推移' }),
    ).not.toBeInTheDocument()
  })

  it('requires confirmation before deleting an imported week', async () => {
    const repository = new TeacherReportRepository(new MemoryStorage())
    repository.importPayload(payload(), '2026-07-27T09:00:00.000Z')
    render(<TeacherReportPanel repository={repository} />)

    fireEvent.click(screen.getByRole('button', { name: 'この週を削除' }))
    expect(repository.load()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '削除する' }))

    await waitFor(() => expect(repository.load()).toEqual([]))
    expect(
      screen.queryByRole('heading', { name: '実定着語数の推移' }),
    ).not.toBeInTheDocument()
  })
})
