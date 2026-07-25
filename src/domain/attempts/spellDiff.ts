import type {
  SpellingErrorTag,
  WritingErrorTag,
} from '../learner/types'

export type SpellEditType =
  | 'match'
  | 'substitute'
  | 'insert'
  | 'delete'
  | 'transpose'

export interface SpellEdit {
  type: SpellEditType
  expectedIndex: number
  actualIndex: number
  expectedChar: string
  actualChar: string
}

export interface SpellAnalysis {
  expected: string
  actual: string
  normalizedExpected: string
  normalizedActual: string
  correct: boolean
  capitalizationOnly: boolean
  operations: SpellEdit[]
  distance: number
  primaryTag: SpellingErrorTag | WritingErrorTag | null
  errorTags: Array<SpellingErrorTag | WritingErrorTag>
}

interface BackPointer {
  previousI: number
  previousJ: number
  operation: SpellEdit
}

const VOWELS = new Set('aeiouy')
const PREFIXES = ['un', 're', 'dis', 'in', 'im', 'pre', 'ex', 'com']
const SUFFIXES = [
  'ment',
  'tion',
  'sion',
  'ture',
  'ous',
  'ive',
  'able',
  'ible',
  'ness',
  'ful',
]
const INFLECTIONS = ['ing', 'ed', 'es', 's']

const TAG_PRIORITY: SpellingErrorTag[] = [
  'transposition',
  'doubleConsonant',
  'vowelChoice',
  'consonantChoice',
  'silentLetter',
  'suffix',
  'prefix',
  'inflection',
  'omission',
  'insertion',
  'notRecalled',
  'irregular',
  'soundToLetter',
]

function toHalfWidth(value: string): string {
  return value.replace(/[\uFF01-\uFF5E]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0xfee0),
  )
}

export function normalizeAnswerPreservingCase(value: string): string {
  return toHalfWidth(value)
    .replace(/\u3000/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑‒–—―]/g, '-')
}

export function normalizeAnswer(value: string): string {
  return normalizeAnswerPreservingCase(value).toLocaleLowerCase('en-US')
}

function makeMatrix<T>(rows: number, columns: number, initial: T): T[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => initial),
  )
}

export function spellDiff(expectedInput: string, actualInput: string): SpellEdit[] {
  const expected = normalizeAnswer(expectedInput)
  const actual = normalizeAnswer(actualInput)
  const rows = expected.length + 1
  const columns = actual.length + 1
  const distances = makeMatrix(rows, columns, 0)
  const back = makeMatrix<BackPointer | null>(rows, columns, null)

  for (let i = 1; i < rows; i += 1) {
    distances[i][0] = i
    back[i][0] = {
      previousI: i - 1,
      previousJ: 0,
      operation: {
        type: 'delete',
        expectedIndex: i - 1,
        actualIndex: 0,
        expectedChar: expected[i - 1],
        actualChar: '',
      },
    }
  }
  for (let j = 1; j < columns; j += 1) {
    distances[0][j] = j
    back[0][j] = {
      previousI: 0,
      previousJ: j - 1,
      operation: {
        type: 'insert',
        expectedIndex: 0,
        actualIndex: j - 1,
        expectedChar: '',
        actualChar: actual[j - 1],
      },
    }
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < columns; j += 1) {
      const isMatch = expected[i - 1] === actual[j - 1]
      let bestCost = distances[i - 1][j - 1] + (isMatch ? 0 : 1)
      let pointer: BackPointer = {
        previousI: i - 1,
        previousJ: j - 1,
        operation: {
          type: isMatch ? 'match' : 'substitute',
          expectedIndex: i - 1,
          actualIndex: j - 1,
          expectedChar: expected[i - 1],
          actualChar: actual[j - 1],
        },
      }

      if (
        i > 1 &&
        j > 1 &&
        expected[i - 1] === actual[j - 2] &&
        expected[i - 2] === actual[j - 1]
      ) {
        const transposeCost = distances[i - 2][j - 2] + 1
        if (transposeCost < bestCost) {
          bestCost = transposeCost
          pointer = {
            previousI: i - 2,
            previousJ: j - 2,
            operation: {
              type: 'transpose',
              expectedIndex: i - 2,
              actualIndex: j - 2,
              expectedChar: expected.slice(i - 2, i),
              actualChar: actual.slice(j - 2, j),
            },
          }
        }
      }

      const deleteCost = distances[i - 1][j] + 1
      if (deleteCost < bestCost) {
        bestCost = deleteCost
        pointer = {
          previousI: i - 1,
          previousJ: j,
          operation: {
            type: 'delete',
            expectedIndex: i - 1,
            actualIndex: j,
            expectedChar: expected[i - 1],
            actualChar: '',
          },
        }
      }

      const insertCost = distances[i][j - 1] + 1
      if (insertCost < bestCost) {
        bestCost = insertCost
        pointer = {
          previousI: i,
          previousJ: j - 1,
          operation: {
            type: 'insert',
            expectedIndex: i,
            actualIndex: j - 1,
            expectedChar: '',
            actualChar: actual[j - 1],
          },
        }
      }

      distances[i][j] = bestCost
      back[i][j] = pointer
    }
  }

  const operations: SpellEdit[] = []
  let i = expected.length
  let j = actual.length
  while (i > 0 || j > 0) {
    const pointer = back[i][j]
    if (!pointer) break
    operations.push(pointer.operation)
    i = pointer.previousI
    j = pointer.previousJ
  }
  return operations.reverse()
}

