import { Button, LetterCells } from '../../components'
import { analyzeSpellAnswer } from '../../domain/attempts/spellDiff'
import type { SpellingWord } from '../../domain/learner/types'

export type SpellingPracticeMode = 'sound' | 'meaning' | 'choice' | 'copy'

interface SpellingExerciseProps {
  item: SpellingWord
  mode: SpellingPracticeMode
  answer: string
  choiceOptions: readonly string[]
  analysis: ReturnType<typeof analyzeSpellAnswer> | null
  hintLevel: number
  hintText: string | null
  presenting: boolean
  onAnswerChange: (value: string) => void
  onHint: () => void
  onSubmit: () => void
  onStartRecall: () => void
}

function hintLabels(
  chunks: readonly string[],
  hintLevel: number,
): string[] | undefined {
  if (hintLevel < 1) return undefined
  if (hintLevel === 1) return chunks.map(() => '')
  if (hintLevel === 2) {
    return chunks.map((chunk, index) => (index === 0 ? chunk : ''))
  }
  return [...chunks]
}

export function SpellingExercise({
  item,
  mode,
  answer,
  choiceOptions,
  analysis,
  hintLevel,
  hintText,
  presenting,
  onAnswerChange,
  onHint,
  onSubmit,
  onStartRecall,
}: SpellingExerciseProps): React.JSX.Element {
  if (presenting) {
    return (
      <section className="spelling-presentation" aria-label="新出語の提示">
        <p className="field-label">見る → 聞く → まとまりを確認する</p>
        <LetterCells
          value={item.word}
          mode="graded"
          correctAnswer={item.word}
          chunks={item.chunks}
          chunkLabels={item.chunks}
          expectedLength={item.word.length}
        />
        <Button fullWidth onClick={onStartRecall}>
          隠して書く
        </Button>
      </section>
    )
  }

  if (mode === 'choice' && !analysis) {
    return (
      <fieldset className="spelling-choice-fieldset">
        <legend>正しいスペルを選んでください</legend>
        <div className="spelling-choice-list">
          {choiceOptions.map((option) => (
            <label className="spelling-choice" key={option}>
              <input
                checked={answer === option}
                name={`spelling-choice-${item.id}`}
                onChange={() => onAnswerChange(option)}
                type="radio"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  const showAllChunks = Boolean(analysis)
  const chunks =
    showAllChunks || hintLevel > 0 ? item.chunks : undefined
  const chunkLabels = showAllChunks
    ? [...item.chunks]
    : hintLabels(item.chunks, hintLevel)

  return (
    <LetterCells
      value={answer}
      mode={analysis ? 'graded' : 'input'}
      correctAnswer={item.word}
      operations={analysis?.operations}
      chunks={chunks}
      chunkLabels={chunkLabels}
      expectedLength={item.word.length}
      feedback={analysis ? undefined : hintText ?? undefined}
      onChange={onAnswerChange}
      onHint={onHint}
      onSubmit={onSubmit}
    />
  )
}
