import { useState } from 'react'
import {
  Button,
  Card,
  FeedbackDetails,
  ProgressDots,
} from '../../components'
import { useAppState } from '../../app/providers/AppStateProvider'
import type {
  Attempt,
  MistakeNote,
  SimplificationTask,
} from '../../domain/learner/types'
import {
  applyReviewOutcome,
  createReviewCard,
} from '../../domain/review/scheduler'
import { updateMasteryFromAttempt } from '../../domain/mastery/updateMastery'
import { uid } from '../../utils/format'

const POINT_LABELS = {
  subject: '主語を明確にする',
  oneIdea: '1文に1つの内容',
  concrete: '抽象語を具体化する',
  basicWords: '難しい表現を基本語へ',
  connector: '接続関係を明確にする',
} as const

function countIdeas(value: string): number {
  return value
    .split(/[\n。！？]+/)
    .map((part) => part.trim())
    .filter(Boolean).length
}

export function SimplificationTrainer({
  tasks,
  initialIndex = 0,
  onProgress,
  onNext,
}: {
  tasks: readonly SimplificationTask[]
  initialIndex?: number
  onProgress?: (taskId: string, correct: boolean) => void
  onNext?: () => void
}): React.JSX.Element {
  const { updateState } = useAppState()
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, tasks.length - 1)))
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showPoints, setShowPoints] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const task = tasks[index]

  if (!task) return <p>この条件の言い換え教材はまだありません。</p>

  const submit = () => {
    if (!answer.trim() || feedback) return
    const ideas = countIdeas(answer)
    const hasClearBreaks = ideas >= 2
    const shorter = answer.replace(/\s/g, '').length <= task.originalJa.length * 1.15
    const correct = hasClearBreaks && shorter
    const now = new Date()
    const attempt: Attempt = {
      id: uid('attempt'),
      at: now.toISOString(),
      kind: 'simplification',
      refId: task.id,
      isRecall: true,
      input: answer,
      correct,
      hintLevelUsed: showPoints ? 1 : 0,
      responseTimeMs: Math.max(1, Date.now() - startedAt),
      errorTags: correct ? [] : ['literalTranslation'],
      skillIds: ['writing.japaneseSimplification', 'writing.paraphrase'],
    }
    updateState((previous) => {
      const baseCard =
        previous.cards[`card:${task.id}`] ??
        createReviewCard({
          kind: 'simplification',
          refId: task.id,
          source: 'curriculum',
          now,
        })
      const nextCard = applyReviewOutcome(
        baseCard,
        {
          correct,
          usedHint: showPoints,
          retried: false,
          responseTimeMs: attempt.responseTimeMs,
          targetTimeMs: 90_000,
        },
        now,
      )
      const note: MistakeNote | null = correct
        ? null
        : {
            id: uid('note'),
            at: attempt.at,
            updatedAt: attempt.at,
            kind: 'simplification',
            refId: task.id,
            input: answer,
            correction: task.modelSimplified[0],
            primaryErrorTag: 'literalTranslation',
            errorTags: ['literalTranslation'],
            skillIds: attempt.skillIds,
            occurrenceCount: 1,
            conquered: false,
            reviewCardId: nextCard.id,
          }
      return {
        ...previous,
        attempts: [...previous.attempts, attempt].slice(-1000),
        cards: { ...previous.cards, [nextCard.id]: nextCard },
        mastery: updateMasteryFromAttempt(previous.mastery, attempt, {
          targetTimeMs: 90_000,
        }),
        notes: note ? [note, ...previous.notes] : previous.notes,
      }
    })
    setFeedback(
      correct
        ? '内容を小さな文に分けられました。英訳できる形になっています。'
        : '内容はつかめています。まず1文に1つの内容だけを置きましょう。',
    )
    onProgress?.(task.id, correct)
  }

  const next = (nextIndex: number) => {
    setIndex(nextIndex)
    setAnswer('')
    setFeedback(null)
    setShowPoints(false)
    setStartedAt(Date.now())
  }

  return (
    <div className="trainer-stack">
      <div className="trainer-toolbar">
        <span className="level-badge">日本語を英訳しやすくする</span>
        <ProgressDots current={index} total={Math.min(tasks.length, 8)} />
      </div>
      <Card label="日本語言い換え｜想起">
        <p className="field-label">元の日本語</p>
        <p className="prompt-main japanese-prompt">{task.originalJa}</p>

        {showPoints && (
          <div className="support-panel">
            <p className="field-label">今回の観点</p>
            <ul className="compact-list">
              {task.targetPoints.map((point) => (
                <li key={point}>{POINT_LABELS[point]}</li>
              ))}
            </ul>
          </div>
        )}

        <label className="answer-field">
          <span className="field-label">簡単な日本語に言い換える</span>
          <textarea
            data-input-policy-id="simplification.answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onFocus={(event) =>
              event.currentTarget.scrollIntoView({ block: 'center' })
            }
            rows={6}
            disabled={Boolean(feedback)}
            placeholder={'主語をはっきりさせ、1文に1つずつ書きます。'}
          />
          <span className="word-count">文の数 {countIdeas(answer)}</span>
        </label>

        {!feedback ? (
          <div className="sticky-actions">
            <Button variant="secondary" onClick={() => setShowPoints(true)}>
              観点を見る
            </Button>
            <Button onClick={submit} disabled={!answer.trim()}>
              答え合わせ
            </Button>
          </div>
        ) : (
          <>
            <FeedbackDetails tone="information" message={feedback}>
              <p className="field-label">言い換え例</p>
              <p className="pre-line">{task.modelSimplified[0]}</p>
              {task.modelEn?.[0] && (
                <>
                  <p className="field-label">英語にすると</p>
                  <p className="en-reading">{task.modelEn[0]}</p>
                </>
              )}
              <p>{task.explanation}</p>
            </FeedbackDetails>
            <div className="sticky-actions">
              <Button variant="secondary" onClick={() => next(index)}>
                もう一度
              </Button>
              <Button
                onClick={() =>
                  onNext ? onNext() : next((index + 1) % tasks.length)
                }
              >
                次へ
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
