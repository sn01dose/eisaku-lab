import { useState, type ChangeEvent } from 'react'
import { STAGES } from '../app/constants'
import { useAppState } from '../app/providers/AppStateProvider'
import { Button, Card, EmptyState, PageHeader } from '../components'
import { dataCounts } from '../data'
import type {
  Attempt,
  StageId,
  SupportLevel,
} from '../domain/learner/types'
import {
  exportAttemptsToCsv,
  exportProgressToCsv,
  exportStateToJson,
  importStateFromJson,
} from '../services/export'
import '../styles/secondary-pages.css'

const ATTEMPT_LABELS: Record<Attempt['kind'], string> = {
  spelling: 'スペリング',
  writing: '英作文',
  simplification: '日本語言い換え',
  diagnostic: '初回診断',
}

const NOTE_LABELS = {
  spelling: 'スペル',
  writing: '英作文',
  simplification: '日本語言い換え',
} as const

const SUPPORT_LABELS: Record<SupportLevel, string> = {
  1: '全文の型＋語句バンク',
  2: '骨格＋語句バンク',
  3: '英文の骨格のみ',
  4: '簡単な日本語のみ',
  5: '問題文のみ',
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function downloadText(
  content: string,
  filename: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '日付未設定'
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function TeacherPage(): React.JSX.Element {
  const { state, updateState, replaceState } = useAppState()
  const [transferMessage, setTransferMessage] = useState('')
  const [renderedAt] = useState(() => Date.now())
  const profile = state.profile
  const mastery = Object.values(state.mastery)
  const stableCount = mastery.filter((item) => item.stable).length
  const dueCount = Object.values(state.cards).filter(
    (card) => new Date(card.dueAt).getTime() <= renderedAt,
  ).length
  const activeNotes = state.notes.filter((note) => !note.conquered).length
  const recentAttempts = [...state.attempts].reverse().slice(0, 10)
  const recentNotes = [...state.notes]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    )
    .slice(0, 8)
  const recentEssays = [...state.essays]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    )
    .slice(0, 6)

  const updateStage = (stage: StageId) => {
    updateState((previous) => ({
      ...previous,
      profile: previous.profile
        ? { ...previous.profile, currentStage: stage }
        : previous.profile,
    }))
  }

  const updateSupport = (supportLevel: SupportLevel) => {
    updateState((previous) => ({
      ...previous,
      profile: previous.profile
        ? { ...previous.profile, supportLevel }
        : previous.profile,
    }))
  }

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    try {
      replaceState(importStateFromJson(await file.text()))
      setTransferMessage('バックアップを復元しました。')
    } catch {
      setTransferMessage(
        '読み込めませんでした。英作ラボのJSONバックアップを選んでください。',
      )
    } finally {
      input.value = ''
    }
  }

  return (
    <div className="secondary-page teacher-page">
      <div className="teacher-mode-banner" role="status">
        <span>指導者モード</span>
        <a href="#/settings">設定へ戻る</a>
      </div>
      <PageHeader
        eyebrow="指導者向け｜詳細表示"
        title="学習状況と調整"
        description="本人向け画面では省いている履歴と設定を確認できます。"
      />

      {!profile ? (
        <EmptyState
          title="学習者の設定がありません"
          message="初回設定を完了すると、技能や解答履歴をここで確認できます。"
          action={
            <a
              className="button button--primary button--full"
              href="#/onboarding"
            >
              初回設定へ進む
            </a>
          }
        />
      ) : (
        <div className="section-stack">
          <section className="stat-grid" aria-label="学習状況の概要">
            <div className="stat-card">
              <span className="stat-card__value">{stableCount}</span>
              <span className="stat-card__label">安定した技能</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{dueCount}</span>
              <span className="stat-card__label">復習期限の項目</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{activeNotes}</span>
              <span className="stat-card__label">復習中のノート</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{state.essays.length}</span>
              <span className="stat-card__label">保存した英作文</span>
            </div>
          </section>

          <Card label="調整｜次回から反映" title="学習設定">
            <div className="form-grid">
              <label className="control-field">
                <span>現在のステージ</span>
                <select
                  value={profile.currentStage}
                  onChange={(event) =>
                    updateStage(Number(event.target.value) as StageId)
                  }
                >
                  {STAGES.map((stage) => (
                    <option value={stage.id} key={stage.id}>
                      Stage {stage.id} - {stage.name}
                    </option>
                  ))}
                </select>
                <small>
                  診断の推奨は Stage {profile.recommendedStage} です。
                </small>
              </label>

              <label className="control-field">
                <span>英作文の支援</span>
                <select
                  value={profile.supportLevel}
                  onChange={(event) =>
                    updateSupport(Number(event.target.value) as SupportLevel)
                  }
                >
                  {([1, 2, 3, 4, 5] as const).map((level) => (
                    <option value={level} key={level}>
                      Level {level} - {SUPPORT_LABELS[level]}
                    </option>
                  ))}
                </select>
                <small>数値が高いほど、自力で考える範囲が広がります。</small>
              </label>
            </div>
          </Card>

          <Card label="教材｜収録状況" title="教材数">
            <dl className="definition-grid">
              <div>
                <dt>スペリング</dt>
                <dd>{dataCounts.spelling.total}語</dd>
              </div>
              <div>
                <dt>短文・和文英訳</dt>
                <dd>{dataCounts.shortWriting.total}問</dd>
              </div>
              <div>
                <dt>段落・自由英作文</dt>
                <dd>{dataCounts.extendedWriting.total}題</dd>
              </div>
              <div>
                <dt>日本語言い換え</dt>
                <dd>{dataCounts.simplification.total}問</dd>
              </div>
            </dl>
          </Card>

          <Card label="履歴｜直近10件" title="解答履歴">
            {recentAttempts.length === 0 ? (
              <p className="quiet-empty">
                まだ解答履歴はありません。学習後にここへ記録されます。
              </p>
            ) : (
              <ol className="record-list">
                {recentAttempts.map((attempt) => (
                  <li key={attempt.id}>
                    <div className="record-list__heading">
                      <span>{ATTEMPT_LABELS[attempt.kind]}</span>
                      <span>{formatDateTime(attempt.at)}</span>
                    </div>
                    <p className="record-list__answer">{attempt.input || '無回答'}</p>
                    <div className="record-list__meta">
                      <span>{attempt.correct ? '正答' : '要確認'}</span>
                      <span>{attempt.isRecall ? '想起' : '写し'}</span>
                      <span>ヒント {attempt.hintLevelUsed}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card label="記録｜原因別" title="間違いノート">
            {recentNotes.length === 0 ? (
              <p className="quiet-empty">
                まだ記録はありません。間違いが見つかると原因別に追加されます。
              </p>
            ) : (
              <ul className="record-list">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <div className="record-list__heading">
                      <span>
                        {NOTE_LABELS[note.kind]}・確認点 {note.errorTags.length}件
                      </span>
                      <span>{note.conquered ? '克服済み' : '復習中'}</span>
                    </div>
                    <p className="record-list__answer">
                      {note.input || '無回答'} → {note.correction}
                    </p>
                    <div className="record-list__meta">
                      <span>{note.occurrenceCount}回確認</span>
                      <span>{formatDateTime(note.updatedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card label="英作文｜保存答案" title="最近の英作文">
            {recentEssays.length === 0 ? (
              <p className="quiet-empty">
                まだ英作文は保存されていません。提出後の答案がここに残ります。
              </p>
            ) : (
              <ol className="record-list">
                {recentEssays.map((essay) => (
                  <li key={essay.id}>
                    <div className="record-list__heading">
                      <span>Stage {essay.stage}</span>
                      <span>{formatDateTime(essay.updatedAt)}</span>
                    </div>
                    <p className="record-list__answer en-reading">{essay.answer}</p>
                    <div className="record-list__meta">
                      <span>
                        指摘 {essay.feedback?.findings.length ?? 0}件
                      </span>
                      <span>課題 {essay.taskId}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card label="管理｜端末内のデータ" title="バックアップと出力">
            <div className="button-grid">
              <Button
                variant="secondary"
                onClick={() =>
                  downloadText(
                    exportStateToJson(state),
                    `eisaku-lab-backup-${dateStamp()}.json`,
                    'application/json;charset=utf-8',
                  )
                }
              >
                JSONを保存
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadText(
                    exportProgressToCsv(state),
                    `eisaku-lab-progress-${dateStamp()}.csv`,
                    'text/csv;charset=utf-8',
                  )
                }
              >
                技能CSVを保存
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadText(
                    exportAttemptsToCsv(state),
                    `eisaku-lab-attempts-${dateStamp()}.csv`,
                    'text/csv;charset=utf-8',
                  )
                }
              >
                解答CSVを保存
              </Button>
            </div>
            <label className="file-control">
              <span>JSONバックアップを復元</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(event) => void restoreBackup(event)}
              />
            </label>
            <p className="privacy-note">
              ファイルはこの端末で作成・読込され、外部には送信されません。
            </p>
            <p className="transfer-message" aria-live="polite">
              {transferMessage}
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
