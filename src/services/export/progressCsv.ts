import type { AppState } from '../../domain/learner/types'

function csvCell(value: string | number | boolean): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(rows: Array<Array<string | number | boolean>>): string {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
}

export function exportProgressToCsv(state: AppState): string {
  const rows: Array<Array<string | number | boolean>> = [
    ['技能ID', '習熟度', '安定', '正解日数', '最終更新'],
  ]
  for (const mastery of Object.values(state.mastery)) {
    rows.push([
      mastery.skillId,
      mastery.score,
      mastery.stable ? 'はい' : 'いいえ',
      mastery.correctDays.length,
      mastery.updatedAt,
    ])
  }
  return toCsv(rows)
}

export function exportAttemptsToCsv(state: AppState): string {
  const rows: Array<Array<string | number | boolean>> = [
    [
      '日時',
      '種別',
      '教材ID',
      '想起',
      '解答',
      '正解',
      'ヒントレベル',
      '応答時間ms',
      '制限時間内語数',
      '総語数',
      '誤りタグ',
      '技能ID',
    ],
  ]
  for (const attempt of state.attempts) {
    rows.push([
      attempt.at,
      attempt.kind,
      attempt.refId,
      attempt.isRecall ? 'はい' : 'いいえ',
      attempt.input,
      attempt.correct ? 'はい' : 'いいえ',
      attempt.hintLevelUsed,
      attempt.responseTimeMs,
      attempt.withinLimitWordCount ?? '',
      attempt.totalWordCount ?? '',
      attempt.errorTags.join('|'),
      attempt.skillIds.join('|'),
    ])
  }
  return toCsv(rows)
}
