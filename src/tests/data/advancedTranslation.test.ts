import { describe, expect, it } from 'vitest'
import { shortWritingTasks, writingTasks } from '../../data/writing'
import { advancedTranslationStage5 } from '../../data/writing/advancedTranslationStage5'
import { advancedTranslationStage6 } from '../../data/writing/advancedTranslationStage6'

const advancedTranslations = [...advancedTranslationStage5, ...advancedTranslationStage6]
const allAdvancedShortTasks = shortWritingTasks.filter(
  (task) => task.stage === 5 || task.stage === 6,
)
const legacyPrompts = new Set(
  writingTasks
    .filter((task) => Number(task.id.slice(3)) <= 360)
    .map((task) => task.promptJa),
)

const numericIds = (items: typeof advancedTranslations) =>
  items.map((task) => Number(task.id.slice(3)))

const isAscii = (text: string) =>
  [...text].every((character) => character.charCodeAt(0) <= 127)

describe('Stage 5・6 和文英訳 pack', () => {
  it('各Stageに30問を連番で追加する', () => {
    expect(advancedTranslationStage5).toHaveLength(30)
    expect(advancedTranslationStage6).toHaveLength(30)
    expect(numericIds(advancedTranslationStage5)).toEqual(
      Array.from({ length: 30 }, (_, index) => 361 + index),
    )
    expect(numericIds(advancedTranslationStage6)).toEqual(
      Array.from({ length: 30 }, (_, index) => 391 + index),
    )
    expect(advancedTranslationStage5.every((task) => task.stage === 5)).toBe(true)
    expect(advancedTranslationStage6.every((task) => task.stage === 6)).toBe(true)
  })

  it('全問を自力で取り組む和文英訳として登録する', () => {
    advancedTranslations.forEach((task) => {
      expect(task.type, task.id).toBe('translatePlain')
      expect(task.requiredSkills, task.id).toContain('writing.translation')
      expect(task.requiredSkills, task.id).toContain('writing.japaneseSimplification')
      expect(task.commonErrors, task.id).toContain('literalTranslation')
    })
  })

  it('Stage 5・6の短文全150問に簡単な日本語への分解を複数用意する', () => {
    expect(allAdvancedShortTasks).toHaveLength(150)
    allAdvancedShortTasks.forEach((task) => {
      expect(task.simplifiedJapanese?.length, task.id).toBeGreaterThanOrEqual(2)
      task.simplifiedJapanese?.forEach((line) => {
        expect(line.trim(), task.id).not.toBe('')
        expect(line, task.id).not.toBe(task.promptJa)
      })
    })
  })

  it('安全な解答を先、自然な解答を次に保持する', () => {
    advancedTranslations.forEach((task) => {
      expect(task.modelAnswers, task.id).toHaveLength(2)
      expect(task.modelAnswers[0], task.id).not.toBe(task.modelAnswers[1])
      task.modelAnswers.forEach((answer) => {
        expect(answer.trim(), task.id).not.toBe('')
        expect(isAscii(answer), `${task.id}: ${answer}`).toBe(true)
      })
    })
    expect(advancedTranslationStage5[0].modelAnswers[0]).toMatch(/^AI can give/)
    expect(advancedTranslationStage5[0].modelAnswers[1]).toMatch(/^Although AI/)
    expect(advancedTranslationStage6[0].modelAnswers[0]).toMatch(/^Without a system/)
    expect(advancedTranslationStage6[0].modelAnswers[1]).toMatch(/^In the absence/)
  })

  it('Stage 5・6では安全な第1解答を自然な第2解答より大幅に長くしない', () => {
    const violations = allAdvancedShortTasks.flatMap((task) => {
      const safeWords = task.modelAnswers[0].trim().split(/\s+/).length
      const naturalWords = task.modelAnswers[1].trim().split(/\s+/).length
      return safeWords > naturalWords + 5
        ? [`${task.id}: ${safeWords} vs ${naturalWords}`]
        : []
    })
    expect(violations).toEqual([])
  })

  it('説明を一文に限定する', () => {
    advancedTranslations.forEach((task) => {
      expect(task.explanation.trim(), task.id).toMatch(/。$/)
      expect(task.explanation.match(/。/g), task.id).toHaveLength(1)
      expect(task.explanation, task.id).not.toContain('\n')
    })
  })

  it('各Stageで6文型を5回ずつ再利用する', () => {
    ;[advancedTranslationStage5, advancedTranslationStage6].forEach((tasks) => {
      const patternCounts = new Map<string, number>()
      tasks.forEach((task) => {
        expect(task.sentencePatternId, task.id).toBeTruthy()
        const patternId = task.sentencePatternId ?? ''
        patternCounts.set(patternId, (patternCounts.get(patternId) ?? 0) + 1)
      })
      expect(patternCounts.size).toBe(6)
      expect([...patternCounts.values()]).toEqual([5, 5, 5, 5, 5, 5])
    })
  })

  it('既存教材とID・問題文・文型IDが重複しない', () => {
    expect(new Set(writingTasks.map((task) => task.id)).size).toBe(writingTasks.length)
    expect(new Set(advancedTranslations.map((task) => task.promptJa)).size).toBe(60)
    advancedTranslations.forEach((task) => {
      expect(legacyPrompts, task.id).not.toContain(task.promptJa)
    })

    const legacyPatternIds = new Set(
      writingTasks
        .filter((task) => Number(task.id.slice(3)) <= 360)
        .flatMap((task) => (task.sentencePatternId ? [task.sentencePatternId] : [])),
    )
    advancedTranslations.forEach((task) => {
      expect(legacyPatternIds, task.id).not.toContain(task.sentencePatternId)
    })
  })
})
