import { describe, expect, it } from 'vitest'
import {
  analyzeSpellAnswer,
  classifySpellingErrors,
  normalizeAnswer,
  spellDiff,
} from '../../domain/attempts/spellDiff'

describe('normalizeAnswer', () => {
  it.each([
    [' Development ', 'development'],
    ['two   words', 'two words'],
    ['Ｄｅｖｅｌｏｐｍｅｎｔ　Ｔｅａｍ', 'development team'],
    ["student’s–idea", "student's-idea"],
    ["student‘ｓ‐idea", "student's-idea"],
  ])('%s を %s に正規化する', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected)
  })
})

describe('spellDiff', () => {
  it.each([
    ['cat', 'cot', ['substitute']],
    ['spell', 'spel', ['delete']],
    ['come', 'comme', ['insert']],
    ['the', 'teh', ['transpose']],
    ['planet', 'plxne', ['substitute', 'delete']],
  ])('%s と %s の編集経路を復元する', (expected, actual, editTypes) => {
    const actualEdits = spellDiff(expected, actual)
      .filter(({ type }) => type !== 'match')
      .map(({ type }) => type)
    expect(actualEdits).toEqual(editTypes)
  })
})

describe('誤りタグ分類', () => {
  it.each([
    ['development', 'developement', 'suffix'],
    ['receive', 'recieve', 'vowelChoice'],
    ['coming', 'comming', 'doubleConsonant'],
    ['the', 'teh', 'transposition'],
    ['cat', 'cet', 'vowelChoice'],
    ['dog', 'dok', 'consonantChoice'],
    ['knife', 'nife', 'silentLetter'],
    ['careful', 'carefu', 'suffix'],
    ['unhappy', 'unhapy', 'doubleConsonant'],
    ['played', 'playd', 'inflection'],
    ['book', 'bok', 'omission'],
    ['word', 'wordd', 'insertion'],
    ['important', '', 'notRecalled'],
  ])('%s → %s は %s を含む', (expected, actual, tag) => {
    expect(classifySpellingErrors(expected, actual)).toContain(tag)
  })

  it('代表例では最重要タグを先頭にする', () => {
    expect(classifySpellingErrors('development', 'developement')[0]).toBe(
      'suffix',
    )
    expect(classifySpellingErrors('receive', 'recieve')[0]).toBe('vowelChoice')
    expect(classifySpellingErrors('coming', 'comming')[0]).toBe(
      'doubleConsonant',
    )
  })
})

describe('analyzeSpellAnswer', () => {
  it('許容綴りを正解として扱う', () => {
    const result = analyzeSpellAnswer({
      expected: 'color',
      actual: 'colour',
      acceptedAnswers: ['color', 'colour'],
    })
    expect(result.correct).toBe(true)
    expect(result.distance).toBe(0)
  })

  it('大文字小文字だけの差は正解にして注意タグを付ける', () => {
    const result = analyzeSpellAnswer({
      expected: 'development',
      actual: 'Development',
    })
    expect(result.correct).toBe(true)
    expect(result.capitalizationOnly).toBe(true)
    expect(result.errorTags).toEqual(['capitalization'])
  })
})
