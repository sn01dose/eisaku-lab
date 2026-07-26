import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  FeedbackDetails,
  ProgressDots,
} from '../../components'
import { analyzeSpellAnswer } from '../../domain/attempts/spellDiff'
import type {
  Attempt,
  MistakeNote,
  SpellingErrorTag,
  SpellingWord,
} from '../../domain/learner/types'
import { updateMasteryFromAttempt } from '../../domain/mastery/updateMastery'
import {
  applyReviewOutcome,
  createReviewCard,
} from '../../domain/review/scheduler'
import { useAppState } from '../../app/providers/AppStateProvider'
import { useSpeech } from '../../services/speech'
import { formatShortDate, uid } from '../../utils/format'
import {
  buildSpellingChoiceOptions,
  supportsSpellingChoice,
} from './spellingChoice'
import {
  SpellingExercise,
  type SpellingPracticeMode,
} from './SpellingExercise'
const ERROR_COPY: Record<SpellingErrorTag, string> = {
  vowelChoice: '母音の選び方',
  consonantChoice: '子音の選び方',
  doubleConsonant: '子音を重ねる位置',
  silentLetter: '発音しない文字',
  omission: '抜けた文字',
  insertion: '余分な文字',
  transposition: '隣り合う文字の順序',
  prefix: '接頭辞',
  suffix: '接尾辞',
  inflection: '語形変化',
  irregular: '例外的な綴り',
  soundToLetter: '音と文字の対応',
  notRecalled: '思い出す手がかり',
}

function strategyLabel(item: SpellingWord): string {
  const labels = {
    sound: '音から確認',
    pattern: '文字パターン',
    morpheme: '語の構成',
    irregular: '例外として定着',
  }
  return labels[item.strategy]
}
function feedbackFor(
  item: SpellingWord,
  primaryTag: SpellingErrorTag | null,
  correct: boolean,
): string {
  if (correct) return '正しい綴りを思い出せました。'
  if (primaryTag === 'suffix' && item.word.endsWith('ment')) {
    return '惜しいです。音は合っています。語尾の -ment を確認しましょう。'
  }
  if (primaryTag === 'notRecalled') {
    return 'まとまりを確認できました。次は最初のチャンクから思い出しましょう。'
  }
  return `惜しいです。${primaryTag ? ERROR_COPY[primaryTag] : '文字の並び'}を一つ確認しましょう。`
}
function upsertNote(
  notes: MistakeNote[],
  item: SpellingWord,
  attempt: Attempt,
): MistakeNote[] {
  const existingIndex = notes.findIndex(
    (note) => note.kind === 'spelling' && note.refId === item.id && !note.conquered,
  )
  const now = attempt.at
  if (existingIndex >= 0) {
    return notes.map((note, index) =>
      index === existingIndex
        ? {
            ...note,
            updatedAt: now,
            input: attempt.input,
            occurrenceCount: note.occurrenceCount + 1,
            errorTags: attempt.errorTags,
            primaryErrorTag:
              (attempt.errorTags[0] as SpellingErrorTag | undefined) ??
              note.primaryErrorTag,
          }
        : note,
    )
  }
  return [
    {
      id: uid('note'),
      at: now,
      updatedAt: now,
      kind: 'spelling',
      refId: item.id,
      input: attempt.input,
      correction: item.word,
      primaryErrorTag:
        (attempt.errorTags[0] as SpellingErrorTag | undefined) ?? 'soundToLetter',
      errorTags: attempt.errorTags,
      skillIds: item.skillIds,
      occurrenceCount: 1,
      conquered: false,
      reviewCardId: `card:${item.id}`,
    },
    ...notes,
  ]
}
export interface SpellingTrainerProps {
  items: readonly SpellingWord[]
  initialIndex?: number
  onProgress?: (itemId: string, correct: boolean) => void
  onNext?: () => void
}

