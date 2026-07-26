import { useMemo } from 'react'
import { useAppState } from '../app/providers/AppStateProvider'
import { Card, EmptyState, PageHeader } from '../components'
import '../styles/secondary-pages.css'

interface DaySummary {
  key: string
  label: string
  total: number
  correct: number
}

interface TimedWritingPoint {
  id: string
  label: string
  words: number
}

function TimedWritingTrend({
  points,
}: {
  points: readonly TimedWritingPoint[]
}): React.JSX.Element {
  if (points.length === 0) {
    return (
      <p className="chart-empty">
        制限時間付きの英作文を保存すると、ここに時間内語数が残ります。
      </p>
    )
  }
  const maximum = Math.max(10, ...points.map(({ words }) => words))
  const coordinates = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? 160 : 16 + (index / (points.length - 1)) * 288,
    y: 104 - (point.words / maximum) * 88,
  }))
  const line = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <>
      <svg
        className="timed-word-chart"
        viewBox="0 0 320 120"
        role="img"
        aria-label={`制限時間内に書けた語数の推移。${points
          .map(({ label, words }) => `${label} ${words}語`)
          .join('、')}`}
      >
        <line x1="16" x2="304" y1="104" y2="104" />
        <polyline points={line} />
        {coordinates.map(({ id, x, y, words }) => (
          <g key={id}>
            <circle cx={x} cy={y} r="3.5" />
            <text x={x} y={Math.max(11, y - 8)} textAnchor="middle">
              {words}
            </text>
          </g>
        ))}
      </svg>
      <div className="timed-word-labels" aria-hidden="true">
        {coordinates.map(({ id, label }) => (
          <span key={id}>{label}</span>
        ))}
      </div>
    </>
  )
}

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function recentSevenDays(): Array<{ key: string; label: string }> {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const weekday = new Intl.DateTimeFormat('ja-JP', {
      weekday: 'short',
    }).format(date)
    return {
      key: localDateKey(date),
      label: `${date.getMonth() + 1}/${date.getDate()} ${weekday}`,
    }
  })
}

export function ProgressPage(): React.JSX.Element {
  const { state } = useAppState()
  const mastery = Object.values(state.mastery)
  const stableSkills = mastery.filter((item) => item.stable)
  const spellingMastery = mastery.filter((item) =>
    item.skillId.startsWith('spelling.'),
  )
  const writingMastery = mastery.filter((item) =>
    item.skillId.startsWith('writing.'),
  )
  const week = useMemo<DaySummary[]>(
    () =>
      recentSevenDays().map((day) => {
        const attempts = state.attempts.filter(
          (attempt) => localDateKey(new Date(attempt.at)) === day.key,
        )
        return {
          ...day,
          total: attempts.length,
          correct: attempts.filter((attempt) => attempt.correct).length,
        }
      }),
    [state.attempts],
  )
  const maximumAttempts = Math.max(1, ...week.map((day) => day.total))
  const weeklyAttempts = week.reduce((sum, day) => sum + day.total, 0)
  const weeklyCorrect = week.reduce((sum, day) => sum + day.correct, 0)
  const completedSessions = state.sessions.filter(
    (session) => session.status === 'completed',
  ).length
  const timedWritingPoints = useMemo<TimedWritingPoint[]>(
    () =>
      state.attempts
        .filter(
          (attempt) =>
            attempt.kind === 'writing' &&
            typeof attempt.withinLimitWordCount === 'number',
        )
        .slice(-8)
        .map((attempt) => {
          const date = new Date(attempt.at)
          return {
            id: attempt.id,
            label: `${date.getMonth() + 1}/${date.getDate()}`,
            words: attempt.withinLimitWordCount ?? 0,
          }
        }),
    [state.attempts],
  )

  const masteryGroups = [
    {
      label: 'スペリング',
      stable: spellingMastery.filter((item) => item.stable).length,
      total: spellingMastery.length,
    },
    {
      label: '英作文',
      stable: writingMastery.filter((item) => item.stable).length,
      total: writingMastery.length,
    },
  ]

  return (
    <div className="secondary-page">
      <PageHeader
        eyebrow="進捗｜定着を確認する"
        title="学習の進み方"
        description="一度の正解ではなく、日を空けて思い出せた技能を中心に見ます。"
      />

      {state.attempts.length === 0 ? (
        <EmptyState
          title="まだ進捗はありません"
          message="今日の学習を始めると、1週間の取り組みと定着した技能が表示されます。"
          action={
            <a className="button button--primary button--full" href="#/today">
              今日の学習を始める
            </a>
          }
        />
      ) : (
        <div className="section-stack">
          <section className="stat-grid" aria-label="学習の概要">
            <div className="stat-card">
              <span className="stat-card__value">{weeklyAttempts}</span>
              <span className="stat-card__label">今週の解答</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">
                {weeklyAttempts > 0
                  ? Math.round((weeklyCorrect / weeklyAttempts) * 100)
                  : 0}
                <small>%</small>
              </span>
              <span className="stat-card__label">今週の正答</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{stableSkills.length}</span>
              <span className="stat-card__label">安定した技能</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__value">{completedSessions}</span>
              <span className="stat-card__label">完了セッション</span>
            </div>
          </section>

          <Card label="直近7日｜解答数" title="今週の学習">
            <div className="weekly-bars">
              {week.map((day) => {
                const width = `${(day.total / maximumAttempts) * 100}%`
                return (
                  <div className="weekly-bar" key={day.key}>
                    <span className="weekly-bar__label">{day.label}</span>
                    <span
                      className="weekly-bar__track"
                      role="img"
                      aria-label={`${day.label}は${day.total}問中${day.correct}問正解`}
                    >
                      <span
                        className="weekly-bar__fill"
                        style={{ width }}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="weekly-bar__value">{day.total}問</span>
                  </div>
                )
              })}
            </div>
            <p className="chart-note">
              量を競うためではなく、学習の間隔を確認するための記録です。
            </p>
          </Card>

          <Card label="技能｜日を空けた正解" title="定着の状態">
            <div className="mastery-groups">
              {masteryGroups.map((group) => {
                const percentage =
                  group.total > 0 ? (group.stable / group.total) * 100 : 0
                return (
                  <div className="mastery-group" key={group.label}>
                    <div className="mastery-group__heading">
                      <span>{group.label}</span>
                      <span>
                        {group.stable} / {group.total}
                      </span>
                    </div>
                    <div
                      className="mastery-rule"
                      role="progressbar"
                      aria-label={`${group.label}の安定した技能`}
                      aria-valuemin={0}
                      aria-valuemax={group.total}
                      aria-valuenow={group.stable}
                    >
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="chart-note">
              3日以上に分けて正解した技能を「安定」としています。
            </p>
          </Card>

          <Card
            label="英作文｜制限時間"
            title="時間内に書けた語数の推移"
          >
            <TimedWritingTrend points={timedWritingPoints} />
            <p className="chart-note">
              時間を過ぎても入力は止まりません。ここでは時間内の語数だけを比べます。
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
