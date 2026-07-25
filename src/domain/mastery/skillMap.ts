import type {
  SkillId,
  SpellingErrorTag,
  WritingErrorTag,
} from '../learner/types'

export const ERROR_TAG_SKILL_MAP: Record<
  SpellingErrorTag | WritingErrorTag,
  readonly SkillId[]
> = {
  vowelChoice: [
    'spelling.shortVowel',
    'spelling.longVowel',
    'spelling.vowelTeam',
  ],
  consonantChoice: ['spelling.wordFamily'],
  doubleConsonant: ['spelling.doubleConsonant'],
  silentLetter: ['spelling.silentLetter'],
  omission: ['spelling.wordFamily'],
  insertion: ['spelling.wordFamily'],
  transposition: ['spelling.wordFamily'],
  prefix: ['spelling.prefix'],
  suffix: ['spelling.suffix'],
  inflection: ['spelling.inflection'],
  irregular: ['spelling.irregular'],
  soundToLetter: ['spelling.shortVowel', 'spelling.vowelTeam'],
  notRecalled: ['spelling.wordFamily'],
  missingSubject: ['writing.subjectVerb'],
  missingVerb: ['writing.subjectVerb'],
  wordOrder: ['writing.wordOrder'],
  tense: ['writing.tense'],
  thirdPersonS: ['writing.agreement'],
  number: ['writing.plural', 'writing.agreement'],
  article: ['writing.article'],
  pronoun: ['writing.subjectVerb'],
  preposition: ['writing.wordOrder'],
  conjunction: ['writing.connector'],
  fragment: ['writing.subjectVerb', 'writing.paragraphStructure'],
  runOn: ['writing.paragraphStructure'],
  literalTranslation: ['writing.paraphrase', 'writing.japaneseSimplification'],
  wordChoice: ['writing.paraphrase'],
  spelling: ['spelling.wordFamily'],
  punctuation: ['writing.paragraphStructure'],
  capitalization: ['writing.paragraphStructure'],
}

export function skillsForErrorTag(
  tag: SpellingErrorTag | WritingErrorTag,
): readonly SkillId[] {
  return ERROR_TAG_SKILL_MAP[tag]
}

export function skillsForErrorTags(
  tags: readonly (SpellingErrorTag | WritingErrorTag)[],
): SkillId[] {
  return Array.from(new Set(tags.flatMap((tag) => ERROR_TAG_SKILL_MAP[tag])))
}
