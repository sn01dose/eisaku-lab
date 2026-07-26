import {
  extendedWritingStage1,
  extendedWritingStage2,
  extendedWritingStage3,
} from './extendedStage1To3'
import { extendedWritingStage4, extendedWritingStage5 } from './extendedStage4To5'
import { extendedWritingStage6 } from './extendedStage6'
import { extendedWritingPack02 } from './extendedPack02'
import { extendedWritingPack03 } from './extendedPack03'
import { shortWritingTasks } from './shortIndex'

export * from './shortIndex'
export {
  extendedWritingStage1,
  extendedWritingStage2,
  extendedWritingStage3,
  extendedWritingStage4,
  extendedWritingStage5,
  extendedWritingStage6,
  extendedWritingPack02,
  extendedWritingPack03,
}

export const extendedWritingTasks = [
  ...extendedWritingStage1,
  ...extendedWritingStage2,
  ...extendedWritingStage3,
  ...extendedWritingStage4,
  ...extendedWritingStage5,
  ...extendedWritingStage6,
  ...extendedWritingPack02,
  ...extendedWritingPack03,
]

export const writingTasks = [...shortWritingTasks, ...extendedWritingTasks]
export const writingTaskById = new Map(writingTasks.map((task) => [task.id, task]))
