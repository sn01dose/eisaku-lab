import { describe, expect, it } from 'vitest'
import { diagnosticItems } from '../../data'
import type {
  DiagnosticAnswer,
  DiagnosticItem,
} from '../../domain/learner/types'
import {
  buildScoredDiagnosticResponses,
  normalizeDiagnosticText,
  scoreDiagnosticAnswer,
} from './scoring'

function itemFor<Section extends DiagnosticItem['section']>(
  section: Section,
): Extract<DiagnosticItem, { section: Section }> {
  const item = diagnosticItems.find((candidate) => candidate.section === section)
  if (!item) throw new Error(`${section} の診断問題がありません。`)
  return item as Extract<DiagnosticItem, { section: Section }>
}

describe('scoreDiagnosticAnswer', () => {
  it('表記差を正規化する', () => {
    expect(normalizeDiagnosticText('  Ｉ study English.  ')).toBe(
      'i study english',
    )
  })

  it('選択問題を採点する', () => {
    const item = itemFor('spellChoice')
    expect(scoreDiagnosticAnswer(item, item.payload.answer)).toEqual({
      correct: true,
      score: 1,
    })
  })

  it.each(['dictation', 'fillLetters'] as const)(
    '%s の全角入力を正解にする',
    (section) => {
      const item = itemFor(section)
      const fullWidth = item.payload.answer.replace(/[A-Za-z]/g, (character) =>
        String.fromCharCode(character.charCodeAt(0) + 0xfee0),
      )
      expect(scoreDiagnosticAnswer(item, fullWidth).correct).toBe(true)
    },
  )

  it('チャンクの順序まで確認する', () => {
    const item = itemFor('chunking')
    expect(scoreDiagnosticAnswer(item, item.payload.answer).correct).toBe(true)
    expect(
      scoreDiagnosticAnswer(item, [...item.payload.answer].reverse()).correct,
    ).toBe(false)
  })

  it('並べ替えでは同じ語を並べ替えただけの誤答を正解にしない', () => {
    const item = itemFor('reorder')
    expect(
      scoreDiagnosticAnswer(item, item.payload.modelAnswers[0]).correct,
    ).toBe(true)
    expect(
      scoreDiagnosticAnswer(item, [...item.payload.tokens].reverse()).correct,
    ).toBe(false)
  })

  it('複数の和文英訳モデルを許容する', () => {
    const item = itemFor('basicTranslate')
    for (const model of item.payload.modelAnswers) {
      expect(scoreDiagnosticAnswer(item, model).correct).toBe(true)
    }
  })

  it('自由記述は語数・構造・指定要素で段階評価する', () => {
    const item = itemFor('shortOpinion')
    const strong = scoreDiagnosticAnswer(item, item.payload.modelAnswers[0])
    const short = scoreDiagnosticAnswer(item, 'I agree.')
    expect(strong.correct).toBe(true)
    expect(strong.score).toBeGreaterThan(short.score)
    expect(short.correct).toBe(false)
  })
})

describe('buildScoredDiagnosticResponses', () => {
  it('保存済み回答だけを教材と結び付ける', () => {
    const item = itemFor('spellChoice')
    const answers: DiagnosticAnswer[] = [
      {
        itemId: item.id,
        input: item.payload.answer,
        correct: false,
        answeredAt: '2026-07-20T00:00:00.000Z',
      },
    ]
    const responses = buildScoredDiagnosticResponses(
      diagnosticItems.slice(0, 2),
      answers,
    )
    expect(responses).toHaveLength(1)
    expect(responses[0]).toMatchObject({ correct: true, score: 1 })
  })
})
