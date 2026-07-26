import { useMemo, useRef, useState } from 'react'
import { Button, Card, FeedbackDetails, ProgressDots } from '../../components'
import { ENGLISH_INPUT_PROPS } from '../../components/forms/inputPolicy'
import { useAppState } from '../../app/providers/AppStateProvider'
import { boostEaseAfterWriting, createReviewCard } from '../../domain/review/scheduler'
import { adjustWritingSupport } from '../../domain/writing/supportLevel'
import type {
  Attempt, MiniLesson, MistakeNote, SavedEssay, SpellingWord,
  WritingErrorTag, WritingTask,
} from '../../domain/learner/types'
import { evaluateWritingLocally } from '../../services/feedback'
import { uid, wordCount } from '../../utils/format'
import {
  knownMisspellings, mainErrorTag, SELF_CHECKS, supportDescription,
  writingIsCorrect,
} from './writingSupport'
import { WordBank } from './WordBank'
import { type TimedWritingController } from './timed'
import { TimedTaskClock } from './timed/TimedTaskClock'
import { WritingFeedbackActions } from './WritingFeedbackActions'
import { WritingSelfCheck } from './WritingSelfCheck'

export interface WritingTrainerProps {
  tasks: readonly WritingTask[]
  spellingWords: readonly SpellingWord[]
  miniLessons?: readonly MiniLesson[]
  initialIndex?: number
  onProgress?: (taskId: string, correct: boolean) => void
  onNext?: () => void
}

