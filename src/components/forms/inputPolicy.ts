import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

export const ENGLISH_INPUT_PROPS = {
  autoCapitalize: 'off',
  autoComplete: 'off',
  autoCorrect: 'off',
  inputMode: 'text',
  lang: 'en',
  spellCheck: false,
} as const satisfies Pick<
  InputHTMLAttributes<HTMLInputElement> &
    TextareaHTMLAttributes<HTMLTextAreaElement>,
  | 'autoCapitalize'
  | 'autoComplete'
  | 'autoCorrect'
  | 'inputMode'
  | 'lang'
  | 'spellCheck'
>

export const ENGLISH_TEXT_INPUT_IDS = [
  'diagnostic.dictation',
  'diagnostic.fillLetters',
  'diagnostic.composition',
  'spelling.answer',
  'writing.answer',
  'writingFeedback.parsedSource',
  'writingFeedback.parsedCorrection',
] as const

export const JAPANESE_TEXT_INPUT_EXCEPTIONS = [
  'onboarding.nickname',
  'simplification.answer',
  'today.reflection',
  'writingFeedback.pastedFeedback',
  'writingFeedback.parsedNote',
  'writingFeedback.parsedMeaning',
] as const
