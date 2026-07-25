import { useMemo } from 'react'
import { STAGES } from '../app/constants'
import { useAppState } from '../app/providers/AppStateProvider'
import { Button, Card, EmptyState, PageHeader } from '../components'
import {
  dataCounts,
  simplificationTasks,
  spellingWords,
  writingTasks,
} from '../data'
import type { StageId } from '../domain/learner/types'
import '../styles/secondary-pages.css'

export function StagesPage(): React.JSX.Element {
  const { state, updateState } = useAppState()
  const profile = state.profile
  const stageByReference = useMemo(
    () =>
      new Map<string, StageId>([
        ...spellingWords.map(
          (item) => [item.id, item.stage] as [string, StageId],
        ),
        ...writingTasks.map(
          (item) => [item.id, item.stage] as [string, StageId],
        ),
        ...simplificationTasks.map(
          (item) => [item.id, item.stage] as [string, StageId],
        ),
      ]),
    [],
  )

  const selectStage = (stage: StageId) => {
    updateState((previous) => ({
      ...previous,
      profile: previous.profile
        ? { ...previous.profile, currentStage: stage }
        : previous.profile,
    }))
  }

  return (
    <div className="secondary-page">
      <PageHeader
        eyebrow="ロードマップ｜6つの段階"
        title="ステージ一覧"
        description="推奨位置を参考にしながら、どのステージからでも学習できます。"
      />

      {!profile ? (
        <EmptyState
          title="開始位置がまだ決まっていません"
          message="初回設定を済ませると、推奨ステージと現在の学習位置が表示されます。"
          action={
            <a
              className="button button--primary button--full"
              href="#/onboarding"
            >
              初回設定へ進む
            </a>
          }
        />
      ) : (
        <div className="stage-list">
          {STAGES.map((stage) => {
            const stageId = stage.id as StageId
            const current = stageId === profile.currentStage
            const recommended = stageId === profile.recommendedStage
            const attempts = state.attempts.filter(
              (attempt) => stageByReference.get(attempt.refId) === stageId,
            )
            const correct = attempts.filter((attempt) => attempt.correct).length
            const contentCount =
              dataCounts.spelling.byStage[stageId] +
              dataCounts.shortWriting.byStage[stageId] +
              dataCounts.extendedWriting.byStage[stageId] +
              dataCounts.simplification.byStage[stageId]

            return (
              <Card
                className={
                  current ? 'stage-card stage-card--current' : 'stage-card'
                }
                label={`Stage ${stage.id}｜${stage.words}`}
                key={stage.id}
              >
                <div className="stage-card__heading">
                  <h2>{stage.name}</h2>
                  <div className="stage-card__badges">
                    {current && (
                      <span className="status-pill status-pill--current">
                        学習中
                      </span>
                    )}
                    {recommended && (
                      <span className="status-pill status-pill--recommended">
                        推奨
                      </span>
                    )}
                  </div>
                </div>
                <p className="stage-card__target">{stage.target}</p>
                <div className="stage-card__facts">
                  <span>教材 {contentCount}件</span>
                  <span>
                    これまで {attempts.length}問
                    {attempts.length > 0 &&
                      `・正答 ${Math.round((correct / attempts.length) * 100)}%`}
                  </span>
                </div>
                <Button
                  variant={current ? 'secondary' : 'primary'}
                  fullWidth
                  disabled={current}
                  onClick={() => selectStage(stageId)}
                >
                  {current ? '現在のステージです' : 'このステージから学ぶ'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
