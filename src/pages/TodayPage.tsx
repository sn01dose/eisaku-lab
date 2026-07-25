import { useMemo, useState } from 'react'
import { AppShell, Button, Card, PageHeader, ProgressDots } from '../components'
import { useAppState } from '../app/providers/AppStateProvider'
import {
  miniLessons,
  simplificationTasks,
  spellingWords,
  writingTasks,
} from '../data'
import { generateDailyPlan } from '../domain/dailyPlan/generateDailyPlan'
import type { SessionItem, SessionLog } from '../domain/learner/types'
import { buildDailyCandidates } from '../features/dailyPlan/buildCandidates'
import { SimplificationTrainer } from '../features/japaneseSimplification/SimplificationTrainer'
import { SpellingTrainer } from '../features/spelling/SpellingTrainer'
import { WritingTrainer } from '../features/writing/WritingTrainer'
import { localDateKey, uid } from '../utils/format'

function itemLabel(item: SessionItem): string {
  const kind = {
    spelling: 'スペリング',
    writing: '英作文',
    simplification: '日本語言い換え',
    miniLesson: '短い確認',
    reflection: '振り返り',
  }[item.kind]
  const source = {
    review: '復習',
    weak: '苦手技能',
    new: '新規',
    foundation: '基礎確認',
    reflection: 'まとめ',
  }[item.source]
  return `${kind}｜${source}`
}

export function TodayPage(): React.JSX.Element {
  const { state, updateState } = useAppState()
  const [reflection, setReflection] = useState('')
  const dateKey = localDateKey()
  const session = state.sessions.find((entry) => entry.plannedFor === dateKey)
  const candidates = useMemo(() => buildDailyCandidates(state), [state])
  const plan = useMemo(
    () =>
      generateDailyPlan({
        dailyMinutes: state.profile?.dailyMinutes ?? 30,
        currentStage: state.profile?.currentStage ?? 1,
        ...candidates,
      }),
    [candidates, state.profile?.currentStage, state.profile?.dailyMinutes],
  )

  const startSession = () => {
    const now = new Date().toISOString()
    const reflectionItem: SessionItem = {
      id: `plan:reflection:${dateKey}`,
      kind: 'reflection',
      refId: dateKey,
      source: 'reflection',
      estimatedMinutes: 2,
      stage: state.profile?.currentStage ?? 1,
      skillIds: [],
    }
    const next: SessionLog = {
      id: uid('session'),
      plannedFor: dateKey,
      startedAt: now,
      updatedAt: now,
      completedAt: null,
      status: 'inProgress',
      items: [...plan.items, reflectionItem],
      currentIndex: 0,
      completedItemIds: [],
    }
    updateState((previous) => ({ ...previous, sessions: [next, ...previous.sessions] }))
  }

  const advance = () => {
    if (!session) return
    updateState((previous) => ({
      ...previous,
      sessions: previous.sessions.map((entry) => {
        if (entry.id !== session.id) return entry
        const current = entry.items[entry.currentIndex]
        const nextIndex = entry.currentIndex + 1
        const completed = nextIndex >= entry.items.length
        return {
          ...entry,
          currentIndex: nextIndex,
          completedItemIds: current
            ? [...new Set([...entry.completedItemIds, current.id])]
            : entry.completedItemIds,
          status: completed ? 'completed' : 'inProgress',
          completedAt: completed ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
  }

  const active = session?.items[session.currentIndex]
  const completed = session?.status === 'completed'

  return (
    <AppShell activePath="/today">
      <PageHeader
        title="今日の学習"
        eyebrow={`${state.profile?.dailyMinutes ?? 30}分プラン`}
        description="復習を中心に、苦手技能と新しい課題を組み合わせます。"
        backHref="#/"
      />

      {!session && (
        <>
          <Card label="自動生成プラン" raised>
            <div className="plan-ratio">
              <span>復習 {plan.counts.review}</span>
              <span>苦手 {plan.counts.weak}</span>
              <span>新規 {plan.counts.new}</span>
            </div>
            <ol className="session-list">
              {plan.items.map((item) => (
                <li key={item.id}>
                  <span>{itemLabel(item)}</span>
                  <small>約{Math.max(1, Math.round(item.estimatedMinutes))}分</small>
                </li>
              ))}
              <li>
                <span>振り返り｜まとめ</span>
                <small>約2分</small>
              </li>
            </ol>
            <Button fullWidth onClick={startSession}>
              この順で始める
            </Button>
          </Card>
          <p className="notice">
            復習が多い日は復習の比率を増やします。下位ステージの確認も最低1問入ります。
          </p>
        </>
      )}

      {session && !completed && active && (
        <>
          <div className="session-progress">
            <span>
              {session.currentIndex + 1} / {session.items.length}
            </span>
            <ProgressDots
              current={session.currentIndex}
              total={session.items.length}
            />
          </div>
          {active.kind === 'spelling' && (
            <SpellingTrainer
              items={spellingWords.filter((item) => item.id === active.refId)}
              onNext={advance}
            />
          )}
          {active.kind === 'writing' && (
            <WritingTrainer
              tasks={writingTasks.filter((item) => item.id === active.refId)}
              spellingWords={spellingWords}
              miniLessons={miniLessons}
              onNext={advance}
            />
          )}
          {active.kind === 'simplification' && (
            <SimplificationTrainer
              tasks={simplificationTasks.filter((item) => item.id === active.refId)}
              onNext={advance}
            />
          )}
          {active.kind === 'reflection' && (
            <Card label="振り返り｜2分">
              <label className="answer-field">
                <span className="field-label">今日ひとつ増えた型・綴り</span>
                <textarea
                  rows={4}
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="短く一つだけ書きます。"
                />
              </label>
              <Button fullWidth onClick={advance}>
                今日の学習を終える
              </Button>
            </Card>
          )}
          <a className="pause-link" href="#/">
            中断してホームへ戻る
          </a>
        </>
      )}

      {completed && (
        <Card label="今日の学習｜完了" raised>
          <h2>今日の分を記録しました。</h2>
          <p>できたことは履歴に残っています。次回は復習期限から組み直します。</p>
          <Button fullWidth onClick={() => (window.location.hash = '#/')}>
            ホームへ戻る
          </Button>
        </Card>
      )}
    </AppShell>
  )
}
