import type { SpellingWord } from '../../domain/learner/types'
import { shuffleWithSeed } from '../../utils/shuffle'

function normalized(value: string): string {
  return value.trim().toLowerCase()
}

export function spellingChoiceDistractors(
  item: SpellingWord,
): string[] {
  const accepted = new Set(item.acceptedAnswers.map(normalized))
  return [...new Set(item.commonMistakes.map((mistake) => mistake.trim()))]
    .filter(Boolean)
    .filter((mistake) => !accepted.has(normalized(mistake)))
}

export function supportsSpellingChoice(item: SpellingWord): boolean {
  return spellingChoiceDistractors(item).length >= 3
}

export function buildSpellingChoiceOptions(
  item: SpellingWord,
): string[] {
  const distractors = spellingChoiceDistractors(item)
  if (distractors.length < 3) return []
  const selectedDistractors = shuffleWithSeed(
    distractors,
    `${item.id}:spelling-choice-distractors`,
  ).slice(0, 3)
  return shuffleWithSeed(
    [item.word, ...selectedDistractors],
    `${item.id}:spelling-choice-options`,
  )
}
