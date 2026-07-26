import { describe, expect, it } from 'vitest'
import {
  ENGLISH_INPUT_PROPS,
  ENGLISH_TEXT_INPUT_IDS,
  JAPANESE_TEXT_INPUT_EXCEPTIONS,
} from '../../components/forms/inputPolicy'

const NON_TEXT_INPUT_TYPES = new Set(['checkbox', 'date', 'file', 'radio'])

const tsxSources = import.meta.glob('../../**/*.tsx', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

describe('text input policy', () => {
  it('turns off correction features for every English answer control', () => {
    expect(ENGLISH_INPUT_PROPS).toEqual({
      autoCapitalize: 'off',
      autoComplete: 'off',
      autoCorrect: 'off',
      inputMode: 'text',
      lang: 'en',
      spellCheck: false,
    })
  })

  it('inventories every free-text input and explicitly lists Japanese exceptions', () => {
    const foundIds: string[] = []
    const unclassified: string[] = []
    const invalidEnglish: string[] = []

    for (const [file, source] of Object.entries(tsxSources)) {
      if (file.includes('/tests/') || file.endsWith('.test.tsx')) continue
      const tags = source.match(/<(?:input|textarea)\b[\s\S]*?\/>/g) ?? []
      for (const tag of tags) {
        const isInput = tag.startsWith('<input')
        const type = tag.match(/\btype=["']([^"']+)["']/)?.[1]
        if (isInput && type && NON_TEXT_INPUT_TYPES.has(type)) continue

        const id = tag.match(/\bdata-input-policy-id=["']([^"']+)["']/)?.[1]
        if (!id) {
          unclassified.push(file)
          continue
        }
        foundIds.push(id)
        if (
          (ENGLISH_TEXT_INPUT_IDS as readonly string[]).includes(id) &&
          !tag.includes('{...ENGLISH_INPUT_PROPS}')
        ) {
          invalidEnglish.push(id)
        }
      }
    }

    expect(unclassified).toEqual([])
    expect(invalidEnglish).toEqual([])
    expect(foundIds.sort()).toEqual(
      [
        ...ENGLISH_TEXT_INPUT_IDS,
        ...JAPANESE_TEXT_INPUT_EXCEPTIONS,
      ].sort(),
    )
  })
})
