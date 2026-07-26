import type {
  SimplificationTask,
  SpellingErrorTag,
  SpellingStrategy,
  SpellingWord,
  StageId,
  SkillId,
  WritingTask,
} from '../../domain/learner/types'
import { simplificationTasks } from '../simplification'
import { writingTasks } from '../writing'
import { tokenizeEnglish } from '../index/wordTools'
import {
  SPELLING_PATTERN_LABELS,
  type RequiredSpellingPatternId,
} from './patternCatalog'

export type ExpandedSpellingSeed = readonly [
  word: string,
  meaningJa: string,
  stage: StageId,
  patterns: readonly [
    RequiredSpellingPatternId,
    ...RequiredSpellingPatternId[],
  ],
  partOfSpeech?: string,
  chunks?: readonly string[],
]

interface ExampleSource {
  en: string
  ja: string
}

const writingExamples: ExampleSource[] = writingTasks.flatMap((task: WritingTask) =>
  task.modelAnswers.map((en) => ({ en, ja: task.promptJa })),
)

const simplificationExamples: ExampleSource[] = simplificationTasks.flatMap(
  (task: SimplificationTask) =>
    (task.modelEn ?? []).map((en) => ({ en, ja: task.originalJa })),
)

const exampleSources = [...writingExamples, ...simplificationExamples]

function includesWord(text: string, word: string): boolean {
  const target = word.toLowerCase()
  return tokenizeEnglish(text).includes(target)
}

function sentenceContaining(text: string, word: string): string {
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text]
  return sentences.find((sentence) => includesWord(sentence, word))?.trim() ?? text
}

function findExample(word: string): ExampleSource {
  const source = exampleSources.find(({ en }) => includesWord(en, word))
  if (!source) {
    throw new Error(`No writing or simplification example contains "${word}".`)
  }
  return { ...source, en: sentenceContaining(source.en, word) }
}

function strategyFor(
  patterns: readonly RequiredSpellingPatternId[],
): SpellingStrategy {
  if (patterns.some((pattern) => pattern === 'high-frequency-irregular')) {
    return 'irregular'
  }
  if (
    patterns.some(
      (pattern) =>
        pattern.startsWith('prefix-') ||
        pattern.startsWith('suffix-') ||
        pattern.startsWith('inflection-'),
    )
  ) {
    return 'morpheme'
  }
  return 'pattern'
}

function skillsFor(
  patterns: readonly RequiredSpellingPatternId[],
): SkillId[] {
  const skills = new Set<SkillId>()
  for (const pattern of patterns) {
    if (pattern === 'short-vowel') skills.add('spelling.shortVowel')
    else if (pattern === 'long-vowel-silent-e') skills.add('spelling.longVowel')
    else if (pattern.startsWith('vowel-team-')) skills.add('spelling.vowelTeam')
    else if (pattern.startsWith('silent-')) skills.add('spelling.silentLetter')
    else if (pattern.startsWith('double-')) skills.add('spelling.doubleConsonant')
    else if (pattern.startsWith('prefix-')) skills.add('spelling.prefix')
    else if (pattern.startsWith('suffix-')) skills.add('spelling.suffix')
    else if (pattern.startsWith('inflection-')) skills.add('spelling.inflection')
    else if (pattern === 'high-frequency-irregular') {
      skills.add('spelling.irregular')
    } else {
      skills.add('spelling.wordFamily')
    }
  }
  return [...skills]
}

function errorsFor(
  patterns: readonly RequiredSpellingPatternId[],
): SpellingErrorTag[] {
  const errors = new Set<SpellingErrorTag>()
  for (const pattern of patterns) {
    if (pattern.startsWith('vowel-team-') || pattern.startsWith('r-controlled-')) {
      errors.add('vowelChoice')
    } else if (pattern.startsWith('silent-')) errors.add('silentLetter')
    else if (pattern.startsWith('double-')) errors.add('doubleConsonant')
    else if (pattern.startsWith('prefix-')) errors.add('prefix')
    else if (pattern.startsWith('suffix-')) errors.add('suffix')
    else if (pattern.startsWith('inflection-')) errors.add('inflection')
    else if (pattern === 'high-frequency-irregular') errors.add('irregular')
    else errors.add('soundToLetter')
  }
  return [...errors]
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])
const COMMON_ONSETS = new Set([
  'bl',
  'br',
  'ch',
  'cl',
  'cr',
  'dr',
  'fl',
  'fr',
  'gl',
  'gr',
  'ph',
  'pl',
  'pr',
  'sc',
  'sh',
  'sk',
  'sl',
  'sm',
  'sn',
  'sp',
  'st',
  'sw',
  'th',
  'tr',
  'tw',
  'wh',
  'wr',
  'scr',
  'spl',
  'spr',
  'str',
])

const SYLLABLE_OVERRIDES: Readonly<Record<string, readonly string[]>> = {
  action: ['act', 'ion'],
  discussion: ['dis', 'cus', 'sion'],
  expand: ['expand'],
  knowledge: ['know', 'ledge'],
  pressure: ['pres', 'sure'],
  serious: ['se', 'ri', 'ous'],
  situation: ['sit', 'u', 'a', 'tion'],
  success: ['suc', 'cess'],
  unable: ['un', 'a', 'ble'],
  work: ['work'],
  young: ['young'],
}

