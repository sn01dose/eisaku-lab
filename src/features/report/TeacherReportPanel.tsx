import { useMemo, useState } from 'react'
import { Button, Card } from '../../components'
import {
  decodeReportDataAsync,
  extractReportCode,
} from '../../services/report'
import {
  getTeacherReportRepository,
  type TeacherReportRepository,
  type TeacherReportWeek,
} from '../../services/report/teacherReportRepository'
import {
  ErrorTagTrend,
  RecallAccuracyTrend,
  StableWordTrend,
  StageSupportTimeline,
} from './TeacherReportCharts'
import '../../styles/teacher-report.css'

export interface TeacherReportPanelProps {
  repository?: TeacherReportRepository
}

function formatWeek(date: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function detectedFormat(text: string): string | null {
  return extractReportCode(text)?.split('.')[0] ?? null
}

export function TeacherReportPanel({
  repository: providedRepository,
}: TeacherReportPanelProps): React.JSX.Element {
  const repository = useMemo(
    () => providedRepository ?? getTeacherReportRepository(),
    [providedRepository],
  )
  const [weeks, setWeeks] = useState<TeacherReportWeek[]>(() =>
    repository.load(),
  )
  const [pastedReport, setPastedReport] = useState('')
  const [message, setMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const format = detectedFormat(pastedReport)

  const importReport = async () => {
    setMessage('')
    setImporting(true)
    try {
      const payload = await decodeReportDataAsync(pastedReport)
      const imported = repository.importPayload(payload)
      setWeeks(imported)
      setPastedReport('')
      setMessage(
        `${payload.snapshots.length}週分の集計をこの端末に取り込みました。`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'レポートを取り込めませんでした。',
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="teacher-report-panel">
      <Card label="共有レポート｜端末内へ取り込み" title="レポートを取り込む">
        <p className="teacher-report-description">
          学習者から受け取った本文を、そのまま貼り付けてください。
          「---DATA---」以降のコードを自動で見つけます。
        </p>
        <label className="control-field">
          <span>受け取ったレポート全文</span>
          <textarea
            aria-label="受け取ったレポート全文"
            data-input-policy-id="teacherReport.paste"
            value={pastedReport}
            onChange={(event) => {
              setPastedReport(event.target.value)
              setMessage('')
            }}
            placeholder="英作ラボ 学習レポート…"
          />
          <small>
            {format
              ? `${format} 形式を検出しました。`
              : '取り込み用データはまだ検出されていません。'}
          </small>
        </label>
        <Button
          fullWidth
          disabled={!format || importing}
          onClick={() => void importReport()}
        >
          {importing ? '読み取っています' : 'レポートを取り込む'}
        </Button>
        <p className="transfer-message" aria-live="polite">
          {message}
        </p>
        <p className="privacy-note">
          取り込んだ集計は、この指導者端末だけに保存されます。
        </p>
      </Card>

      {weeks.length > 0 && (
        <>
          <Card
            label="共有レポート｜スペリング"
            title="実定着語数の推移"
          >
            <StableWordTrend weeks={weeks} />
          </Card>
          <Card
            label="共有レポート｜スペリング"
            title="想起正解率の推移"
          >
            <RecallAccuracyTrend weeks={weeks} />
          </Card>
          <Card
            label="共有レポート｜原因別"
            title="繰り返している誤りの推移"
          >
            <ErrorTagTrend weeks={weeks} />
          </Card>
          <Card
            label="共有レポート｜学習設定"
            title="支援レベルとステージの変化"
          >
            <StageSupportTimeline weeks={weeks} />
          </Card>
          <Card
            label="共有レポート｜この端末の記録"
            title={`取り込み済み ${weeks.length}週`}
          >
            <ul className="teacher-report-import-list">
              {weeks.map(({ weekStart, importedAt }) => (
                <li key={weekStart}>
                  <span>
                    <strong>{formatWeek(weekStart)}の週</strong>
                    <small>
                      取り込み：
                      {new Intl.DateTimeFormat('ja-JP').format(
                        new Date(importedAt),
                      )}
                    </small>
                  </span>
                  {pendingDelete === weekStart ? (
                    <span
                      className="teacher-report-delete-confirm"
                      role="group"
                      aria-label={`${formatWeek(weekStart)}の週の削除確認`}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => setPendingDelete(null)}
                      >
                        やめる
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setWeeks(repository.removeWeek(weekStart))
                          setPendingDelete(null)
                          setMessage('選んだ週の取り込みデータを削除しました。')
                        }}
                      >
                        削除する
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={() => setPendingDelete(weekStart)}
                    >
                      この週を削除
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
