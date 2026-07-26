import { describe, expect, it } from 'vitest'
import { ALL_SKILL_IDS } from '../../domain/learner/types'
import type { WeeklySnapshot } from '../../domain/report/types'
import {
  buildLearningReport,
  decodeReportData,
  decodeReportDataAsync,
  encodeCompressedReportData,
  encodeReportData,
  encodeReportDataForSharing,
  extractReportCode,
} from '../../services/report'
import type {
  BuildLearningReportInput,
  LearningReportPayload,
} from '../../services/report'

function snapshot(
  weekStart: string,
  overrides: Partial<WeeklySnapshot> = {},
): WeeklySnapshot {
  return {
    weekStart,
    studiedDays: 5,
    totalMinutes: 155,
    spellingAttempts: 148,
    spellingRecallAccuracy: 0.71,
    wordStableCount: 61,
    writingAttempts: 26,
    paragraphCount: 2,
    supportLevel: 4,
    withinLimitWordsAvg: 78,
    topErrorTags: [
      { tag: 'thirdPersonS', count: 8 },
      { tag: 'article', count: 6 },
      { tag: 'vowelChoice', count: 5 },
    ],
    stage: 3,
    ...overrides,
  }
}

const previous = snapshot('2026-07-13', {
  studiedDays: 4,
  spellingAttempts: 120,
  spellingRecallAccuracy: 0.64,
  wordStableCount: 47,
  writingAttempts: 20,
  paragraphCount: 1,
  supportLevel: 3,
  withinLimitWordsAvg: 61,
})

const current = snapshot('2026-07-20')

const reportInput: BuildLearningReportInput = {
  selectedSnapshots: [current],
  previousSnapshot: previous,
  plan: {
    generatedAt: '2026-07-20T00:00:00.000Z',
    targetDate: '2027-01-20',
    remainingDays: 184,
    attendanceRate: 0.8,
    effectiveDays: 147,
    phase: 'build',
    finalPhaseStartDate: '2027-01-01',
    stageWindows: [
      {
        stage: 3,
        startDate: '2026-07-20',
        endDate: '2026-08-07',
        days: 19,
      },
    ],
    carryOverSkills: [],
  },
  stableSkillIds: ['writing.wordOrder', 'spelling.suffix'],
  unresolvedNoteCount: 7,
}

describe('buildLearningReport', () => {
  it('creates readable, neutral report text with week-over-week values', () => {
    const result = buildLearningReport({
      ...reportInput,
      personalComment: '語尾を落ち着いて確認したいです。',
    })

    expect(result.text).toContain('英作ラボ 学習レポート')
    expect(result.text).toContain('2026/07/20 - 2026/07/26')
    expect(result.text).toContain('学習した日：5日 / 合計 2時間35分')
    expect(result.text).toContain(
      '思い出して書けた割合 71%（前週 64%）',
    )
    expect(result.text).toContain('自力で書けるようになった語：61語（+14）')
    expect(result.text).toContain(
      '支援レベル：3 → 4（支援が1段階減りました）',
    )
    expect(result.text).toContain('1. 三単現の s（8回）')
    expect(result.text).toContain('■ 本人から')
    expect(result.text).toContain('語尾を落ち着いて確認したいです。')
    expect(result.text).toContain('---DATA---\nELR1.')
  })

  it('does not include essay text unless the learner opts in', () => {
    const answer = 'PRIVATE ESSAY BODY SHOULD NOT LEAK'
    const hidden = buildLearningReport({
      ...reportInput,
      includeEssays: false,
      essays: [{ createdAt: '2026-07-25T12:00:00.000Z', answer }],
    })
    const visible = buildLearningReport({
      ...reportInput,
      includeEssays: true,
      essays: [{ createdAt: '2026-07-25T12:00:00.000Z', answer }],
    })

    expect(hidden.text).not.toContain(answer)
    expect(hidden.text).not.toContain('■ 英作文の本文')
    expect(visible.text).toContain(answer)
    expect(visible.text).toContain('■ 英作文の本文')
    expect(JSON.stringify(decodeReportData(hidden.transferCode))).not.toContain(
      answer,
    )
  })

  it('omits the learner comment section when the comment is blank', () => {
    const result = buildLearningReport({
      ...reportInput,
      personalComment: ' \n ',
    })

    expect(result.text).not.toContain('■ 本人から')
  })

  it('handles a week with no study record without blaming language', () => {
    const result = buildLearningReport({
      ...reportInput,
      selectedSnapshots: [
        snapshot('2026-07-20', {
          studiedDays: 0,
          totalMinutes: 0,
          spellingAttempts: 0,
          spellingRecallAccuracy: 0,
          writingAttempts: 0,
          paragraphCount: 0,
          withinLimitWordsAvg: null,
          topErrorTags: [],
        }),
      ],
      previousSnapshot: null,
    })

    expect(result.text).toContain('学習した日：0日 / 合計 0分')
    expect(result.text).toContain('（前週 —）')
    expect(result.text).not.toMatch(/休んだ|できていない|遅れている/u)
  })

  it('never places essays or identity fields in the machine payload', () => {
    const result = buildLearningReport({
      ...reportInput,
      includeEssays: true,
      essays: [
        {
          createdAt: '2026-07-25T12:00:00.000Z',
          answer: 'My private opinion.',
        },
      ],
      personalComment: '本人だけのコメント',
    })
    const decoded = decodeReportData(result.transferCode)
    const serialized = JSON.stringify(decoded)

    expect(serialized).not.toContain('My private opinion.')
    expect(serialized).not.toContain('本人だけのコメント')
    expect(serialized).not.toContain('nickname')
    expect(serialized).not.toContain('promptJa')
    expect(serialized).not.toContain('modelAnswers')
  })

  it('puts current and previous aggregates, plan, stable skills, and unresolved notes in ELR1', () => {
    const result = buildLearningReport(reportInput)
    const decoded = decodeReportData(result.transferCode)

    expect(decoded.snapshots).toEqual([previous, current])
    expect(decoded.plan).toEqual({
      targetDate: '2027-01-20',
      remainingDays: 184,
      effectiveDays: 147,
      phase: 'build',
      finalPhaseStartDate: '2027-01-01',
      stageWindows: [
        {
          stage: 3,
          startDate: '2026-07-20',
          endDate: '2026-08-07',
          days: 19,
        },
      ],
    })
    expect(decoded.stableSkillIds).toEqual([
      'spelling.suffix',
      'writing.wordOrder',
    ])
    expect(decoded.unresolvedNoteCount).toBe(7)
  })
})

