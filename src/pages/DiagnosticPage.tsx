import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAppState } from '../app/providers/AppStateProvider'
import { AppShell, Button, Card, PageHeader } from '../components'
import { diagnosticItems } from '../data'
import { recommendDiagnosticStage } from '../domain/diagnostic/recommendation'
import type {
  Attempt,
  DiagnosticAnswer,
  DiagnosticState,
} from '../domain/learner/types'
import {
  buildScoredDiagnosticResponses,
  DiagnosticQuestion,
  DIAGNOSTIC_SECTION_LABELS,
  scoreDiagnosticAnswer,
} from '../features/diagnostic'
import '../styles/diagnostic-pages.css'

function initialDiagnostic(now = new Date()): DiagnosticState {
  const timestamp = now.toISOString()
  return {
    startedAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    currentIndex: 0,
    itemIds: diagnosticItems.map(({ id }) => id),
    answers: [],
    recommendedStage: null,
  }
}

function hasAnswer(answer: string | string[]): boolean {
  return Array.isArray(answer)
    ? answer.length > 0
    : answer.trim().length > 0
}

function DiagnosticStep({
  initialAnswer,
  item,
  position,
  speechEnabled,
  total,
  onComplete,
  onPause,
}: {
  initialAnswer: string | string[]
  item: (typeof diagnosticItems)[number]
  position: number
  speechEnabled: boolean
  total: number
  onComplete: (answer: string | string[], responseTimeMs: number) => void
  onPause: () => void
}) {
  const [answer, setAnswer] = useState<string | string[]>(initialAnswer)
  const startedAt = useRef<number | null>(null)

  useEffect(() => {
    startedAt.current = performance.now()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasAnswer(answer)) return
    const elapsed = startedAt.current
      ? performance.now() - startedAt.current
      : 0
    onComplete(answer, Math.max(0, Math.round(elapsed)))
  }

  return (
    <AppShell hideNavigation mainClassName="diagnostic-page">
      <PageHeader
        action={
          <Button onClick={onPause} variant="ghost">
            中断する
          </Button>
        }
        eyebrow="初回診断"
        title={DIAGNOSTIC_SECTION_LABELS[item.section]}
      />

      <div className="diagnostic-progress">
        <div className="diagnostic-progress__text">
          <span>
            {position + 1} / {total}
          </span>
          <span>回答は自動保存されます</span>
        </div>
        <div
          aria-label={`${total}問中${position}問まで完了`}
          aria-valuemax={total}
          aria-valuemin={0}
          aria-valuenow={position}
          className="diagnostic-progress__track"
          role="progressbar"
        >
          <span style={{ width: `${(position / total) * 100}%` }} />
        </div>
      </div>

      <form className="diagnostic-form" onSubmit={handleSubmit}>
        <Card label={`診断｜${DIAGNOSTIC_SECTION_LABELS[item.section]}`}>
          <DiagnosticQuestion
            answer={answer}
            item={item}
            onChange={setAnswer}
            speechEnabled={speechEnabled}
          />
        </Card>

        <div className="diagnostic-form__action">
          <Button disabled={!hasAnswer(answer)} fullWidth type="submit">
            {position + 1 === total ? '診断結果を見る' : '回答して次へ'}
          </Button>
          <p>分からない場合も、今考えた答えを入力してください。</p>
        </div>
      </form>
    </AppShell>
  )
}

export function DiagnosticPage(): React.JSX.Element {
  const { state, updateState } = useAppState()
  const navigate = useNavigate()

  useEffect(() => {
    if (!state.diagnostic && state.profile) {
      updateState((previous) =>
        previous.diagnostic
          ? previous
          : { ...previous, diagnostic: initialDiagnostic() },
      )
    }
  }, [state.diagnostic, state.profile, updateState])

  const orderedItems = (() => {
    if (!state.diagnostic?.itemIds.length) return [...diagnosticItems]
    const byId = new Map(diagnosticItems.map((item) => [item.id, item]))
    const savedOrder = state.diagnostic.itemIds.flatMap((id) => {
      const item = byId.get(id)
      return item ? [item] : []
    })
    return savedOrder.length > 0 ? savedOrder : [...diagnosticItems]
  })()

  if (!state.profile) return <Navigate replace to="/onboarding" />
  if (state.diagnostic?.completedAt) {
    return <Navigate replace to="/diagnostic/result" />
  }

  const diagnostic = state.diagnostic ?? initialDiagnostic()
  const position = Math.min(diagnostic.currentIndex, orderedItems.length - 1)
  const item = orderedItems[position]
  const savedAnswer = diagnostic.answers.find(
    (answer) => answer.itemId === item.id,
  )?.input

  const handleComplete = (
    input: string | string[],
    responseTimeMs: number,
  ) => {
    const now = new Date()
    const scored = scoreDiagnosticAnswer(item, input)
    const answer: DiagnosticAnswer = {
      itemId: item.id,
      input,
      correct: scored.correct,
      answeredAt: now.toISOString(),
    }
    const answers = [
      ...diagnostic.answers.filter(({ itemId }) => itemId !== item.id),
      answer,
    ]
    const isLast = position >= orderedItems.length - 1
    const recommendation = isLast
      ? recommendDiagnosticStage(
          buildScoredDiagnosticResponses(orderedItems, answers),
        )
      : null
    const nextDiagnostic: DiagnosticState = {
      ...diagnostic,
      answers,
      currentIndex: isLast ? orderedItems.length : position + 1,
      updatedAt: now.toISOString(),
      completedAt: isLast ? now.toISOString() : null,
      recommendedStage: recommendation?.recommendedStage ?? null,
    }
    const isRecall = !['spellChoice', 'chunking', 'reorder'].includes(
      item.section,
    )
    const diagnosticAttempt: Attempt = {
      id: `diagnostic:${item.id}:${now.getTime()}`,
      at: now.toISOString(),
      kind: 'diagnostic',
      refId: item.id,
      isRecall,
      input: Array.isArray(input) ? input.join(' | ') : input,
      correct: scored.correct,
      hintLevelUsed: 0,
      responseTimeMs,
      errorTags: [],
      skillIds: [...item.skillIds],
    }

    updateState((previous) => ({
      ...previous,
      diagnostic: nextDiagnostic,
      profile:
        isLast && previous.profile && recommendation
          ? {
              ...previous.profile,
              currentStage: recommendation.recommendedStage,
              recommendedStage: recommendation.recommendedStage,
            }
          : previous.profile,
      attempts: [
        ...previous.attempts,
        diagnosticAttempt,
      ].slice(-1000),
    }))

    if (isLast) navigate('/diagnostic/result', { replace: true })
  }

  return (
    <DiagnosticStep
      initialAnswer={savedAnswer ?? (item.section === 'chunking' || item.section === 'reorder' ? [] : '')}
      item={item}
      key={item.id}
      onComplete={handleComplete}
      onPause={() => navigate('/')}
      position={position}
      speechEnabled={state.profile.useSpeech}
      total={orderedItems.length}
    />
  )
}

export default DiagnosticPage
