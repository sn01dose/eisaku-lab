import type { StageId } from '../domain/learner/types'
import { diagnosticItems } from './diagnostics'
import { miniLessons } from './lessons'
import { simplificationTasks } from './simplification'
import { spellingWords } from './spelling'
import {
  extendedWritingTasks,
  shortWritingTasks,
  writingTasks,
} from './writing'

export * from './diagnostics'
export * from './index/index'
export * from './lessons'
export * from './simplification'
export * from './spelling'
export * from './writing'

export const countByStage = <T extends { stage: StageId }>(
  items: readonly T[],
): Record<StageId, number> => {
  const counts: Record<StageId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
  items.forEach((item) => {
    counts[item.stage] += 1
  })
  return counts
}

export const dataCounts = {
  spelling: {
    total: spellingWords.length,
    byStage: countByStage(spellingWords),
  },
  shortWriting: {
    total: shortWritingTasks.length,
    byStage: countByStage(shortWritingTasks),
  },
  extendedWriting: {
    total: extendedWritingTasks.length,
    byStage: countByStage(extendedWritingTasks),
  },
  simplification: {
    total: simplificationTasks.length,
    byStage: countByStage(simplificationTasks),
  },
  miniLessons: miniLessons.length,
  diagnostics: diagnosticItems.length,
  allWriting: writingTasks.length,
} as const
