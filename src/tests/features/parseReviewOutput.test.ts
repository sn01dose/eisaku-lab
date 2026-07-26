import { describe, expect, it } from 'vitest'
import { parseReviewOutput } from '../../services/feedback/parseReviewOutput'

describe('parseReviewOutput', () => {
  it('parses five fixes from one marked block', () => {
    const parsed = parseReviewOutput(`
### 指摘一覧
---FIX---
recieve｜receive｜vowelChoice｜母音の順を確認
it change｜it changes｜thirdPersonS｜主語に合わせます
in school｜at school｜preposition｜前置詞を確認
an useful tool｜a useful tool｜article｜音から選びます
I went yesterday｜I went there yesterday｜wordChoice｜場所を補います
---END---
`)

    expect(parsed.fixes).toHaveLength(5)
    expect(parsed.fixes.every(({ complete }) => complete)).toBe(true)
    expect(parsed.fixes[0]).toMatchObject({
      source: 'recieve',
      correction: 'receive',
      tag: 'vowelChoice',
      note: '母音の順を確認',
    })
  })

  it('accepts full-width pipes, half-width pipes, tabs, and slashes', () => {
    const parsed = parseReviewOutput(`
---FIX---
recieve｜receive|vowelChoice｜母音の順
it change\tit changes\tthirdPersonS\t主語に合わせる
informations/information/number/数え方を確認
---END---
`)

    expect(parsed.fixes).toEqual([
      expect.objectContaining({
        source: 'recieve',
        correction: 'receive',
        tag: 'vowelChoice',
      }),
      expect.objectContaining({
        source: 'it change',
        correction: 'it changes',
        tag: 'thirdPersonS',
      }),
      expect.objectContaining({
        source: 'informations',
        correction: 'information',
        tag: 'number',
      }),
    ])
  })

  it('finds pipe-delimited candidates when FIX markers are absent', () => {
    const parsed = parseReviewOutput(`
次の点を確認してください。
recieve｜receive｜vowelChoice｜母音の順
it change | it changes | thirdPersonS | 主語に合わせる
ここから先は一般的な説明です。
`)

    expect(parsed.fixes).toHaveLength(2)
    expect(parsed.fixes.map(({ tag }) => tag)).toEqual([
      'vowelChoice',
      'thirdPersonS',
    ])
  })

  it('removes a leading star and records priority', () => {
    const parsed = parseReviewOutput(`
---FIX---
★ recieve｜receive｜vowelChoice｜最初に確認
---END---
`)

    expect(parsed.fixes[0]).toMatchObject({
      source: 'recieve',
      priority: true,
      raw: '★ recieve｜receive｜vowelChoice｜最初に確認',
    })
  })

  it('keeps an unknown tag null without guessing a replacement', () => {
    const parsed = parseReviewOutput(`
---FIX---
it change｜it changes｜verbForm｜動詞を確認
---END---
`)

    expect(parsed.fixes[0]).toMatchObject({
      source: 'it change',
      correction: 'it changes',
      tag: null,
      complete: false,
    })
  })

  it('retains a broken partial row without losing valid rows', () => {
    const parsed = parseReviewOutput(`
---FIX---
recieve｜receive｜vowelChoice｜母音の順
修正前だけ
it change｜it changes
at school｜in school｜preposition｜前置詞を確認
---END---
`)

    expect(parsed.fixes).toHaveLength(4)
    expect(parsed.fixes[0]?.complete).toBe(true)
    expect(parsed.fixes[1]).toMatchObject({
      source: '修正前だけ',
      correction: '',
      tag: null,
      complete: false,
    })
    expect(parsed.fixes[2]).toMatchObject({
      source: 'it change',
      correction: 'it changes',
      tag: null,
      complete: false,
    })
    expect(parsed.fixes[3]?.tag).toBe('preposition')
  })

  it('extracts the rewrite separately and never treats it as a fix', () => {
    const parsed = parseReviewOutput(`
---FIX---
it change｜it changes｜thirdPersonS｜主語に合わせる
---END---

### 書き直し
Technology changes our lives.
This answer | is kept | only as reference.
`)

    expect(parsed.fixes).toHaveLength(1)
    expect(parsed.rewrittenAnswer).toBe(
      'Technology changes our lives.\nThis answer | is kept | only as reference.',
    )
    expect(parsed.fixes.some(({ source }) => source === 'This answer')).toBe(
      false,
    )
  })

  it('supports a rewrite written on the heading line', () => {
    const parsed = parseReviewOutput(
      '書き直し：Technology changes our lives.',
    )

    expect(parsed).toEqual({
      fixes: [],
      rewrittenAnswer: 'Technology changes our lives.',
    })
  })
})
