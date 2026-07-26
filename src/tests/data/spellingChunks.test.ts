import { describe, expect, it } from 'vitest'
import {
  spellingPack02,
  spellingPack03,
  spellingPack04,
  spellingPack05,
  spellingPack06,
  spellingWords,
} from '../../data/spelling'
import { syllableChunks } from '../../data/spelling/packFactory'

const expandedWords = [
  ...spellingPack02,
  ...spellingPack03,
  ...spellingPack04,
  ...spellingPack05,
  ...spellingPack06,
]

const MANUAL_MORPHEME_CHUNKS: Readonly<Record<string, readonly string[]>> = {
  agreement: ['agree', 'ment'],
  carefully: ['careful', 'ly'],
  clearly: ['clear', 'ly'],
  disagree: ['dis', 'agree'],
  disagreement: ['dis', 'agree', 'ment'],
  fairness: ['fair', 'ness'],
  harmful: ['harm', 'ful'],
  illness: ['ill', 'ness'],
  impossible: ['im', 'possible'],
  improvement: ['improve', 'ment'],
  incorrect: ['in', 'correct'],
  indirect: ['in', 'direct'],
  kindness: ['kind', 'ness'],
  meaningful: ['meaning', 'ful'],
  movement: ['move', 'ment'],
  powerful: ['power', 'ful'],
  strongly: ['strong', 'ly'],
  treatment: ['treat', 'ment'],
  unaffordable: ['un', 'afford', 'able'],
  unfairly: ['un', 'fair', 'ly'],
  unnecessary: ['un', 'necessary'],
  unusual: ['un', 'usual'],
  unknown: ['un', 'known'],
}

describe('spelling chunks', () => {
  it('reconstructs every spelling word exactly', () => {
    for (const item of spellingWords) {
      expect(item.chunks.join(''), item.id).toBe(item.word)
    }
  })

  it('keeps one-chunk words below ten percent', () => {
    const oneChunk = spellingWords.filter((item) => item.chunks.length === 1)
    expect(oneChunk.length / spellingWords.length).toBeLessThan(0.1)
  })

  it('uses morpheme labels only for manually chunked expanded seeds', () => {
    for (const item of expandedWords) {
      const expected = MANUAL_MORPHEME_CHUNKS[item.word]
      if (expected) {
        expect(item.chunkKind, item.word).toBe('morpheme')
        expect(item.chunks, item.word).toEqual(expected)
        expect(item.chunkLabels, item.word).toHaveLength(expected.length)
      } else {
        expect(item.chunkKind, item.word).toBe('phonetic')
        expect(item.chunkLabels, item.word).toBeUndefined()
      }
    }
  })

  it('creates useful phonetic chunks for representative words', () => {
    expect(syllableChunks('success')).toEqual(['suc', 'cess'])
    expect(syllableChunks('pressure')).toEqual(['pres', 'sure'])
    expect(syllableChunks('knowledge')).toEqual(['know', 'ledge'])
    expect(syllableChunks('work')).toEqual(['work'])
    expect(syllableChunks('young')).toEqual(['young'])
  })

  it('does not reproduce the former false morpheme boundaries', () => {
    const forbidden = new Set([
      'ac|tion',
      'situa|tion',
      'discus|sion',
      'seri|ous',
      'un|able',
      'ex|pand',
    ])
    for (const item of spellingWords) {
      expect(forbidden.has(item.chunks.join('|')), item.word).toBe(false)
    }
  })
})
