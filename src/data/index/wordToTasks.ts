import { simplificationTasks } from '../simplification'
import { spellingWords } from '../spelling'
import { writingTasks } from '../writing'
import {
  buildWordFrequency,
  buildWordToTasks,
  curriculumVocabularySources,
  lemmatizeEnglishWord,
} from './wordTools'

export const vocabularySources = curriculumVocabularySources(
  writingTasks,
  simplificationTasks,
)

export const vocabularyFrequency = buildWordFrequency(vocabularySources)

export const priorityVocabulary = Object.entries(vocabularyFrequency)
  .filter(([, frequency]) => frequency >= 2)
  .sort(
    ([leftWord, leftFrequency], [rightWord, rightFrequency]) =>
      rightFrequency - leftFrequency || leftWord.localeCompare(rightWord),
  )
  .map(([word]) => word)

export const spellingExampleSources = spellingWords.map((word) => ({
  id: word.id,
  texts: [word.exampleEn],
}))

export const wordToTasks = buildWordToTasks([
  ...vocabularySources,
  ...spellingExampleSources,
])

export function taskIdsForWord(word: string): readonly string[] {
  const normalized = word.toLowerCase()
  return (
    wordToTasks[normalized] ??
    wordToTasks[lemmatizeEnglishWord(normalized)] ??
    []
  )
}

export function writingTaskIdsForWord(word: string): readonly string[] {
  return taskIdsForWord(word).filter((taskId) => taskId.startsWith('wr-'))
}
