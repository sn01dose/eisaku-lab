import { describe, expect, it } from 'vitest'
import type { StageId } from '../../domain/learner/types'
import { extendedWritingTasks, shortWritingTasks, writingTasks } from '../../data/writing'
import { shortWritingPack02 } from '../../data/writing/shortPack02'
import { shortWritingPack03 } from '../../data/writing/shortPack03'
import { shortWritingPack04 } from '../../data/writing/shortPack04'
import { extendedWritingPack02 } from '../../data/writing/extendedPack02'
import { extendedWritingPack03 } from '../../data/writing/extendedPack03'

const stages: StageId[] = [1, 2, 3, 4, 5, 6]
const newShortTasks = shortWritingTasks.filter((task) => {
  const id = Number(task.id.slice(3))
  return id >= 126 && id <= 325
})
const newExtendedTasks = extendedWritingTasks.filter((task) => {
  const id = Number(task.id.slice(3))
  return id >= 326 && id <= 360
})

const countStages = <T extends { stage: StageId }>(items: readonly T[]) =>
  Object.fromEntries(stages.map((stage) => [stage, items.filter((item) => item.stage === stage).length]))

const groupByPattern = (items: typeof shortWritingTasks) => {
  const groups = new Map<string | undefined, typeof shortWritingTasks>()
  items.forEach((task) => {
    const group = groups.get(task.sentencePatternId) ?? []
    group.push(task)
    groups.set(task.sentencePatternId, group)
  })
  return groups
}

describe('英作文教材 pack-02 以降', () => {
  it('短文を200問追加し、全300問を指定ステージへ配分する', () => {
    expect([shortWritingPack02.length, shortWritingPack03.length, shortWritingPack04.length]).toEqual([
      65, 67, 68,
    ])
    expect(newShortTasks).toHaveLength(200)
    expect(countStages(newShortTasks)).toEqual({ 1: 30, 2: 35, 3: 32, 4: 35, 5: 33, 6: 35 })
    expect(shortWritingTasks).toHaveLength(300)
    expect(countStages(shortWritingTasks)).toEqual({ 1: 55, 2: 55, 3: 50, 4: 50, 5: 45, 6: 45 })
  })

  it('段落課題を35題追加し、全60題を指定ステージへ配分する', () => {
    expect([extendedWritingPack02.length, extendedWritingPack03.length]).toEqual([16, 19])
    expect(newExtendedTasks).toHaveLength(35)
    expect(countStages(newExtendedTasks)).toEqual({ 1: 1, 2: 2, 3: 5, 4: 8, 5: 9, 6: 10 })
    expect(extendedWritingTasks).toHaveLength(60)
    expect(countStages(extendedWritingTasks)).toEqual({ 1: 3, 2: 5, 3: 10, 4: 14, 5: 14, 6: 14 })
  })

  it('各sentencePatternIdを最低4問で再利用する', () => {
    const groups = groupByPattern(newShortTasks)
    expect(groups.has(undefined)).toBe(false)
    groups.forEach((tasks, patternId) => {
      expect(tasks.length, patternId).toBeGreaterThanOrEqual(4)
    })
  })

  it('新規パターン内で語句バンクから自力産出へ支援を減らす', () => {
    const groups = groupByPattern(newShortTasks)
    groups.forEach((tasks, patternId) => {
      const types = new Set(tasks.map((task) => task.type))
      expect(types.has('translateWithBank'), patternId).toBe(true)
      expect(types.has('translateWithFrame'), patternId).toBe(true)
      expect(types.has('translatePlain'), patternId).toBe(true)
      expect(
        [...types].some((type) => ['combine', 'deliteralize', 'reorder', 'cloze'].includes(type)),
        patternId,
      ).toBe(true)
    })
  })

  it('新規短文は自然な複数解、説明、ASCII英文を持つ', () => {
    newShortTasks.forEach((task) => {
      expect(task.modelAnswers.length, task.id).toBeGreaterThanOrEqual(2)
      expect(task.explanation.trim().length, task.id).toBeGreaterThan(0)
      task.modelAnswers.forEach((answer) => {
        const isAscii = [...answer].every((character) => character.charCodeAt(0) <= 127)
        expect(isAscii, `${task.id}: ${answer}`).toBe(true)
      })
    })
  })

  it('新規段落課題は複数解、語数rubric、ASCII英文を満たす', () => {
    newExtendedTasks.forEach((task) => {
      expect(task.modelAnswers.length, task.id).toBeGreaterThanOrEqual(2)
      task.modelAnswers.forEach((answer) => {
        const wordCount = answer.trim().split(/\s+/).length
        expect(wordCount, task.id).toBeGreaterThanOrEqual(task.rubric?.minWords ?? 0)
        expect(wordCount, task.id).toBeLessThanOrEqual(
          task.rubric?.maxWords ?? Number.POSITIVE_INFINITY,
        )
        const isAscii = [...answer].every((character) => character.charCodeAt(0) <= 127)
        expect(isAscii, `${task.id}: ${answer}`).toBe(true)
      })
    })
  })

  it('指定された内容語彙を模範解答の共有母集団へ含める', () => {
    const corpus = newShortTasks.flatMap((task) => task.modelAnswers).join(' ').toLowerCase()
    const requiredWords = [
      'environment',
      'government',
      'technology',
      'opportunity',
      'communication',
      'experience',
      'difference',
      'necessary',
      'especially',
      'although',
      'however',
      'therefore',
      'increase',
      'decrease',
      'develop',
      'improve',
      'reduce',
      'provide',
      'receive',
      'believe',
      'achieve',
      'succeed',
      'benefit',
      'disadvantage',
      'knowledge',
      'foreign',
      'society',
      'responsible',
      'convenient',
      'immediately',
    ]
    requiredWords.forEach((word) => {
      expect(corpus, word).toContain(word)
    })
  })

  it('全英作文IDが重複せず、拡充後の段落課題を含む', () => {
    expect(new Set(writingTasks.map((task) => task.id)).size).toBe(writingTasks.length)
    const numericIds = writingTasks.map((task) => Number(task.id.slice(3))).sort((a, b) => a - b)
    expect(numericIds).toEqual(Array.from({ length: 360 }, (_, index) => index + 1))
  })
})
