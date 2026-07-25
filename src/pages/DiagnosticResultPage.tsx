import { useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { STAGES } from '../app/constants'
import { useAppState } from '../app/providers/AppStateProvider'
import { AppShell, Button, Card, PageHeader } from '../components'
import { diagnosticItems } from '../data'
import { recommendDiagnosticStage } from '../domain/diagnostic/recommendation'
import {
  buildScoredDiagnosticResponses,
  DIAGNOSTIC_SECTION_LABELS,
} from '../features/diagnostic'
import '../styles/diagnostic-pages.css'
import '../styles/diagnostic-result-page.css'

export function DiagnosticResultPage(): React.JSX.Element {
  const { state, updateState } = useAppState()
  const navigate = useNavigate()
  const orderedItems = (() => {
    const ids = state.diagnostic?.itemIds ?? []
    if (ids.length === 0) return [...diagnosticItems]
    const byId = new Map(diagnosticItems.map((item) => [item.id, item]))
    return ids.flatMap((id) => {
      const item = byId.get(id)
      return item ? [item] : []
    })
  })()
  const result = recommendDiagnosticStage(
    buildScoredDiagnosticResponses(
      orderedItems,
      state.diagnostic?.answers ?? [],
    ),
  )

  useEffect(() => {
    if (
      state.diagnostic?.completedAt &&
      state.profile &&
      (state.profile.currentStage !== result.recommendedStage ||
        state.profile.recommendedStage !== result.recommendedStage)
    ) {
      updateState((previous) =>
        previous.profile
          ? {
              ...previous,
              profile: {
                ...previous.profile,
                currentStage: result.recommendedStage,
                recommendedStage: result.recommendedStage,
              },
            }
          : previous,
      )
    }
  }, [
    result.recommendedStage,
    state.diagnostic?.completedAt,
    state.profile,
    updateState,
  ])

  if (!state.profile) return <Navigate replace to="/onboarding" />
  if (!state.diagnostic?.completedAt) {
    return <Navigate replace to="/diagnostic" />
  }

  const recommended =
    STAGES.find(({ id }) => id === result.recommendedStage) ?? STAGES[0]

  return (
    <AppShell hideNavigation mainClassName="diagnostic-result-page">
      <PageHeader
        eyebrow="診断結果"
        title={`${state.profile.nickname}さんの開始位置`}
        description="正解数だけでなく、どの方法で英語を組み立てられたかを見ています。"
      />

      <Card
        className="diagnostic-result-hero"
        label="おすすめ"
        title={recommended.name}
        raised
      >
        <p>{recommended.target}</p>
        <p className="diagnostic-result-hero__words">
          英作文の目安：{recommended.words}
        </p>
      </Card>

      <section
        aria-labelledby="diagnostic-profile-title"
        className="diagnostic-profile"
      >
        <div className="diagnostic-profile__heading">
          <div>
            <p className="diagnostic-profile__eyebrow">技能別プロフィール</p>
            <h2 id="diagnostic-profile-title">今の状態</h2>
          </div>
          <strong>{Math.round(result.overallRate * 100)}%</strong>
        </div>

        <div className="diagnostic-profile__list">
          {result.sectionResults.map((section) => {
            const percentage = Math.round(section.rate * 100)
            return (
              <div className="diagnostic-profile-row" key={section.section}>
                <div className="diagnostic-profile-row__label">
                  <span>{DIAGNOSTIC_SECTION_LABELS[section.section]}</span>
                  <span>{percentage}%</span>
                </div>
                <div
                  aria-label={`${DIAGNOSTIC_SECTION_LABELS[section.section]} ${percentage}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={percentage}
                  className="diagnostic-profile-row__track"
                  role="progressbar"
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <Card label="これから" title="得意な考え方を英語の型へ">
        <p>
          推奨位置から始めても、毎回ひとつは土台の復習を入れます。
          開始位置はあとから本人または指導者が変更できます。
        </p>
        <p className="diagnostic-result-note">
          自由記述は端末内の簡易基準で確認しています。
          学習を始めた後の正答履歴に合わせて、支援量を調整します。
        </p>
      </Card>

      <div className="diagnostic-result-page__action">
        <Button fullWidth onClick={() => navigate('/', { replace: true })}>
          ホームへ進む
        </Button>
      </div>
    </AppShell>
  )
}

export default DiagnosticResultPage
