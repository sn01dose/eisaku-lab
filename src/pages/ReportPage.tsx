import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '../app/providers/AppStateProvider'
import { AppShell, Button, Card, PageHeader } from '../components'
import { writingTasks } from '../data/writing'
import { addDays } from '../domain/plan/buildStudyPlan'
import {
  buildWeeklySnapshot,
  weekStartKey,
} from '../domain/report/weeklySnapshot'
import type { WeeklySnapshot } from '../domain/report/types'
import {
  buildLearningReport,
  encodeReportDataForSharing,
} from '../services/report'
import '../styles/report.css'

type ReportPeriod = 1 | 2

function replaceTransferCode(text: string, code: string): string {
  return text.replace(/\bELR1Z?\.[A-Za-z0-9_-]+/u, code)
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('copy failed')
}

function snapshotForWeek(
  weekStart: string,
  stored: ReadonlyMap<string, WeeklySnapshot>,
  state: ReturnType<typeof useAppState>['state'],
): WeeklySnapshot | null {
  return (
    stored.get(weekStart) ??
    buildWeeklySnapshot(state, weekStart, writingTasks)
  )
}

export function ReportPage(): React.JSX.Element {
  const { state } = useAppState()
  const [period, setPeriod] = useState<ReportPeriod>(1)
  const [includeEssays, setIncludeEssays] = useState(false)
  const [includeTransferData, setIncludeTransferData] = useState(true)
  const [comment, setComment] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [today] = useState(() => new Date())
  const currentWeekStart = weekStartKey(today)

  const report = useMemo(() => {
    const stored = new Map(
      state.weeklySnapshots.map((snapshot) => [
        snapshot.weekStart,
        snapshot,
      ]),
    )
    const current = snapshotForWeek(currentWeekStart, stored, state)
    const previous = snapshotForWeek(
      addDays(currentWeekStart, -7),
      stored,
      state,
    )
    if (!current) return null
    const selectedSnapshots =
      period === 2 && previous ? [previous, current] : [current]
    const periodStart = selectedSnapshots[0].weekStart
    const periodEnd = addDays(current.weekStart, 6)
    const essays = state.essays
      .filter((essay) => {
        const date = essay.createdAt.slice(0, 10)
        return date >= periodStart && date <= periodEnd
      })
      .map(({ answer, createdAt }) => ({ answer, createdAt }))

    return buildLearningReport({
      selectedSnapshots,
      previousSnapshot: previous,
      plan: state.plan,
      stableSkillIds: Object.values(state.mastery)
        .filter((mastery) => mastery.stable)
        .map((mastery) => mastery.skillId),
      unresolvedNoteCount: state.notes.filter((note) => !note.conquered).length,
      personalComment: comment,
      includeEssays,
      essays,
      includeTransferData,
    })
  }, [
    comment,
    currentWeekStart,
    includeEssays,
    includeTransferData,
    period,
    state,
  ])
  const [compressedTransfer, setCompressedTransfer] = useState<{
    source: string
    code: string
  } | null>(null)

  useEffect(() => {
    let current = true
    if (!report || !includeTransferData) {
      return () => {
        current = false
      }
    }
    void encodeReportDataForSharing(report.payload).then((code) => {
      if (current) {
        setCompressedTransfer({ source: report.transferCode, code })
      }
    })
    return () => {
      current = false
    }
  }, [includeTransferData, report])

  const preview = useMemo(() => {
    if (!report) return ''
    const preparedTransferCode =
      compressedTransfer?.source === report.transferCode
        ? compressedTransfer.code
        : report.transferCode
    return includeTransferData
      ? replaceTransferCode(report.text, preparedTransferCode)
      : report.text
  }, [compressedTransfer, includeTransferData, report])

  const copyPreview = () => {
    void copyText(preview)
      .then(() => setShareMessage('レポートをコピーしました。'))
      .catch(() =>
        setShareMessage(
          'コピーできませんでした。プレビューを選択してコピーしてください。',
        ),
      )
  }

  const sharePreview = () => {
    setShareMessage('')
    if ('share' in navigator && typeof navigator.share === 'function') {
      void navigator
        .share({ title: '英作ラボ 学習レポート', text: preview })
        .then(() => setShareMessage('共有画面へ渡しました。'))
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            setShareMessage('共有をキャンセルしました。')
            return
          }
          copyPreview()
        })
      return
    }
    copyPreview()
  }

  return (
    <AppShell activePath="/">
      <div className="secondary-page report-page">
        <PageHeader
          eyebrow="共有｜本人が内容を選ぶ"
          title="学習レポートを送る"
          description="送る前に、共有される内容を全文確認できます。自動送信は行いません。"
          backHref="#/"
        />

        <div className="section-stack">
          <Card label="期間｜集計する範囲" title="レポートの期間">
            <fieldset className="choice-fieldset">
              <legend>集計する期間を選んでください</legend>
              <div className="choice-row">
                {([1, 2] as const).map((weeks) => (
                  <label className="choice-option" key={weeks}>
                    <input
                      type="radio"
                      name="report-period"
                      checked={period === weeks}
                      onChange={() => setPeriod(weeks)}
                    />
                    <span>{weeks === 1 ? '今週' : '直近2週間'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card label="確認｜この全文を共有" title="プレビュー">
            <pre className="report-preview" aria-label="共有されるレポート全文">
              {preview}
            </pre>
          </Card>

          <Card label="内容｜毎回選べます" title="共有する項目">
            <label className="toggle-row">
              <span>
                <strong>英作文の本文を含める</strong>
                <small>本人の英文です。必要なときだけオンにしてください。</small>
              </span>
              <input
                type="checkbox"
                checked={includeEssays}
                onChange={(event) => setIncludeEssays(event.target.checked)}
              />
            </label>
            <label className="toggle-row">
              <span>
                <strong>取り込み用データを付ける</strong>
                <small>集計値だけを付け、答案やニックネームは含めません。</small>
              </span>
              <input
                type="checkbox"
                checked={includeTransferData}
                onChange={(event) =>
                  setIncludeTransferData(event.target.checked)
                }
              />
            </label>
            <label className="report-comment">
              <span>ひとこと添える（任意）</span>
              <textarea
                data-input-policy-id="report.comment"
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="今週できるようになったことや、次に意識したいことを書けます。"
              />
            </label>
          </Card>

          <div className="report-share-action">
            <Button fullWidth disabled={!preview} onClick={sharePreview}>
              共有する
            </Button>
            <p className="privacy-note">
              OSの共有機能またはクリップボードだけを使います。サーバーへは送信しません。
            </p>
            <p className="transfer-message" aria-live="polite">
              {shareMessage}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
