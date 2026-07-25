import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell, Button, Card } from '../components'
import { APP_NAME, APP_TAGLINE, STAGES } from '../app/constants'
import { useAppState } from '../app/providers/AppStateProvider'
import { formatShortDate } from '../utils/format'

export function HomePage(): React.JSX.Element {
  const { state } = useAppState()
  const [now] = useState(() => Date.now())
  const dueCards = Object.values(state.cards).filter(
    (card) => new Date(card.dueAt).getTime() <= now,
  )
  const profile = state.profile
  const stage = STAGES[(profile?.currentStage ?? 1) - 1]
  const minutes = profile?.dailyMinutes ?? 30
  const targetItems = minutes / 3
  const newItems = Math.max(1, Math.round(targetItems * 0.2))
  const latestAttempt = state.attempts.at(-1)

  return (
    <AppShell activePath="/">
      <header className="brand-header">
        <div>
          <p className="brand-name">{APP_NAME}</p>
          <p className="brand-tagline">{APP_TAGLINE}</p>
        </div>
        <Link className="header-link" to="/stages">
          Stage {stage.id}
        </Link>
      </header>

      <section className="home-message" aria-labelledby="home-message-title">
        <p id="home-message-title">
          発想する力は、すでにある。
          <br />
          今日は英語の型をひとつ増やそう。
        </p>
      </section>

      <Card label="今日の学習" raised className="today-card">
        <div className="today-card__heading">
          <div>
            <h1>今日の{minutes}分</h1>
            <p>
              復習 {dueCards.length}件 / 新出 {newItems}件を目安に組みます
            </p>
          </div>
          <span className="stage-stamp">{stage.name}</span>
        </div>
        <Button fullWidth onClick={() => (window.location.hash = '#/today')}>
          今日の学習を始める
        </Button>
      </Card>

      <div className="metric-grid">
        <Link className="metric-card" to="/spelling">
          <span>復習期限</span>
          <strong>{dueCards.length}語</strong>
          <small>綴りを思い出す</small>
        </Link>
        <Link className="metric-card" to="/notes">
          <span>間違いノート</span>
          <strong>{state.notes.filter((note) => !note.conquered).length}件</strong>
          <small>原因から見直す</small>
        </Link>
      </div>

      <Card label="すぐに練習">
        <div className="quick-links">
          <Link to="/spelling">
            <span>スペリング</span>
            <small>音・まとまり・語の構成から</small>
          </Link>
          <Link to="/writing">
            <span>英作文</span>
            <small>支援を少しずつ減らす</small>
          </Link>
          <Link to="/simplify">
            <span>日本語言い換え</span>
            <small>知っている英語で書ける形へ</small>
          </Link>
        </div>
      </Card>

      <p className="last-record">
        直近の記録：
        {latestAttempt ? formatShortDate(latestAttempt.at) : '今日から記録できます'}
      </p>
    </AppShell>
  )
}