function editPosition(edit: SpellEdit): number {
  return edit.expectedIndex
}

function touchesEnding(
  expected: string,
  edits: SpellEdit[],
  endings: string[],
): boolean {
  return endings.some((ending) => {
    if (!expected.endsWith(ending)) return false
    const start = expected.length - ending.length
    return edits.some((edit) => editPosition(edit) >= start)
  })
}

function touchesPrefix(
  expected: string,
  edits: SpellEdit[],
  prefixes: string[],
): boolean {
  return prefixes.some(
    (prefix) =>
      expected.startsWith(prefix) &&
      edits.some((edit) => editPosition(edit) < prefix.length),
  )
}

function isDoubleConsonantEdit(
  expected: string,
  actual: string,
  edit: SpellEdit,
): boolean {
  if (edit.type === 'insert') {
    const character = edit.actualChar
    const left = actual[edit.actualIndex - 1]
    const right = actual[edit.actualIndex + 1]
    return !VOWELS.has(character) && (character === left || character === right)
  }
  if (edit.type === 'delete') {
    const character = edit.expectedChar
    const left = expected[edit.expectedIndex - 1]
    const right = expected[edit.expectedIndex + 1]
    return !VOWELS.has(character) && (character === left || character === right)
  }
  return false
}

function isSilentLetterOmission(expected: string, edit: SpellEdit): boolean {
  if (edit.type !== 'delete') return false
  const { expectedIndex: index, expectedChar: character } = edit
  if (character === 'e' && index === expected.length - 1) return true
  if (index === 0 && ['kn', 'wr', 'gn', 'ps'].includes(expected.slice(0, 2))) {
    return true
  }
  if (character === 'b' && expected.endsWith('mb')) return true
  if (character === 'l' && /(?:ould|alk|alf)$/.test(expected)) return true
  return (
    (character === 'g' || character === 'h') &&
    expected.slice(Math.max(0, index - 1), index + 2).includes('gh')
  )
}

function pushIf(tags: SpellingErrorTag[], condition: boolean, tag: SpellingErrorTag) {
  if (condition && !tags.includes(tag)) tags.push(tag)
}

