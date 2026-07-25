import { stage1SpellingWords } from './stage1'
import { stage2SpellingWords } from './stage2'
import { stage3SpellingWords } from './stage3'
import { stage4SpellingWords } from './stage4'
import { stage5SpellingWords } from './stage5'
import { stage6SpellingWords } from './stage6'

export {
  stage1SpellingWords,
  stage2SpellingWords,
  stage3SpellingWords,
  stage4SpellingWords,
  stage5SpellingWords,
  stage6SpellingWords,
}

export const spellingWords = [
  ...stage1SpellingWords,
  ...stage2SpellingWords,
  ...stage3SpellingWords,
  ...stage4SpellingWords,
  ...stage5SpellingWords,
  ...stage6SpellingWords,
]

export const spellingWordById = new Map(spellingWords.map((word) => [word.id, word]))