function isVowel(word: string, index: number): boolean {
  const letter = word[index]
  if (!VOWELS.has(letter)) return false
  return letter !== 'y' || index > 0
}

function vowelNuclei(word: string): Array<{ start: number; end: number }> {
  const nuclei: Array<{ start: number; end: number }> = []
  let index = 0
  while (index < word.length) {
    const finalSilentE =
      index === word.length - 1 &&
      word[index] === 'e' &&
      nuclei.length > 0
    if (!isVowel(word, index) || finalSilentE) {
      index += 1
      continue
    }
    const start = index
    index += 1
    while (index < word.length && isVowel(word, index)) index += 1
    nuclei.push({ start, end: index })
  }
  return nuclei
}

function onsetLength(consonants: string): number {
  for (const length of [3, 2]) {
    const candidate = consonants.slice(-length)
    if (COMMON_ONSETS.has(candidate)) return length
  }
  return 0
}

/**
 * Produces orthographic sound chunks without claiming an etymology.
 * Manual morpheme data always takes precedence in makeExpandedSpellingPack.
 */
export function syllableChunks(word: string): string[] {
  const normalized = word.toLowerCase()
  const override = SYLLABLE_OVERRIDES[normalized]
  if (override) return [...override]

  const nuclei = vowelNuclei(normalized)
  if (nuclei.length === 0 || normalized.length <= 3) return [word]

  if (nuclei.length === 1) {
    const nucleus = nuclei[0]
    const boundary =
      nucleus.start > 0
        ? nucleus.start
        : nucleus.end < normalized.length - 1
          ? nucleus.end
          : 0
    return boundary > 0
      ? [word.slice(0, boundary), word.slice(boundary)]
      : [word]
  }

  const boundaries: number[] = []
  for (let index = 0; index < nuclei.length - 1; index += 1) {
    const left = nuclei[index]
    const right = nuclei[index + 1]
    const consonants = normalized.slice(left.end, right.start)
    let boundary = left.end
    if (consonants.length === 1) {
      boundary = left.end
    } else if (consonants.length > 1) {
      const onset = onsetLength(consonants)
      boundary = onset > 0 ? right.start - onset : right.start - 1
    }
    if (boundary > 0 && boundary < word.length) boundaries.push(boundary)
  }

  const chunks: string[] = []
  let start = 0
  for (const boundary of [...new Set(boundaries)].sort((a, b) => a - b)) {
    if (boundary <= start) continue
    chunks.push(word.slice(start, boundary))
    start = boundary
  }
  chunks.push(word.slice(start))
  return chunks.filter(Boolean)
}

function labelsForManualChunks(
  chunks: readonly string[],
  patterns: readonly RequiredSpellingPatternId[],
): string[] {
  const hasPrefix = patterns.some((pattern) => pattern.startsWith('prefix-'))
  const hasInflection = patterns.some((pattern) =>
    pattern.startsWith('inflection-'),
  )
  const hasSuffix = patterns.some((pattern) => pattern.startsWith('suffix-'))
  return chunks.map((_, index) => {
    if (index === 0 && hasPrefix) return '接頭辞'
    if (index === chunks.length - 1 && hasInflection) return '語形変化'
    if (index === chunks.length - 1 && hasSuffix) return '接尾辞'
    return '語幹'
  })
}

function swapDistinctPair(word: string): string {
  const letters = [...word]
  const index = letters.findIndex(
    (letter, position) =>
      position > 0 && letter !== letters[position - 1],
  )
  if (index < 1) return `${word}e`
  ;[letters[index - 1], letters[index]] = [letters[index], letters[index - 1]]
  return letters.join('')
}

function commonMistakes(word: string): string[] {
  const omissionIndex = Math.max(1, Math.floor(word.length / 2))
  const omission = `${word.slice(0, omissionIndex)}${word.slice(omissionIndex + 1)}`
  return [...new Set([omission, swapDistinctPair(word)])].filter(
    (mistake) => mistake !== word,
  )
}

export function makeExpandedSpellingPack(
  firstNumber: number,
  seeds: readonly ExpandedSpellingSeed[],
): SpellingWord[] {
  return seeds.map((seed, index) => {
    const [word, meaningJa, stage, patterns, partOfSpeech, manualChunks] = seed
    const strategy = strategyFor(patterns)
    if (manualChunks && manualChunks.join('') !== word) {
      throw new Error(`Manual chunks do not reconstruct "${word}".`)
    }
    const chunks = manualChunks ? [...manualChunks] : syllableChunks(word)
    const example = findExample(word)
    return {
      id: `sp-${String(firstNumber + index).padStart(4, '0')}`,
      word,
      meaningJa,
      stage,
      partOfSpeech: partOfSpeech ?? '語',
      strategy,
      chunks,
      chunkKind: manualChunks ? 'morpheme' : 'phonetic',
      ...(manualChunks
        ? { chunkLabels: labelsForManualChunks(manualChunks, patterns) }
        : {}),
      patterns: [...patterns],
      skillIds: skillsFor(patterns),
      exampleEn: example.en,
      exampleJa: example.ja,
      acceptedAnswers: [word],
      commonMistakes: commonMistakes(word),
      errorTags: errorsFor(patterns),
      audioHintJa: `${SPELLING_PATTERN_LABELS[patterns[0]]}のまとまりを確認します。`,
    }
  })
}
