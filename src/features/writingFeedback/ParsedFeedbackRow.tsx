import { Button } from '../../components'
import { ENGLISH_INPUT_PROPS } from '../../components/forms/inputPolicy'
import type {
  SpellingErrorTag,
  SpellingWord,
  WritingErrorTag,
} from '../../domain/learner/types'
import {
  isSpellingErrorTag,
  SPELLING_ERROR_TAG_OPTIONS,
  WRITING_ERROR_TAG_OPTIONS,
} from './errorTagOptions'
import {
  isCatalogSpellingWord,
  rowCanBeConfirmed,
  type FeedbackReviewRow,
} from './feedbackReviewRows'

export function ParsedFeedbackRow({
  index,
  row,
  spellingWords,
  onChange,
  onDiscard,
}: {
  index: number
  row: FeedbackReviewRow
  spellingWords: readonly SpellingWord[]
  onChange: (row: FeedbackReviewRow) => void
  onDiscard: () => void
}): React.JSX.Element {
  const isCustomSpelling =
    isSpellingErrorTag(row.tag) &&
    !isCatalogSpellingWord(row.correction, spellingWords)
  const canConfirm = rowCanBeConfirmed(row, spellingWords)
  const update = (patch: Partial<FeedbackReviewRow>) =>
    onChange({ ...row, ...patch, confirmed: patch.confirmed ?? false })

  return (
    <fieldset
      className={`parsed-feedback-row${row.priority ? ' parsed-feedback-row--priority' : ''}`}
      role="row"
    >
      <legend>{row.priority ? '★ 最重要' : `指摘 ${index + 1}`}</legend>
      <label className="control-field">
        <span>修正前</span>
        <input
          {...ENGLISH_INPUT_PROPS}
          data-input-policy-id="writingFeedback.parsedSource"
          type="text"
          value={row.source}
          onChange={(event) => update({ source: event.target.value })}
        />
      </label>
      <label className="control-field">
        <span>修正後</span>
        <input
          {...ENGLISH_INPUT_PROPS}
          data-input-policy-id="writingFeedback.parsedCorrection"
          type="text"
          value={row.correction}
          onChange={(event) => update({ correction: event.target.value })}
        />
      </label>
      <label className="control-field">
        <span>タグ</span>
        <select
          aria-label={`指摘 ${index + 1} のタグ`}
          value={row.tag ?? ''}
          onChange={(event) =>
            update({
              tag:
                (event.target.value as
                  | SpellingErrorTag
                  | WritingErrorTag) || null,
            })
          }
        >
          <option value="">本人が分類を選択</option>
          <optgroup label="スペル">
            {SPELLING_ERROR_TAG_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </optgroup>
          <optgroup label="文法・語法">
            {WRITING_ERROR_TAG_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="control-field">
        <span>ひとこと</span>
        <input
          data-input-policy-id="writingFeedback.parsedNote"
          type="text"
          value={row.note}
          onChange={(event) => update({ note: event.target.value })}
          maxLength={80}
        />
      </label>
      {isCustomSpelling && (
        <label className="control-field parsed-feedback-row__meaning">
          <span>日本語の意味（教材にない語）</span>
          <input
            data-input-policy-id="writingFeedback.parsedMeaning"
            type="text"
            value={row.meaningJa}
            onChange={(event) => update({ meaningJa: event.target.value })}
          />
        </label>
      )}
      <div className="parsed-feedback-row__actions">
        <label className="confirm-choice">
          <input
            type="checkbox"
            checked={row.confirmed}
            disabled={!canConfirm}
            onChange={(event) =>
              update({ confirmed: event.target.checked })
            }
          />
          <span>確定</span>
        </label>
        <Button
          variant="ghost"
          onClick={onDiscard}
          aria-label={`指摘 ${index + 1} を破棄`}
        >
          破棄
        </Button>
      </div>
      {!canConfirm && (
        <small className="parsed-feedback-row__status">
          修正前・修正後・タグ
          {isCustomSpelling ? '・日本語の意味' : ''}を確認してください。
        </small>
      )}
    </fieldset>
  )
}
