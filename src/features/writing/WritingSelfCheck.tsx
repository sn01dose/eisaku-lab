import { SELF_CHECKS } from './writingSupport'

export function WritingSelfCheck({
  checked,
  onChange,
}: {
  checked: readonly boolean[]
  onChange: (index: number, value: boolean) => void
}): React.JSX.Element {
  return (
    <details className="self-check">
      <summary>提出前の自己点検</summary>
      <div className="check-grid">
        {SELF_CHECKS.map((label, index) => (
          <label key={label}>
            <input
              type="checkbox"
              checked={checked[index]}
              onChange={(event) => onChange(index, event.target.checked)}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </details>
  )
}
