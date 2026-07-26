import type {
  SpellingErrorTag,
  WritingErrorTag,
} from '../../domain/learner/types'

export interface WritingErrorTagOption {
  value: WritingErrorTag
  label: string
  hint: string
}

export const WRITING_ERROR_TAG_OPTIONS: readonly WritingErrorTagOption[] = [
  { value: 'missingSubject', label: '主語', hint: '主語が明確か確認します。' },
  { value: 'missingVerb', label: '動詞', hint: '文の中心となる動詞を確認します。' },
  { value: 'wordOrder', label: '語順', hint: '英語の語順に整えます。' },
  { value: 'tense', label: '時制', hint: '出来事の時をそろえます。' },
  {
    value: 'thirdPersonS',
    label: '三人称単数の s',
    hint: '主語と動詞の形を対応させます。',
  },
  { value: 'number', label: '単数・複数', hint: '名詞の数を確認します。' },
  { value: 'article', label: '冠詞', hint: 'a / an / the の要否を確認します。' },
  { value: 'pronoun', label: '代名詞', hint: '代名詞が指す内容を確認します。' },
  { value: 'preposition', label: '前置詞', hint: '名詞との組み合わせを確認します。' },
  { value: 'conjunction', label: '接続語', hint: '文どうしの関係を明確にします。' },
  { value: 'fragment', label: '文の骨格', hint: '文として完結しているか確認します。' },
  { value: 'runOn', label: '一文の長さ', hint: '長い文を適切に分けます。' },
  {
    value: 'literalTranslation',
    label: '直訳',
    hint: '英訳しやすい日本語へ言い換えます。',
  },
  { value: 'wordChoice', label: '語の選び方', hint: '文脈に合う基本語を選びます。' },
  {
    value: 'spelling',
    label: 'スペル（総合）',
    hint: '具体的なスペル分類が分かる場合は、そちらを選びます。',
  },
  { value: 'punctuation', label: '文末記号', hint: '句読点と文末を確認します。' },
  {
    value: 'capitalization',
    label: '大文字・小文字',
    hint: '文頭や固有名詞を確認します。',
  },
] as const

export function writingErrorTagLabel(tag: WritingErrorTag): string {
  return (
    WRITING_ERROR_TAG_OPTIONS.find(({ value }) => value === tag)?.label ??
    '確認項目'
  )
}

export interface SpellingErrorTagOption {
  value: SpellingErrorTag
  label: string
  hint: string
}

export const SPELLING_ERROR_TAG_OPTIONS: readonly SpellingErrorTagOption[] = [
  {
    value: 'vowelChoice',
    label: '母音の選択',
    hint: '母音の文字や組み合わせを確認します。',
  },
  {
    value: 'consonantChoice',
    label: '子音の選択',
    hint: '音に対応する子音字を確認します。',
  },
  {
    value: 'doubleConsonant',
    label: '子音の重なり',
    hint: '子音を重ねる位置と数を確認します。',
  },
  {
    value: 'silentLetter',
    label: '発音しない文字',
    hint: '音に表れない文字を確認します。',
  },
  {
    value: 'omission',
    label: '文字の抜け',
    hint: '抜けている文字を確認します。',
  },
  {
    value: 'insertion',
    label: '余分な文字',
    hint: '余分に入った文字を確認します。',
  },
  {
    value: 'transposition',
    label: '文字の入れ替わり',
    hint: '前後が入れ替わった文字を確認します。',
  },
  {
    value: 'prefix',
    label: '接頭辞',
    hint: '語の先頭に付くまとまりを確認します。',
  },
  {
    value: 'suffix',
    label: '接尾辞',
    hint: '語尾に付くまとまりを確認します。',
  },
  {
    value: 'inflection',
    label: '語形変化',
    hint: '-s・-ed・-ing などの変化を確認します。',
  },
  {
    value: 'irregular',
    label: '例外的な綴り',
    hint: '規則だけでは決めにくい綴りを確認します。',
  },
  {
    value: 'soundToLetter',
    label: '音から文字への変換',
    hint: '聞こえた音と文字の対応を確認します。',
  },
  {
    value: 'notRecalled',
    label: '思い出せなかった',
    hint: '綴り全体を思い出す練習へつなげます。',
  },
] as const

export function spellingErrorTagLabel(tag: SpellingErrorTag): string {
  return (
    SPELLING_ERROR_TAG_OPTIONS.find(({ value }) => value === tag)?.label ??
    'スペルの確認項目'
  )
}

const SPELLING_ERROR_TAG_SET = new Set<SpellingErrorTag>(
  SPELLING_ERROR_TAG_OPTIONS.map(({ value }) => value),
)
const WRITING_ERROR_TAG_SET = new Set<WritingErrorTag>(
  WRITING_ERROR_TAG_OPTIONS.map(({ value }) => value),
)

export function isSpellingErrorTag(
  tag: SpellingErrorTag | WritingErrorTag | null,
): tag is SpellingErrorTag {
  return tag !== null && SPELLING_ERROR_TAG_SET.has(tag as SpellingErrorTag)
}

export function isWritingErrorTag(
  tag: SpellingErrorTag | WritingErrorTag | null,
): tag is WritingErrorTag {
  return tag !== null && WRITING_ERROR_TAG_SET.has(tag as WritingErrorTag)
}
