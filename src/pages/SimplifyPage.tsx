import { useMemo, useState } from 'react'
import { AppShell, PageHeader } from '../components'
import { useAppState } from '../app/providers/AppStateProvider'
import { simplificationTasks } from '../data'
import type { StageId } from '../domain/learner/types'
import { SimplificationTrainer } from '../features/japaneseSimplification/SimplificationTrainer'

export function SimplifyPage(): React.JSX.Element {
  const { state } = useAppState()
  const initialStage = Math.max(2, state.profile?.currentStage ?? 2) as StageId
  const [stage, setStage] = useState<StageId>(initialStage)
  const tasks = useMemo(
    () => simplificationTasks.filter((task) => task.stage === stage),
    [stage],
  )

  return (
    <AppShell activePath="/simplify">
      <PageHeader
        title="日本語言い換え"
        eyebrow="英訳の前に"
        description="難しい日本語を、知っている英語で表せる日本語へ変えます。"
        backHref="#/"
        action={
          <label className="compact-select">
            <span className="sr-only">ステージ</span>
            <select
              value={stage}
              onChange={(event) => setStage(Number(event.target.value) as StageId)}
            >
              {[2, 3, 4, 5, 6].map((value) => (
                <option value={value} key={value}>
                  Stage {value}
                </option>
              ))}
            </select>
          </label>
        }
      />
      <SimplificationTrainer tasks={tasks} />
    </AppShell>
  )
}
