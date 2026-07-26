import type {
  SimplificationTask,
  WritingTask,
} from '../../domain/learner/types'

const IRREGULAR_LEMMAS: Readonly<Record<string, string>> = {
  am: 'be',
  are: 'be',
  been: 'be',
  being: 'be',
  is: 'be',
  was: 'be',
  were: 'be',
  children: 'child',
  feet: 'foot',
  geese: 'goose',
  men: 'man',
  mice: 'mouse',
  people: 'person',
  teeth: 'tooth',
  women: 'woman',
  better: 'good',
  best: 'good',
  worse: 'bad',
  worst: 'bad',
  became: 'become',
  becoming: 'become',
  begun: 'begin',
  began: 'begin',
  believed: 'believe',
  believing: 'believe',
  bought: 'buy',
  brought: 'bring',
  built: 'build',
  came: 'come',
  chose: 'choose',
  chosen: 'choose',
  choosing: 'choose',
  created: 'create',
  creating: 'create',
  decreased: 'decrease',
  decreasing: 'decrease',
  did: 'do',
  done: 'do',
  felt: 'feel',
  found: 'find',
  gave: 'give',
  given: 'give',
  giving: 'give',
  gone: 'go',
  grew: 'grow',
  grown: 'grow',
  had: 'have',
  heard: 'hear',
  kept: 'keep',
  knew: 'know',
  known: 'know',
  led: 'lead',
  left: 'leave',
  lost: 'lose',
  made: 'make',
  making: 'make',
  meant: 'mean',
  met: 'meet',
  paid: 'pay',
  ran: 'run',
  read: 'read',
  received: 'receive',
  receiving: 'receive',
  reduced: 'reduce',
  reducing: 'reduce',
  said: 'say',
  saw: 'see',
  seen: 'see',
  sent: 'send',
  spoke: 'speak',
  spoken: 'speak',
  spent: 'spend',
  stood: 'stand',
  studied: 'study',
  taken: 'take',
  taking: 'take',
  taught: 'teach',
  thought: 'think',
  took: 'take',
  told: 'tell',
  understood: 'understand',
  went: 'go',
  won: 'win',
  wrote: 'write',
  writing: 'write',
  written: 'write',
  achieved: 'achieve',
  achieving: 'achieve',
  changed: 'change',
  changing: 'change',
  encouraged: 'encourage',
  encouraging: 'encourage',
  improved: 'improve',
  improving: 'improve',
  increased: 'increase',
  increasing: 'increase',
  managed: 'manage',
  managing: 'manage',
  moved: 'move',
  moving: 'move',
  provided: 'provide',
  providing: 'provide',
  saved: 'save',
  saving: 'save',
  shared: 'share',
  sharing: 'share',
  used: 'use',
  using: 'use',
}

const KEEP_FINAL_S = /(?:ss|us|is)$/
const WORD_PATTERN = /[a-z]+(?:['-][a-z]+)*/g

export function tokenizeEnglish(text: string): string[] {
  return text.toLowerCase().match(WORD_PATTERN) ?? []
}

function stripDoubledFinalConsonant(stem: string): string {
  return /([b-df-hj-np-tv-z])\1$/.test(stem) ? stem.slice(0, -1) : stem
}

export function lemmatizeEnglishWord(input: string): string {
  const word = input.toLowerCase()
  const irregular = IRREGULAR_LEMMAS[word]
  if (irregular) return irregular
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 5 && word.endsWith('ing')) {
    return stripDoubledFinalConsonant(word.slice(0, -3))
  }
  if (word.length > 4 && word.endsWith('ied')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && word.endsWith('ed')) {
    return stripDoubledFinalConsonant(word.slice(0, -2))
  }
  if (word.length > 4 && word.endsWith('es') && /(ch|sh|ss|x|z)es$/.test(word)) {
    return word.slice(0, -2)
  }
  if (word.length > 3 && word.endsWith('s') && !KEEP_FINAL_S.test(word)) {
    return word.slice(0, -1)
  }
  return word
}

export interface VocabularySource {
  id: string
  texts: readonly string[]
}

export function curriculumVocabularySources(
  writingTasks: readonly WritingTask[],
  simplificationTasks: readonly SimplificationTask[],
): VocabularySource[] {
  return [
    ...writingTasks.map((task) => ({
      id: task.id,
      texts: task.modelAnswers,
    })),
    ...simplificationTasks.map((task) => ({
      id: task.id,
      texts: task.modelEn ?? [],
    })),
  ]
}

export function buildWordFrequency(
  sources: readonly VocabularySource[],
): Readonly<Record<string, number>> {
  const frequency: Record<string, number> = {}
  for (const source of sources) {
    for (const text of source.texts) {
      for (const surface of tokenizeEnglish(text)) {
        const lemma = lemmatizeEnglishWord(surface)
        frequency[lemma] = (frequency[lemma] ?? 0) + 1
      }
    }
  }
  return frequency
}

export function buildWordToTasks(
  sources: readonly VocabularySource[],
): Readonly<Record<string, readonly string[]>> {
  const index = new Map<string, Set<string>>()
  for (const source of sources) {
    for (const text of source.texts) {
      for (const surface of tokenizeEnglish(text)) {
        const keys = new Set([surface, lemmatizeEnglishWord(surface)])
        for (const key of keys) {
          const taskIds = index.get(key) ?? new Set<string>()
          taskIds.add(source.id)
          index.set(key, taskIds)
        }
      }
    }
  }
  return Object.fromEntries(
    [...index.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([word, ids]) => [word, [...ids].sort()]),
  )
}
