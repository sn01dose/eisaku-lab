import { useMemo, useState } from 'react'
import { useAppState } from '../../app/providers/AppStateProvider'
import { Button } from '../../components'
import type { SpellingWord, WritingTask } from '../../domain/learner/types'
import { buildReviewPrompt } from '../../services/feedback/buildReviewPrompt'

export function WritingFeedbackActions({
  answer,
  copied,
  savedEssayId,
  spellingWords,
  task,
  onCopied,
}: {
  answer: string
  copied: boolean
  savedEssayId: string | null
  spellingWords: readonly SpellingWord[]
  task: WritingTask
  onCopied: () => void
}): React.JSX.Element {
  const { state } = useAppState()
  const [includeVocabulary, setIncludeVocabulary] = useState(true)
  const [generatedAt] = useState(() => new Date())
  const reviewPrompt = useMemo(
    () =>
      buildReviewPrompt({
        task,
        answer,
        stage: task.stage,
        state,
        now: generatedAt,
        includeVocabulary,
        spellingWords,
      }),
    [
      answer,
      generatedAt,
      includeVocabulary,
      spellingWords,
      state,
      task,
    ],
  )

  return (
    <div className="secondary-actions feedback-prompt-actions">
      <label className="feedback-vocabulary-toggle">
        <input
          type="checkbox"
          checked={includeVocabulary}
          onChange={(event) => setIncludeVocabulary(event.target.checked)}
        />
        <span>定着語彙リストを含める</span>
      </label>
      <Button
        variant="ghost"
        onClick={() => {
          void navigator.clipboard
            .writeText(reviewPrompt.prompt)
            .then(onCopied)
        }}
      >
        {copied
          ? '添削用プロンプトをコピーしました'
          : '添削に出す（プロンプトをコピー）'}
      </Button>
      <p className="feedback-vocabulary-count">
        {includeVocabulary
          ? `使用可能な語彙 ${reviewPrompt.vocabularyCount}語を含めました`
          : '使用可能な語彙リストは含めません'}
      </p>
      {copied && savedEssayId && (
        <Button
          variant="secondary"
          onClick={() => {
            window.location.hash = `#/writing/feedback/${encodeURIComponent(savedEssayId)}`
          }}
        >
          添削結果を貼り付ける
        </Button>
      )}
    </div>
  )
}
