import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppState } from '../app/providers/AppStateProvider'
import {
  AppShell,
  Button,
  Card,
  FeedbackDetails,
  PageHeader,
} from '../components'
import { spellingWords, writingTaskById } from '../data'
import { ManualFeedbackForm } from '../features/writingFeedback/ManualFeedbackForm'
import { writingErrorTagLabel } from '../features/writingFeedback/errorTagOptions'
import {
  importManualFeedback,
  type FeedbackImportSummary,
  type ManualFeedbackDraft,
} from '../services/feedback/importFeedback'
import '../styles/feedback-import.css'

function formatSavedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '保存日時なし'
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function WritingFeedbackImportPage(): React.JSX.Element {
  const { essayId = '' } = useParams<{ essayId: string }>()
  const { state, updateState } = useAppState()
  const [summary, setSummary] = useState<FeedbackImportSummary | null>(null)
  const [importError, setImportError] = useState('')
  const essay = state.essays.find(({ id }) => id === essayId)
  const task = essay ? writingTaskById.get(essay.taskId) : undefined

  if (!essay) {
    return (
      <AppShell activePath="/writing">
        <PageHeader
          eyebrow="英作文｜添削"
          title="答案が見つかりません"
          description="保存済みの答案から、もう一度添削結果の取り込みを開いてください。"
          backHref="#/writing"
          backLabel="英作文へ戻る"
        />
        <Card label="添削｜確認">
          <p>
            この答案は削除されたか、別の端末で作成された可能性があります。
          </p>
          <a className="button button--primary button--full" href="#/writing">
            英作文へ戻る
          </a>
        </Card>
      </AppShell>
    )
  }

  const handleImport = (draft: ManualFeedbackDraft) => {
    try {
      const result = importManualFeedback({
        state,
        essayId: essay.id,
        draft,
        spellingWords,
      })
      updateState(result.state)
      setSummary(result.summary)
      setImportError('')
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : '添削結果を取り込めませんでした。',
      )
    }
  }

  return (
    <AppShell activePath="/writing">
      <PageHeader
        eyebrow="英作文｜添削結果"
        title="添削結果を取り込む"
        description="先生や外部の添削で分かった点を、次の復習につなげます。内容は外部へ送信しません。"
        backHref="#/writing"
        backLabel="英作文へ戻る"
      />

      <Card label={`英作文｜Stage ${essay.stage}`}>
        {task && (
          <>
            <p className="field-label">問題</p>
            <p className="feedback-import-prompt">{task.promptJa}</p>
          </>
        )}
        <p className="field-label">保存した答案</p>
        <p className="feedback-import-answer" lang="en">
          {essay.answer}
        </p>
        <p className="feedback-import-meta">
          {formatSavedAt(essay.createdAt)} 保存
        </p>
      </Card>

      {summary ? (
        <Card label="添削｜取り込み完了">
          <FeedbackDetails
            tone="correct"
            message="添削結果を保存し、次の復習へつなげました。"
          >
            <ul className="feedback-import-summary">
              <li>
                間違いノート：新規 {summary.notesCreated}件、更新{' '}
                {summary.notesUpdated}件
              </li>
              <li>翌日のスペルカード：{summary.cardsCreated}件</li>
              <li>
                教材内の語 {summary.knownSpellingCards}件／未登録語{' '}
                {summary.customSpellingCards}件
              </li>
              {summary.primaryErrorTag && (
                <li>
                  最重要：
                  {writingErrorTagLabel(summary.primaryErrorTag)}
                </li>
              )}
            </ul>
          </FeedbackDetails>
          <div className="feedback-import-links">
            <a className="button button--primary" href="#/notes">
              間違いノートを見る
            </a>
            <a className="button button--secondary" href="#/writing">
              英作文へ戻る
            </a>
          </div>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setSummary(null)}
          >
            取り込み内容を修正する
          </Button>
        </Card>
      ) : (
        <>
          {essay.feedback && (
            <p className="feedback-import-existing">
              この答案には添削記録があります。再度取り込むと、内容を更新します。
            </p>
          )}
          {importError && (
            <p className="feedback-import-errors" role="alert">
              {importError}
            </p>
          )}
          <ManualFeedbackForm
            key={essay.id}
            essay={essay}
            spellingWords={spellingWords}
            onSubmit={handleImport}
          />
        </>
      )}
    </AppShell>
  )
}
