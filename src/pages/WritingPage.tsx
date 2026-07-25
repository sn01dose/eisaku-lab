import { useMemo, useState } from 'react'
import { AppShell, PageHeader } from '../components'
import { useAppState } from '../app/providers/AppStateProvider'
import {
  extendedWritingTasks,
  miniLessons,
  shortWritingTasks,
  spellingWords,
} from '../data'
import type { StageId } from '../domain/learner/types'
import { WritingTrainer } from '../features/writing/WritingTrainer'

type TaskScope = 'short' | 'extended'

export function WritingPage(): React.JSX.Element {
  const { state } = useAppState()
  const [stage, setStage] = useState<StageId>(
    state.profile?.currentStage ?? 1,
  )
  const [scope, setScope] = useState<TaskScope>('short')
  const tasks = useMemo(
    () =>
      (scope === 'short' ? shortWritingTasks : extendedWritingTasks).filter(
        (task) => task.stage === stage,
      ),
    [scope, stage],
  )

  return (
    <AppShell activePath="/writing">
      <PageHeader
        title="英作文"
        eyebrow={`現在の支援 Level ${state.profile?.supportLevel ?? 1}`}
        description="骨格から始め、できた分だけ支援を減らします。"
        backHref="#/"
      />
      <div className="filter-row" aria-label="英作文の種類">
        <button
          type="button"
          aria-pressed={scope === 'short'}
          onClick={() => setScope('short')}
        >
          短文・和文英訳
        </button>
        <button
          type="button"
          aria-pressed={scope === 'extended'}
          onClick={() => setScope('extended')}
        >
          段落・自由英作文
        </button>
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
      </div>
      <WritingTrainer
        tasks={tasks}
        spellingWords={spellingWords}
        miniLessons={miniLessons}
      />
    </AppShell>
  )
}
