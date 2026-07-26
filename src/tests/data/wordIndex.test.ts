import { describe, expect, it } from 'vitest'
import {
  buildWordFrequency,
  buildWordToTasks,
  lemmatizeEnglishWord,
  taskIdsForWord,
  tokenizeEnglish,
  vocabularyFrequency,
  wordToTasks,
} from '../../data'

describe('curriculum vocabulary index', () => {
  it('tokenizes English without punctuation and normalizes case', () => {
    expect(tokenizeEnglish("Students' ideas improve daily.")).toEqual([
      'students',
      'ideas',
      'improve',
      'daily',
    ])
  })

  it.each([
    ['studies', 'study'],
    ['children', 'child'],
    ['running', 'run'],
    ['written', 'write'],
    ['boxes', 'box'],
  ])('lemmatizes %s as %s', (surface, lemma) => {
    expect(lemmatizeEnglishWord(surface)).toBe(lemma)
  })

  it('counts lemmas across model texts', () => {
    const sources = [
      { id: 'wr-a', texts: ['Students study online.'] },
      { id: 'wr-b', texts: ['A student studies at home.'] },
    ]
    expect(buildWordFrequency(sources).study).toBe(2)
  })

  it('indexes both surface forms and lemmas to unique task IDs', () => {
    const index = buildWordToTasks([
      { id: 'wr-a', texts: ['Students study online. Students learn.'] },
      { id: 'wr-b', texts: ['A student studies at home.'] },
    ])
    expect(index.students).toEqual(['wr-a'])
    expect(index.student).toEqual(['wr-a', 'wr-b'])
    expect(index.study).toEqual(['wr-a', 'wr-b'])
  })

  it('exports a non-empty build-time curriculum index', () => {
    expect(Object.keys(wordToTasks).length).toBeGreaterThan(100)
    expect(Object.keys(vocabularyFrequency).length).toBeGreaterThan(100)
    expect(taskIdsForWord('study').length).toBeGreaterThan(0)
  })
})
