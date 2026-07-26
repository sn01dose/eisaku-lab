import { describe, expect, it } from 'vitest'
import { diagnosticItems } from '../../data'
import type { DiagnosticItem } from '../../domain/learner/types'
import { scoreDiagnosticAnswer } from '../../features/diagnostic/scoring'
import { shuffle, shuffleWithSeed } from '../../utils/shuffle'

const options = ['answer', 'anser', 'awnser', 'answar'] as const
const allDiagnosticItems: readonly DiagnosticItem[] = diagnosticItems

function spellChoiceItem(): Extract<
  DiagnosticItem,
  { section: 'spellChoice' }
> {
  const item = allDiagnosticItems.find(
    (
      candidate,
    ): candidate is Extract<DiagnosticItem, { section: 'spellChoice' }> =>
      candidate.section === 'spellChoice',
  )
  if (!item) throw new Error('spellChoice の診断問題がありません。')
  return item
}

describe('選択肢のシャッフル', () => {
  it('Fisher–Yates 後も選択肢の集合と入力配列を変えない', () => {
    const original = [...options]
    const shuffled = shuffle(options, () => 0.25)

    expect([...shuffled].sort()).toEqual([...options].sort())
    expect(options).toEqual(original)
    expect(shuffled).not.toBe(options)
  })

  it('同じ問題 ID の順序を再現し、異なる問題 ID では異なる順序にする', () => {
    const first = shuffleWithSeed(options, 'dg-0001')
    const resumed = shuffleWithSeed(options, 'dg-0001')
    const different = shuffleWithSeed(options, 'dg-0002')

    expect(resumed).toEqual(first)
    expect(different).not.toEqual(first)
  })

  it('1000個の決定論的シードで正解位置が各20〜30%に収まる', () => {
    const positionCounts = [0, 0, 0, 0]

    for (let index = 0; index < 1000; index += 1) {
      const shuffled = shuffleWithSeed(options, `distribution-${index}`)
      positionCounts[shuffled.indexOf('answer')] += 1
    }

    positionCounts.forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(200)
      expect(count).toBeLessThanOrEqual(300)
    })
  })
})

describe('spellChoice の選択肢と採点', () => {
  it('すべての診断 spellChoice で正解を先頭に固定しない', () => {
    allDiagnosticItems
      .filter(
        (
          item,
        ): item is Extract<DiagnosticItem, { section: 'spellChoice' }> =>
          item.section === 'spellChoice',
      )
      .forEach((item) => {
        expect(item.payload.options[0], item.id).not.toBe(item.payload.answer)
      })
  })

  it('正解位置ではなく選択した文字列で採点する', () => {
    const source = spellChoiceItem()
    const wrong = source.payload.options.find(
      (option) => option !== source.payload.answer,
    )
    if (!wrong) throw new Error(`${source.id} に誤答選択肢がありません。`)

    const item: Extract<DiagnosticItem, { section: 'spellChoice' }> = {
      ...source,
      payload: {
        ...source.payload,
        options: [
          wrong,
          ...source.payload.options.filter((option) => option !== wrong),
        ],
      },
    }

    expect(item.payload.options[0]).not.toBe(item.payload.answer)
    expect(scoreDiagnosticAnswer(item, item.payload.answer).correct).toBe(true)
    expect(scoreDiagnosticAnswer(item, item.payload.options[0]).correct).toBe(
      false,
    )
  })
})
