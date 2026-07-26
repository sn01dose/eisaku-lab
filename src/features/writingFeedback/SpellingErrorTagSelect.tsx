import type { SpellingErrorTag } from '../../domain/learner/types'
import {
  SPELLING_ERROR_TAG_OPTIONS,
  spellingErrorTagLabel,
} from './errorTagOptions'

interface SpellingErrorTagSelectProps {
  value: SpellingErrorTag | ''
  onChange: (value: SpellingErrorTag | '') => void
}

export function SpellingErrorTagSelect({
  value,
  onChange,
}: SpellingErrorTagSelectProps): React.JSX.Element {
  const selected = SPELLING_ERROR_TAG_OPTIONS.find(
    (option) => option.value === value,
  )

  return (
    <label className="control-field">
      <span>誤りの種類（確認して選択）</span>
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value as SpellingErrorTag | '')
        }
      >
        <option value="">種類を選択</option>
        {SPELLING_ERROR_TAG_OPTIONS.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <small>
        {selected
          ? `${spellingErrorTagLabel(selected.value)}：${selected.hint}`
          : '添削内容を見て、原因に最も近い種類を選びます。'}
      </small>
    </label>
  )
}
