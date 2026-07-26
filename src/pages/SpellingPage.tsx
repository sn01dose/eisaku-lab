import { useMemo, useState } from 'react'
import { AppShell, PageHeader } from '../components'
import { useAppState } from '../app/providers/AppStateProvider'
import { spellingWords } from '../data'
import type { StageId } from '../domain/learner/types'
import { SpellingTrainer } from '../features/spelling/SpellingTrainer'

export function SpellingPage(): React.JSX.Element {
  const { state } = useAppState()
  const [stage, setStage] = useState<StageId>(
    state.profile?.currentStage ?? 1,
  )
  const items = useMemo(
    () =>
      [...spellingWords, ...Object.values(state.customSpellingWords)].filter(
        (item) => item.stage === stage,
      ),
    [stage, state.customSpellingWords],
  )

  return (
    <AppShell activePath="/spelling">
      <PageHeader
        title="スペリング"
        eyebrow="思い出して入力"
        description="音だけに頼らず、文字パターン・語の構成・例外も使い分けます。"
        backHref="#/"
        action={
          <label className="compact-select">
            <span className="sr-only">ステージ</span>
            <select
              value={stage}
              onChange={(event) => setStage(Number(event.target.value) as StageId)}
            >
              {[1, 2, 3, 4, 5, 6].map((value) => (
                <option value={value} key={value}>
                  Stage {value}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <SpellingTrainer items={items} key={stage} />
    </AppShell>
  )
}
