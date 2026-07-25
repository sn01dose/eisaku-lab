export function WordBank({
  words,
  onUse,
}: {
  words: readonly string[]
  onUse: (word: string) => void
}): React.JSX.Element {
  return (
    <div className="word-bank" aria-label="語句バンク">
      {words.map((word, index) => (
        <button
          type="button"
          className="word-chip"
          onClick={() => onUse(word)}
          key={`${word}-${index}`}
        >
          {word}
        </button>
      ))}
    </div>
  )
}