describe('learning report codec', () => {
  function payload(): LearningReportPayload {
    return {
      version: 1,
      snapshots: [
        previous,
        current,
      ],
      plan: {
        targetDate: '2027-01-20',
        remainingDays: 184,
        effectiveDays: 147,
        phase: 'build',
        finalPhaseStartDate: '2027-01-01',
        stageWindows: [1, 2, 3, 4, 5, 6].map((stage, index) => ({
          stage: stage as 1 | 2 | 3 | 4 | 5 | 6,
          startDate: `2026-0${Math.min(index + 7, 9)}-01`,
          endDate: `2026-0${Math.min(index + 7, 9)}-20`,
          days: 20,
        })),
      },
      stableSkillIds: [...ALL_SKILL_IDS],
      unresolvedNoteCount: 12,
    }
  }

  function expectCompletePayload(
    value: LearningReportPayload,
  ): void {
    expect(value.snapshots.map(({ weekStart }) => weekStart)).toEqual([
      previous.weekStart,
      current.weekStart,
    ])
    expect(value.plan).not.toBeNull()
    expect(value.plan?.stageWindows.length).toBeGreaterThan(0)
    expect(value.stableSkillIds.length).toBeGreaterThan(0)
    expect(value.unresolvedNoteCount).toBeGreaterThan(0)
  }

  it('round-trips aggregate data through ELR1', () => {
    const original = payload()
    const code = encodeReportData(original)
    const decoded = decodeReportData(code)

    expect(code).toMatch(/^ELR1\./u)
    expect(decoded).toEqual(original)
    expectCompletePayload(decoded)
  })

  it('extracts and decodes a code from the complete pasted report', async () => {
    const original = payload()
    const code = encodeReportData(original)
    const text = `英作ラボ 学習レポート\n\n---DATA---\n${code}\n`

    expect(extractReportCode(text)).toBe(code)
    await expect(decodeReportDataAsync(text)).resolves.toEqual(original)
  })

  it('rejects an unsupported format version without guessing', async () => {
    expect(() => decodeReportData('ELR2.eyJ2IjoyfQ')).toThrow(
      '書式バージョン',
    )
    await expect(decodeReportDataAsync('ELR9Z.AAAA')).rejects.toThrow(
      '書式バージョン',
    )
  })

  it('round-trips deflate-raw data when compression is available', async () => {
    const original = payload()
    const compressed = await encodeCompressedReportData(original)

    if (compressed.startsWith('ELR1Z.')) {
      await expect(decodeReportDataAsync(compressed)).resolves.toEqual(original)
    } else {
      expect(decodeReportData(compressed)).toEqual(original)
    }
  })

  it('keeps both compressed and uncompressed codes under 2,000 characters', async () => {
    const original = payload()
    expectCompletePayload(original)
    const plain = encodeReportData(original)
    const compressed = await encodeCompressedReportData(original)
    const selected = await encodeReportDataForSharing(original, 1)

    expect(plain.length).toBeLessThan(2_000)
    expect(compressed.length).toBeLessThan(2_000)
    expect(selected.length).toBeLessThanOrEqual(plain.length)
  })
})
