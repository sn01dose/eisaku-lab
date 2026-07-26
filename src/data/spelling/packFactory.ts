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

const AFFIXES: Readonly<Record<string, readonly string[]>> = {
  'prefix-un': ['un'],
  'prefix-re': ['re'],
  'prefix-dis': ['dis'],
  'prefix-in-im': ['in', 'im'],
  'prefix-pre': ['pre'],
  'prefix-ex': ['ex'],
  'prefix-com-con': ['com', 'con'],
  'suffix-tion': ['tion'],
  'suffix-sion': ['sion'],
  'suffix-ture': ['ture'],
  'suffix-ous': ['ous'],
  'suffix-ive': ['ive'],
  'suffix-able-ible': ['able', 'ible'],
  'suffix-ment': ['ment'],
  'suffix-ness': ['ness'],
  'suffix-ful': ['ful'],
  'suffix-ly': ['ly'],
  'inflection-s-es': ['es', 's'],
  'inflection-ed': ['ed'],
  'inflection-ing': ['ing'],
}

function morphemeChunks(
  word: string,
  patterns: readonly RequiredSpellingPatternId[],
): { chunks: string[]; labels?: string[] } {
  for (const pattern of patterns) {
    const affixes = AFFIXES[pattern] ?? []
    for (const affix of affixes) {
      if (pattern.startsWith('prefix-') && word.startsWith(affix)) {
        return {
          chunks: [affix, word.slice(affix.length)],
          labels: ['接頭辞', '語幹'],
        }
      }
      if (
        (pattern.startsWith('suffix-') || pattern.startsWith('inflection-')) &&
        word.endsWith(affix) &&
        word.length > affix.length
      ) {
        return {
          chunks: [word.slice(0, -affix.length), affix],
          labels: ['語幹', pattern.startsWith('suffix-') ? '接尾辞' : '語形変化'],
        }
      }
    }
  }
  return { chunks: [word] }
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
  return seeds.map(([word, meaningJa, stage, patterns, partOfSpeech], index) => {
    const strategy = strategyFor(patterns)
    const { chunks, labels } = morphemeChunks(word, patterns)
    const example = findExample(word)
    return {
      id: `sp-${String(firstNumber + index).padStart(4, '0')}`,
      word,
      meaningJa,
      stage,
      partOfSpeech: partOfSpeech ?? '語',
      strategy,
      chunks,
      chunkKind: strategy === 'morpheme' ? 'morpheme' : 'phonetic',
      ...(labels ? { chunkLabels: labels } : {}),
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
