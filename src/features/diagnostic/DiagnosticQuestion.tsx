import type { FocusEvent } from 'react'
import { Button } from '../../components'
import type { DiagnosticItem } from '../../domain/learner/types'
import { useSpeech } from '../../services/speech'
import { DIAGNOSTIC_SECTION_LABELS } from './labels'

interface DiagnosticQuestionProps {
  answer: string | string[]
  item: DiagnosticItem
  speechEnabled: boolean
  onChange: (answer: string | string[]) => void
}

const englishInputProps = {
  autoCapitalize: 'off',
  autoComplete: 'off',
  autoCorrect: 'off',
  enterKeyHint: 'done',
  inputMode: 'text',
  lang: 'en',
  spellCheck: false,
} as const

function scrollFocusedControl(
  event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
  const control = event.currentTarget
  window.setTimeout(() => {
    control.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, 120)
}

function textValue(answer: string | string[]): string {
  return Array.isArray(answer) ? answer.join(' ') : answer
}

function selectedValues(answer: string | string[]): string[] {
  return Array.isArray(answer) ? answer : []
}

function TokenBuilder({
  answer,
  onChange,
  tokens,
}: {
  answer: string | string[]
  onChange: (answer: string[]) => void
  tokens: readonly string[]
}) {
  const selected = selectedValues(answer)
  return (
    <>
      <div
        aria-label={
          selected.length > 0
            ? `選んだ順序: ${selected.join('、')}`
            : 'まだ選んでいません'
        }
        className="diagnostic-token-answer en-reading"
      >
        {selected.length > 0 ? selected.join(' ') : '語句を順に選びます'}
      </div>
      <div className="diagnostic-token-bank">
        {tokens.map((token, index) => {
          const consumed =
            selected.filter((selectedToken) => selectedToken === token).length >
            tokens.slice(0, index + 1).filter((entry) => entry === token).length -
              1
          return (
            <button
              className="diagnostic-token"
              disabled={consumed}
              key={`${token}-${index}`}
              onClick={() => onChange([...selected, token])}
              type="button"
            >
              {token}
            </button>
          )
        })}
      </div>
      <div className="diagnostic-token-tools">
        <Button
          disabled={selected.length === 0}
          onClick={() => onChange(selected.slice(0, -1))}
          variant="ghost"
        >
          1つ戻す
        </Button>
        <Button
          disabled={selected.length === 0}
          onClick={() => onChange([])}
          variant="ghost"
        >
          選び直す
        </Button>
      </div>
    </>
  )
}

export function DiagnosticQuestion({
  answer,
  item,
  speechEnabled,
  onChange,
}: DiagnosticQuestionProps): React.JSX.Element {
  const speech = useSpeech()
  const sectionLabel = DIAGNOSTIC_SECTION_LABELS[item.section]

  if (item.section === 'spellChoice') {
    return (
      <fieldset className="diagnostic-question">
        <legend>{item.payload.promptJa}</legend>
        <p className="diagnostic-question__instruction">{sectionLabel}</p>
        <div className="diagnostic-choice-list">
          {item.payload.options.map((option) => (
            <label className="diagnostic-choice en-spelling" key={option}>
              <input
                checked={textValue(answer) === option}
                name={item.id}
                onChange={() => onChange(option)}
                type="radio"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }

  if (item.section === 'dictation') {
    const canUseAudio =
      speechEnabled &&
      speech.supported &&
      speech.status !== 'unsupported' &&
      speech.status !== 'unavailable'
    return (
      <div className="diagnostic-question">
        <p className="diagnostic-question__instruction">{sectionLabel}</p>
        <h2>
          {canUseAudio
            ? '聞こえた単語を入力してください。'
            : '意味に合う英単語を入力してください。'}
        </h2>
        <p className="diagnostic-meaning">
          意味：{item.payload.meaningJa ?? '英単語を確認します'}
        </p>
        {canUseAudio ? (
          <div className="diagnostic-audio-actions">
            <Button
              disabled={speech.speaking}
              onClick={() => void speech.speak(item.payload.answer)}
              variant="secondary"
            >
              通常で聞く
            </Button>
            <Button
              disabled={speech.speaking}
              onClick={() => void speech.speakSlowly(item.payload.answer)}
              variant="ghost"
            >
              ゆっくり聞く
            </Button>
          </div>
        ) : (
          <p className="diagnostic-fallback">
            音声なしでも診断できます。意味から思い出してください。
          </p>
        )}
        {speech.error && (
          <p aria-live="polite" className="diagnostic-fallback">
            {speech.error}
          </p>
        )}
        <label className="lab-field">
          <span className="lab-field__label">綴り</span>
          <input
            {...englishInputProps}
            autoFocus
            className="lab-input lab-input--spelling"
            onChange={(event) => onChange(event.target.value)}
            onFocus={scrollFocusedControl}
            value={textValue(answer)}
          />
        </label>
      </div>
    )
  }

  if (item.section === 'fillLetters') {
    return (
      <div className="diagnostic-question">
        <p className="diagnostic-question__instruction">{sectionLabel}</p>
        <p className="diagnostic-meaning">{item.payload.meaningJa}</p>
        <p className="diagnostic-letter-prompt en-spelling">
          {item.payload.display}
        </p>
        <label className="lab-field">
          <span className="lab-field__label">単語全体を入力</span>
          <input
            {...englishInputProps}
            autoFocus
            className="lab-input lab-input--spelling"
            onChange={(event) => onChange(event.target.value)}
            onFocus={scrollFocusedControl}
            value={textValue(answer)}
          />
        </label>
      </div>
    )
  }

  if (item.section === 'chunking') {
    return (
      <div className="diagnostic-question">
        <p className="diagnostic-question__instruction">{sectionLabel}</p>
        <h2 className="diagnostic-word en-spelling">{item.payload.word}</h2>
        <p>意味のあるまとまりになるよう、左から順に選んでください。</p>
        <TokenBuilder
          answer={answer}
          onChange={onChange}
          tokens={item.payload.options ?? item.payload.answer}
        />
      </div>
    )
  }

  if (item.section === 'reorder') {
    return (
      <div className="diagnostic-question">
        <p className="diagnostic-question__instruction">{sectionLabel}</p>
        <h2>{item.payload.promptJa}</h2>
        <TokenBuilder
          answer={answer}
          onChange={onChange}
          tokens={item.payload.tokens}
        />
      </div>
    )
  }

  const isOpinion = item.section === 'shortOpinion'
  return (
    <div className="diagnostic-question">
      <p className="diagnostic-question__instruction">{sectionLabel}</p>
      <h2>{item.payload.promptJa}</h2>
      <label className="lab-field">
        <span className="lab-field__label">英文</span>
        <textarea
          autoCapitalize="sentences"
          autoComplete="off"
          autoFocus
          className="lab-textarea en-reading"
          lang="en"
          onChange={(event) => onChange(event.target.value)}
          onFocus={scrollFocusedControl}
          rows={isOpinion ? 8 : 4}
          spellCheck={false}
          value={textValue(answer)}
        />
      </label>
      {isOpinion && (
        <p className="diagnostic-word-count" aria-live="polite">
          語数 {textValue(answer).match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0}
          {item.payload.rubric?.minWords
            ? ` / 目安 ${item.payload.rubric.minWords}〜${item.payload.rubric.maxWords ?? ''}`
            : ''}
        </p>
      )}
    </div>
  )
}
