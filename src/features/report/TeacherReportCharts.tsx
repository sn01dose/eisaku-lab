import {
  SPELLING_ERROR_TAG_OPTIONS,
  WRITING_ERROR_TAG_OPTIONS,
} from '../writingFeedback/errorTagOptions'
import type { TeacherReportWeek } from '../../services/report/teacherReportRepository'

const TAG_LABELS = new Map<string, string>([
  ...SPELLING_ERROR_TAG_OPTIONS.map(
    ({ value, label }) => [value, label] as const,
  ),
  ...WRITING_ERROR_TAG_OPTIONS.map(
    ({ value, label }) => [value, label] as const,
  ),
])

interface TrendProps {
  weeks: readonly TeacherReportWeek[]
  value: (week: TeacherReportWeek) => number
  format: (value: number) => string
  maximum?: number
  label: string
}

function shortWeek(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function LineTrend({
  weeks,
  value,
  format,
  maximum,
  label,
}: TrendProps): React.JSX.Element {
  const visible = weeks.slice(-12)
  if (visible.length === 0) {
    return <p className="teacher-report-empty">取り込んだ週はまだありません。</p>
  }
  const maxValue = maximum ?? Math.max(1, ...visible.map(value))
  const points = visible.map((week, index) => {
    const pointValue = value(week)
    return {
      week,
      value: pointValue,
      x:
        visible.length === 1
          ? 160
          : 16 + (index / (visible.length - 1)) * 288,
      y: 104 - (Math.min(maxValue, Math.max(0, pointValue)) / maxValue) * 88,
    }
  })

  return (
    <>
      <svg
        className="teacher-report-line-chart"
        viewBox="0 0 320 120"
        role="img"
        aria-label={`${label}。${points
          .map(({ week, value: pointValue }) =>
            `${shortWeek(week.weekStart)} ${format(pointValue)}`,
          )
          .join('、')}`}
      >
        <line x1="16" x2="304" y1="104" y2="104" />
        <polyline
          points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
        />
        {points.map(({ week, value: pointValue, x, y }) => (
          <g key={week.weekStart}>
            <circle cx={x} cy={y} r="3.5" />
            <title>
              {shortWeek(week.weekStart)} {format(pointValue)}
            </title>
          </g>
        ))}
      </svg>
      <p className="teacher-report-chart-range">
        {shortWeek(visible[0].weekStart)}〜
        {shortWeek(visible.at(-1)?.weekStart ?? visible[0].weekStart)}
      </p>
    </>
  )
}

export function StableWordTrend({
  weeks,
}: {
  weeks: readonly TeacherReportWeek[]
}): React.JSX.Element {
  return (
    <LineTrend
      weeks={weeks}
      value={({ snapshot }) => snapshot.wordStableCount}
      format={(value) => `${Math.round(value)}語`}
      label="自力で書けるようになった語数の推移"
    />
  )
}

export function RecallAccuracyTrend({
  weeks,
}: {
  weeks: readonly TeacherReportWeek[]
}): React.JSX.Element {
  return (
    <LineTrend
      weeks={weeks}
      value={({ snapshot }) => snapshot.spellingRecallAccuracy}
      format={(value) => `${Math.round(value * 100)}%`}
      maximum={1}
      label="スペリング想起正解率の推移"
    />
  )
}

export function ErrorTagTrend({
  weeks,
}: {
  weeks: readonly TeacherReportWeek[]
}): React.JSX.Element {
  const visible = weeks.slice(-8)
  const maximum = Math.max(
    1,
    ...visible.flatMap(({ snapshot }) =>
      snapshot.topErrorTags.map(({ count }) => count),
    ),
  )
  if (visible.length === 0) {
    return <p className="teacher-report-empty">取り込んだ週はまだありません。</p>
  }
  return (
    <div className="teacher-report-error-trend">
      {visible.map(({ weekStart, snapshot }) => (
        <section key={weekStart}>
          <h3>{shortWeek(weekStart)}の上位</h3>
          {snapshot.topErrorTags.length === 0 ? (
            <p>記録はありません。</p>
          ) : (
            snapshot.topErrorTags.slice(0, 5).map(({ tag, count }) => (
              <div className="teacher-report-error-bar" key={tag}>
                <span>{TAG_LABELS.get(tag) ?? tag}</span>
                <span className="teacher-report-error-bar__track">
                  <span style={{ width: `${(count / maximum) * 100}%` }} />
                </span>
                <strong>{count}</strong>
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  )
}

export function StageSupportTimeline({
  weeks,
}: {
  weeks: readonly TeacherReportWeek[]
}): React.JSX.Element {
  if (weeks.length === 0) {
    return <p className="teacher-report-empty">取り込んだ週はまだありません。</p>
  }
  return (
    <ol className="teacher-report-timeline">
      {weeks.map(({ weekStart, snapshot }) => (
        <li key={weekStart}>
          <time dateTime={weekStart}>{shortWeek(weekStart)}の週</time>
          <span>Stage {snapshot.stage}</span>
          <span>支援 Level {snapshot.supportLevel}</span>
        </li>
      ))}
    </ol>
  )
}