export function SpellingTrainer({
  items,
  initialIndex = 0,
  onProgress,
  onNext,
}: SpellingTrainerProps): React.JSX.Element {
  const { state, updateState } = useAppState()
  const speech = useSpeech()
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, items.length - 1)))
  const [mode, setMode] = useState<SpellingPracticeMode>('sound')
  const [answer, setAnswer] = useState('')
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeSpellAnswer> | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [retried, setRetried] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [scheduledDueAt, setScheduledDueAt] = useState<string | null>(null)
  const [recallReadyItems, setRecallReadyItems] = useState<Set<string>>(
    () => new Set(),
  )

  const choiceItems = useMemo(
    () => items.filter(supportsSpellingChoice),
    [items],
  )
  const activeItems = mode === 'choice' ? choiceItems : items
  const activeIndex = Math.min(index, Math.max(0, activeItems.length - 1))
  const item = activeItems[activeIndex]
  const choiceOptions = useMemo(
    () => (item ? buildSpellingChoiceOptions(item) : []),
    [item],
  )
  const speechAllowed = Boolean(state.profile?.useSpeech && speech.supported)
  const reviewCard = item ? state.cards[`card:${item.id}`] : undefined
  const isNewItem = Boolean(
    item &&
      (!reviewCard ||
        (reviewCard.repetitions === 0 && reviewCard.lastReviewedAt === null)),
  )
  const presenting = Boolean(
    item &&
      !analysis &&
      mode !== 'choice' &&
      mode !== 'copy' &&
      isNewItem &&
      !recallReadyItems.has(item.id),
  )
  const dueDate =
    scheduledDueAt ?? (analysis && reviewCard ? reviewCard.dueAt : null)
  const hintText = useMemo(() => {
    if (!item || hintLevel === 0) return null
    if (hintLevel === 1) return 'まとまりの区切りを表示しました。'
    if (hintLevel === 2) return '最初のまとまりを表示しました。'
    return 'すべてのまとまりを表示しました。'
  }, [hintLevel, item])

  if (!item) {
    return <p>この条件のスペリング教材はまだありません。</p>
  }

  const submit = () => {
    if (!answer.trim() || analysis) return
    const checked = analyzeSpellAnswer({
      expected: item.word,
      actual: answer,
      acceptedAnswers: item.acceptedAnswers,
    })
    const now = new Date()
    const responseTimeMs = Math.max(1, Date.now() - startedAt)
    const attempt: Attempt = {
      id: uid('attempt'),
      at: now.toISOString(),
      kind: 'spelling',
      refId: item.id,
      isRecall: mode !== 'copy' && mode !== 'choice',
      input: answer,
      correct: checked.correct,
      hintLevelUsed: hintLevel,
      responseTimeMs,
      errorTags: checked.errorTags,
      skillIds: item.skillIds,
    }
    const card =
      state.cards[`card:${item.id}`] ??
      createReviewCard({
        kind: 'spelling',
        refId: item.id,
        source: 'curriculum',
        now,
      })
    const nextCard = applyReviewOutcome(
      card,
      {
        correct: checked.correct,
        usedHint: hintLevel > 0,
        hintCount: hintLevel,
        retried,
        responseTimeMs,
        targetTimeMs: 20_000,
      },
      now,
    )
    setScheduledDueAt(nextCard.dueAt)
    updateState((previous) => {
      return {
        ...previous,
        attempts: [...previous.attempts, attempt].slice(-1000),
        cards: { ...previous.cards, [nextCard.id]: nextCard },
        mastery: updateMasteryFromAttempt(previous.mastery, attempt, {
          targetTimeMs: 20_000,
        }),
        notes: checked.correct
          ? previous.notes
          : upsertNote(previous.notes, item, attempt),
      }
    })
    setAnalysis(checked)
    onProgress?.(item.id, checked.correct)
  }

  const resetFor = (nextIndex: number, isRetry = false) => {
    setIndex(nextIndex)
    setAnswer('')
    setAnalysis(null)
    setHintLevel(0)
    setRetried(isRetry)
    setStartedAt(Date.now())
    setScheduledDueAt(null)
  }

  const startRecall = () => {
    setRecallReadyItems((previous) => {
      const next = new Set(previous)
      next.add(item.id)
      return next
    })
    setAnswer('')
    setAnalysis(null)
    setHintLevel(0)
    setRetried(false)
    setStartedAt(Date.now())
    setScheduledDueAt(null)
  }

  const advance = () => {
    resetFor((activeIndex + 1) % activeItems.length)
    onNext?.()
  }

  return (
    <div className="trainer-stack">
      <div className="trainer-toolbar">
        <label>
          <span className="field-label">練習モード</span>
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as SpellingPracticeMode)
              resetFor(0)
            }}
            disabled={Boolean(analysis)}
          >
            <option value="sound">音から想起</option>
            <option value="meaning">意味から想起</option>
            <option value="choice" disabled={choiceItems.length === 0}>
              正しいスペルを選ぶ
            </option>
            <option value="copy">見て確認（写し）</option>
          </select>
        </label>
        {activeItems.length > 1 && (
          <ProgressDots
            current={activeIndex}
            total={Math.min(activeItems.length, 8)}
          />
        )}
      </div>

      <Card
        label={`スペル｜${
          mode === 'copy' ? '写し' : mode === 'choice' ? '見分け' : '想起'
        }`}
      >
        <div className="prompt-block">
          {mode === 'copy' && (
            <p className="spelling-model" lang="en">
              {item.word}
            </p>
          )}
          <p className="prompt-main">{item.meaningJa}</p>
          <p className="muted">
            {item.partOfSpeech}・主ルート：{strategyLabel(item)}
          </p>
        </div>

        {speechAllowed && mode === 'sound' && (
          <div className="inline-actions" aria-label="音声操作">
            <Button variant="secondary" onClick={() => void speech.speak(item.word)}>
              通常で聞く
            </Button>
            <Button variant="ghost" onClick={() => void speech.speakSlowly(item.word)}>
              ゆっくり聞く
            </Button>
          </div>
        )}
        {!speechAllowed && mode === 'sound' && (
          <p className="notice">音声を使えないため、意味から綴りを思い出してください。</p>
        )}

        <SpellingExercise
          item={item}
          mode={mode}
          answer={answer}
          choiceOptions={choiceOptions}
          analysis={analysis}
          hintLevel={hintLevel}
          hintText={hintText}
          presenting={presenting}
          onAnswerChange={(value) =>
            setAnswer(value.replace(/[^A-Za-zÀ-ž'’\-\s]/g, ''))
          }
          onHint={() => setHintLevel((level) => Math.min(3, level + 1))}
          onSubmit={submit}
          onStartRecall={startRecall}
        />

        {presenting ? null : !analysis ? (
          <div className="sticky-actions">
            {mode !== 'choice' && (
              <Button
                variant="secondary"
                onClick={() => setHintLevel((level) => Math.min(3, level + 1))}
              >
                ヒント
              </Button>
            )}
            <Button onClick={submit} disabled={!answer.trim()}>
              答え合わせ
            </Button>
          </div>
        ) : (
          <>
            <FeedbackDetails
              tone={analysis.correct ? 'correct' : 'review'}
              message={feedbackFor(
                item,
                analysis.primaryTag as SpellingErrorTag | null,
                analysis.correct,
              )}
            >
              <p>
                まとまり：{item.chunks.join('｜')}（{item.chunkKind === 'morpheme' ? '語の構成' : '音'}）
              </p>
              <p>{item.exampleEn}</p>
              <p>{item.exampleJa}</p>
              {item.audioHintJa && <p>{item.audioHintJa}</p>}
            </FeedbackDetails>
            {dueDate && (
              <p className="review-date">
                次回の復習：{formatShortDate(dueDate)}
              </p>
            )}
            <div className="sticky-actions">
              <Button
                variant="secondary"
                onClick={() => resetFor(activeIndex, true)}
              >
                もう一度
              </Button>
              <Button onClick={advance}>
                次へ
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
