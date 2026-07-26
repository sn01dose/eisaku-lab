import { stage1SpellingWords } from './stage1'
import { stage2SpellingWords } from './stage2'
import { stage3SpellingWords } from './stage3'
import { stage4SpellingWords } from './stage4'
import { stage5SpellingWords } from './stage5'
import { stage6SpellingWords } from './stage6'
import { spellingPack02 } from './pack-02'
import { spellingPack03 } from './pack-03'
import { spellingPack04 } from './pack-04'
import { spellingPack05 } from './pack-05'
import { spellingPack06 } from './pack-06'
import { REQUIRED_PATTERN_WORDS } from './patternVocabulary'

export * from './patternCatalog'
export * from './patternVocabulary'
export {
  stage1SpellingWords,
  stage2SpellingWords,
  stage3SpellingWords,
  stage4SpellingWords,
  stage5SpellingWords,
  stage6SpellingWords,
  spellingPack02,
  spellingPack03,
  spellingPack04,
  spellingPack05,
  spellingPack06,
}

const baseSpellingWords = [
  ...stage1SpellingWords,
  ...stage2SpellingWords,
  ...stage3SpellingWords,
  ...stage4SpellingWords,
  ...stage5SpellingWords,
  ...stage6SpellingWords,
  ...spellingPack02,
  ...spellingPack03,
  ...spellingPack04,
  ...spellingPack05,
  ...spellingPack06,
]

const requiredPatternsByWord = new Map<string, string[]>()
for (const [patternId, words] of Object.entries(REQUIRED_PATTERN_WORDS)) {
  for (const word of words) {
    const patterns = requiredPatternsByWord.get(word) ?? []
    patterns.push(patternId)
    requiredPatternsByWord.set(word, patterns)
  }
}

export const spellingWords = baseSpellingWords.map((item) => ({
  ...item,
  patterns: [
    ...new Set([
      ...item.patterns,
      ...(requiredPatternsByWord.get(item.word) ?? []),
    ]),
  ],
}))

export const spellingWordById = new Map(spellingWords.map((word) => [word.id, word]))
