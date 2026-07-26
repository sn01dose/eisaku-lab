import { useRef, useState, type FormEvent } from 'react'
import { Button, Card } from '../../components'
import type {
  SavedEssay,
  SpellingErrorTag,
  SpellingWord,
  WritingErrorTag,
} from '../../domain/learner/types'
import {
  validateManualFeedback,
  type ManualFeedbackDraft,
} from '../../services/feedback/importFeedback'
import { parseReviewOutput } from '../../services/feedback/parseReviewOutput'
import { FeedbackPastePanel } from './FeedbackPastePanel'
import {
  isSpellingErrorTag,
  isWritingErrorTag,
} from './errorTagOptions'
import {
  ParsedFeedbackRow,
} from './ParsedFeedbackRow'
import {
  rowCanBeConfirmed,
  type FeedbackReviewRow,
} from './feedbackReviewRows'

export interface ManualFeedbackFormProps {
  essay: SavedEssay
  spellingWords?: readonly SpellingWord[]
  onSubmit: (draft: ManualFeedbackDraft) => void
}

function neutralMessage(row: FeedbackReviewRow): string {
  return (
    row.note.trim() ||
    `「${row.source.trim()}」を「${row.correction.trim()}」に直します。`
  )
}

export function ManualFeedbackForm({
  essay,
  spellingWords = [],
  onSubmit,
}: ManualFeedbackFormProps): React.JSX.Element {
  const nextId = useRef(0)
  const [pastedFeedback, setPastedFeedback] = useState('')
  const [rows, setRows] = useState<FeedbackReviewRow[]>([])
  const [rewrittenAnswer, setRewrittenAnswer] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const replaceFromPaste = (value: string) => {
    setPastedFeedback(value)
    const parsed = parseReviewOutput(value)
    setRewrittenAnswer(parsed.rewrittenAnswer)
    setRows(
      parsed.fixes
        .map((fix) => ({
          id: `parsed-${nextId.current++}`,
          source: fix.source,
          correction: fix.correction,
          tag: fix.tag,
          note: fix.note,
          priority: fix.priority,
          confirmed: false,
          meaningJa: '',
        }))
        .sort(
          (left, right) => Number(right.priority) - Number(left.priority),
        ),
    )
    setErrors([])
  }

  const updateRow = (updated: FeedbackReviewRow) => {
    setRows((current) =>
      current.map((row) => (row.id === updated.id ? updated : row)),
    )
  }

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        id: `manual-${nextId.current++}`,
        source: '',
        correction: '',
        tag: null,
        note: '',
        priority: false,
        confirmed: false,
        meaningJa: '',
      },
    ])
  }

  const confirmAllReadyRows = () => {
    setRows((current) =>
      current.map((row) => ({
        ...row,
        confirmed: rowCanBeConfirmed(row, spellingWords),
      })),
    )
  }

  const buildDraft = (): ManualFeedbackDraft => {
    const confirmed = rows.filter((row) => row.confirmed)
    return {
      correctedAnswer: essay.answer,
      positiveMessage: '',
      grammarFindings: confirmed
        .filter(
          (row): row is FeedbackReviewRow & {
            tag: WritingErrorTag
          } => isWritingErrorTag(row.tag),
        )
        .map((row) => ({
          errorTag: row.tag,
          message: neutralMessage(row),
          priority: row.priority ? 'primary' : 'secondary',
          input: row.source,
          correction: row.correction,
        })),
      spellingCorrections: confirmed
        .filter(
          (row): row is FeedbackReviewRow & {
            tag: SpellingErrorTag
          } => isSpellingErrorTag(row.tag),
        )
        .map((row) => ({
          input: row.source,
          correction: row.correction,
          meaningJa: row.meaningJa,
          errorTag: row.tag,
        })),
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const confirmed = rows.filter((row) => row.confirmed)
    if (confirmed.length === 0) {
      setErrors(['保存する指摘を1件以上確定してください。'])
      return
    }
    const draft = buildDraft()
    const nextErrors = validateManualFeedback(draft)
    setErrors(nextErrors)
    if (nextErrors.length === 0) onSubmit(draft)
  }

  return (
    <form className="feedback-import-form" onSubmit={submit} noValidate>
      <FeedbackPastePanel
        value={pastedFeedback}
        onChange={replaceFromPaste}
      />

      {rewrittenAnswer && (
        <Card label="添削｜書き直し（参考）">
          <p className="feedback-import-answer" lang="en">
            {rewrittenAnswer}
          </p>
          <p className="feedback-import-meta">
            参考表示だけに使います。教材の模範解答には追加しません。
          </p>
        </Card>
      )}

      <Card label="添削｜指摘一覧">
        <div className="parsed-feedback-toolbar">
          <p className="feedback-import-form__lead">
            タグと内容を確認し、保存する行だけ「確定」にします。
          </p>
          <Button variant="secondary" onClick={confirmAllReadyRows}>
            すべて確定
          </Button>
        </div>
        {rows.length > 0 ? (
          <div
            className="parsed-feedback-table"
            role="table"
            aria-label="添削の指摘一覧"
          >
            {rows.map((row, index) => (
              <ParsedFeedbackRow
                key={row.id}
                index={index}
                row={row}
                spellingWords={spellingWords}
                onChange={updateRow}
                onDiscard={() =>
                  setRows((current) =>
                    current.filter(({ id }) => id !== row.id),
                  )
                }
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            添削結果を貼り付けるか、指摘を1件追加してください。
          </p>
        )}
        <Button variant="ghost" onClick={addRow}>
          ＋ 指摘を追加
        </Button>
      </Card>

      {errors.length > 0 && (
        <div className="feedback-import-errors" role="alert">
          <p>入力内容を確認してください。</p>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="feedback-import-privacy">
        確定した指摘だけをこの端末に保存します。外部送信は行いません。
      </p>
      <div className="sticky-actions">
        <Button type="submit" fullWidth>
          確定した指摘を取り込む
        </Button>
      </div>
    </form>
  )
}