export function classifySpellingErrors(
  expectedInput: string,
  actualInput: string,
  operations = spellDiff(expectedInput, actualInput),
): SpellingErrorTag[] {
  const expected = normalizeAnswer(expectedInput)
  const actual = normalizeAnswer(actualInput)
  const edits = operations.filter((operation) => operation.type !== 'match')
  if (edits.length === 0) return []

  const recalledPrefix =
    actual.length > 0 &&
    actual.length <= Math.max(2, Math.floor(expected.length * 0.35)) &&
    expected.startsWith(actual)
  if (actual.length === 0 || recalledPrefix) return ['notRecalled']

  const tags: SpellingErrorTag[] = []
  const transposes = edits.filter((edit) => edit.type === 'transpose')
  pushIf(
    tags,
    transposes.some(
      (edit) =>
        ![...edit.expectedChar].every((character) => VOWELS.has(character)),
    ),
    'transposition',
  )
  pushIf(
    tags,
    edits.some((edit) => isDoubleConsonantEdit(expected, actual, edit)),
    'doubleConsonant',
  )
  pushIf(
    tags,
    edits.some(
      (edit) =>
        (edit.type === 'substitute' &&
          VOWELS.has(edit.expectedChar) &&
          VOWELS.has(edit.actualChar)) ||
        (edit.type === 'transpose' &&
          [...edit.expectedChar].every((character) => VOWELS.has(character))),
    ),
    'vowelChoice',
  )
  pushIf(
    tags,
    edits.some(
      (edit) =>
        edit.type === 'substitute' &&
        !VOWELS.has(edit.expectedChar) &&
        !VOWELS.has(edit.actualChar),
    ),
    'consonantChoice',
  )
  pushIf(
    tags,
    edits.some((edit) => isSilentLetterOmission(expected, edit)),
    'silentLetter',
  )
  pushIf(tags, touchesEnding(expected, edits, SUFFIXES), 'suffix')
  pushIf(tags, touchesPrefix(expected, edits, PREFIXES), 'prefix')
  pushIf(tags, touchesEnding(expected, edits, INFLECTIONS), 'inflection')
  pushIf(tags, edits.some((edit) => edit.type === 'delete'), 'omission')
  pushIf(tags, edits.some((edit) => edit.type === 'insert'), 'insertion')

  if (tags.length === 0) {
    const distance = edits.length
    const isLargeDifference = distance > Math.max(2, expected.length * 0.45)
    tags.push(isLargeDifference ? 'irregular' : 'soundToLetter')
  }
  return TAG_PRIORITY.filter((tag) => tags.includes(tag))
}

export function analyzeSpellAnswer(input: {
  expected: string
  actual: string
  acceptedAnswers?: readonly string[]
}): SpellAnalysis {
  const accepted = Array.from(
    new Set([input.expected, ...(input.acceptedAnswers ?? [])]),
  )
  const normalizedActual = normalizeAnswer(input.actual)
  const matchedAnswer = accepted.find(
    (answer) => normalizeAnswer(answer) === normalizedActual,
  )
  const comparisonExpected = matchedAnswer ?? input.expected
  const operations = spellDiff(comparisonExpected, input.actual)
  const edits = operations.filter((operation) => operation.type !== 'match')
  const correct = matchedAnswer !== undefined
  const capitalizationOnly =
    correct &&
    normalizeAnswerPreservingCase(comparisonExpected) !==
      normalizeAnswerPreservingCase(input.actual)
  const spellingTags = correct
    ? []
    : classifySpellingErrors(comparisonExpected, input.actual, operations)
  const errorTags: Array<SpellingErrorTag | WritingErrorTag> =
    capitalizationOnly ? ['capitalization'] : spellingTags

  return {
    expected: comparisonExpected,
    actual: input.actual,
    normalizedExpected: normalizeAnswer(comparisonExpected),
    normalizedActual,
    correct,
    capitalizationOnly,
    operations,
    distance: edits.length,
    primaryTag: errorTags[0] ?? null,
    errorTags,
  }
}