export function WritingTrainer({
  tasks,
  spellingWords,
  miniLessons = [],
  initialIndex = 0,
  onProgress,
  onNext,
}: WritingTrainerProps): React.JSX.Element {
  const { state, updateState } = useAppState()
  const timedController = useRef<TimedWritingController | null>(null)
  const [index, setIndex] = useState(Math.min(initialIndex, Math.max(0, tasks.length - 1)))
  const [answer, setAnswer] = useState('')
  const [timedPaused, setTimedPaused] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [feedback, setFeedback] = useState<ReturnType<
    typeof evaluateWritingLocally
  > | null>(null)
  const [checked, setChecked] = useState<boolean[]>(
    SELF_CHECKS.map(() => false),
  )
  const [copied, setCopied] = useState(false)
  const [savedEssayId, setSavedEssayId] = useState<string | null>(null)
  const [fallbackType, setFallbackType] = useState<WritingTask['type'] | null>(
    null,
  )
  const [lessonTag, setLessonTag] = useState<WritingErrorTag | null>(null)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const task = tasks[index]
  const supportLevel = state.profile?.supportLevel ?? 1
  const effectiveLevel = Math.max(1, supportLevel - hintLevel)

  const recentWriting = useMemo(
    () =>
      state.attempts
        .filter((attempt) => attempt.kind === 'writing')
        .slice(-3)
        .map((attempt) => ({
          correct: attempt.correct,
          hintLevelUsed: attempt.hintLevelUsed,
          errorTags: attempt.errorTags.filter(
            (tag): tag is WritingErrorTag =>
              ![
                'vowelChoice',
                'consonantChoice',
                'doubleConsonant',
                'silentLetter',
                'omission',
                'insertion',
                'transposition',
                'prefix',
                'suffix',
                'inflection',
                'irregular',
                'soundToLetter',
                'notRecalled',
              ].includes(tag),
          ),
        })),
    [state.attempts],
  )

  if (!task) return <p>この条件の英作文課題はまだありません。</p>

  const submit = () => {
    if (!answer.trim() || feedback) return
    const result = evaluateWritingLocally(task, answer, spellingWords)
    const correct = writingIsCorrect(task, answer)
    const now = new Date()
    const timedResult =
      task.type === 'timed' ? timedController.current?.result() : undefined
    const tag = mainErrorTag(result)
    const attempt: Attempt = {
      id: uid('attempt'),
      at: now.toISOString(),
      kind: 'writing',
      refId: task.id,
      isRecall: true,
      input: answer,
      correct,
      hintLevelUsed: hintLevel,
      responseTimeMs: Math.max(
        1,
        timedResult?.elapsedMs ?? Date.now() - startedAt,
      ),
      ...(timedResult
        ? {
            withinLimitWordCount: timedResult.withinTimeWordCount,
            totalWordCount: timedResult.totalWordCount,
          }
        : {}),
      errorTags: tag ? [tag] : [],
      skillIds: task.requiredSkills,
    }
    const adjustment = adjustWritingSupport({
      currentLevel: supportLevel,
      recentOutcomes: [
        ...recentWriting,
        {
          correct,
          hintLevelUsed: hintLevel,
          errorTags: tag ? [tag] : [],
        },
      ],
      currentTaskType: task.type,
    })
    const misspelled = knownMisspellings(answer, spellingWords)
    const answerTokens = new Set(answer.toLowerCase().match(/[a-z]+/g) ?? [])
    const essay: SavedEssay = {
      id: uid('essay'),
      taskId: task.id,
      stage: task.stage,
      answer,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      feedback: result,
    }

    updateState((previous) => {
      const cards = { ...previous.cards }
      const notes = [...previous.notes]
      for (const word of spellingWords) {
        const card = cards[`card:${word.id}`]
        if (card && answerTokens.has(word.word.toLowerCase())) {
          cards[card.id] = boostEaseAfterWriting(card)
        }
      }
      for (const word of misspelled) {
        const card =
          cards[`card:${word.id}`] ??
          createReviewCard({
            kind: 'spelling',
            refId: word.id,
            source: 'writingMistake',
            now,
          })
        cards[card.id] = card
        if (!notes.some((note) => note.refId === word.id && !note.conquered)) {
          const written =
            word.commonMistakes.find((mistake) =>
              answerTokens.has(mistake.toLowerCase()),
            ) ?? ''
          notes.unshift({
            id: uid('note'),
            at: now.toISOString(),
            updatedAt: now.toISOString(),
            kind: 'spelling',
            refId: word.id,
            input: written,
            correction: word.word,
            primaryErrorTag: word.errorTags[0] ?? 'soundToLetter',
            errorTags: word.errorTags,
            skillIds: word.skillIds,
            occurrenceCount: 1,
            conquered: false,
            reviewCardId: card.id,
          })
        }
      }
      if (!correct && tag) {
        const note: MistakeNote = {
          id: uid('note'),
          at: now.toISOString(),
          updatedAt: now.toISOString(),
          kind: 'writing',
          refId: task.id,
          input: answer,
          correction: task.modelAnswers[0],
          primaryErrorTag: tag,
          errorTags: [tag],
          skillIds: task.requiredSkills,
          occurrenceCount: 1,
          conquered: false,
          reviewCardId: null,
        }
        notes.unshift(note)
      }
      return {
        ...previous,
        profile: previous.profile
          ? { ...previous.profile, supportLevel: adjustment.level }
          : previous.profile,
        attempts: [...previous.attempts, attempt].slice(-1000),
        essays: [essay, ...previous.essays],
        cards,
        notes,
      }
    })
    setFeedback(result)
    timedController.current?.clear()
    setSavedEssayId(essay.id)
    setFallbackType(adjustment.fallbackType)
    setLessonTag(adjustment.miniLessonTriggerTag)
    onProgress?.(task.id, correct)
  }

  const resetFor = (nextIndex: number) => {
    setIndex(nextIndex)
    setAnswer('')
    setTimedPaused(false)
    setFeedback(null)
    setHintLevel(0)
    setChecked(SELF_CHECKS.map(() => false))
    setCopied(false)
    setSavedEssayId(null)
    setFallbackType(null)
    setLessonTag(null)
    setStartedAt(Date.now())
  }

  const lesson = lessonTag
    ? miniLessons.find((candidate) => candidate.triggerTags.includes(lessonTag))
    : undefined
  const fallbackIndex = fallbackType
    ? tasks.findIndex((candidate) => candidate.type === fallbackType)
    : -1

  return (
    <div className="trainer-stack">
      <div className="trainer-toolbar">
        <span className="level-badge">支援 Level {effectiveLevel}</span>
        <ProgressDots current={index} total={Math.min(tasks.length, 8)} />
      </div>
      <Card label={`英作文｜Level ${effectiveLevel}`}>
        {!feedback && task.type === 'timed' && (
          <TimedTaskClock
            key={task.id}
            task={task}
            answer={answer}
            controllerRef={timedController}
            onPausedChange={setTimedPaused}
          />
        )}
        <p className="field-label">日本語</p>
        <p className="prompt-main japanese-prompt">{task.promptJa}</p>
        <p className="muted">{supportDescription(effectiveLevel)}</p>

        {effectiveLevel <= 4 && task.simplifiedJapanese && (
          <div className="support-panel">
            <p className="field-label">英訳しやすい日本語</p>
            {task.simplifiedJapanese.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        )}
        {effectiveLevel <= 3 && task.sentenceFrame && (
          <div className="support-panel">
            <p className="field-label">英文の骨格</p>
            <p className="en-reading">{task.sentenceFrame}</p>
          </div>
        )}
        {effectiveLevel <= 2 && task.wordBank && (
          <WordBank
            words={task.wordBank}
            disabled={timedPaused}
            onUse={(word) =>
              setAnswer((current) => `${current}${current ? ' ' : ''}${word}`)
            }
          />
        )}
        {effectiveLevel === 1 && (
          <details className="quiet-details">
            <summary>全文の型を確認</summary>
            <p className="en-reading">{task.modelAnswers[0]}</p>
          </details>
        )}

        <label className="answer-field">
          <span className="field-label">解答欄</span>
          <textarea
            {...ENGLISH_INPUT_PROPS}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onFocus={(event) =>
              event.currentTarget.scrollIntoView({ block: 'center' })
            }
            data-input-policy-id="writing.answer"
            rows={6}
            disabled={Boolean(feedback) || timedPaused}
          />
          <span className="word-count">
            語数 {wordCount(answer)}
            {task.rubric?.minWords &&
              ` / 目安 ${task.rubric.minWords}〜${task.rubric.maxWords ?? '—'}`}
          </span>
        </label>

        {!feedback && (
          <WritingSelfCheck
            checked={checked}
            onChange={(checkIndex, value) =>
              setChecked((current) =>
                current.map((currentValue, index) =>
                  index === checkIndex ? value : currentValue,
                ),
              )
            }
          />
        )}

        {!feedback ? (
          <div className="sticky-actions">
            <Button
              variant="secondary"
              onClick={() => setHintLevel((level) => Math.min(4, level + 1))}
              disabled={effectiveLevel === 1}
            >
              ヒントを増やす
            </Button>
            <Button onClick={submit} disabled={!answer.trim() || timedPaused}>
              答え合わせ
            </Button>
          </div>
        ) : (
          <>
            <FeedbackDetails
              tone={feedback.findings.length <= 1 ? 'correct' : 'review'}
              message={feedback.findings[0]?.message ?? '内容を確認しました。'}
            >
              {feedback.findings.slice(1).map((finding) => (
                <p key={finding.id}>・{finding.message}</p>
              ))}
              <p className="field-label">模範解答の一例</p>
              <p className="en-reading">{task.modelAnswers[0]}</p>
              <p>{task.explanation}</p>
            </FeedbackDetails>
            {lesson && (
              <aside className="mini-lesson">
                <p className="field-label">短い確認レッスン</p>
                <h3>{lesson.title}</h3>
                <p>{lesson.bodyMd}</p>
              </aside>
            )}
            {fallbackType && (
              <p className="notice">
                次は課題を小さく分け、型を確認してからもう一度組み立てます。
              </p>
            )}
            <WritingFeedbackActions
              answer={answer}
              copied={copied}
              savedEssayId={savedEssayId}
              spellingWords={spellingWords}
              task={task}
              onCopied={() => setCopied(true)}
            />
            <div className="sticky-actions">
              <Button variant="secondary" onClick={() => resetFor(index)}>
                書き直す
              </Button>
              <Button
                onClick={() =>
                  onNext
                    ? onNext()
                    : resetFor(
                        fallbackIndex >= 0
                          ? fallbackIndex
                          : (index + 1) % tasks.length,
                      )
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
