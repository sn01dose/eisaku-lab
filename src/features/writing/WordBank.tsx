export function WordBank({
  words,
  onUse,
  disabled = false,
}: {
  words: readonly string[]
  onUse: (word: string) => void
  disabled?: boolean
}): React.JSX.Element {
  return (
    <div className="word-bank" aria-label="語句バンク">
      {words.map((word, index) => (
        <button
          type="button"
          className="word-chip"
          disabled={disabled}
          onClick={() => onUse(word)}
          key={`${word}-${index}`}
        >
          {word}
        </button>
      ))}
    </div>
  )
}
