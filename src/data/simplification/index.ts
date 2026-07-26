import { simplificationPackAAdditions } from './pack-a'
import { simplificationPackBAdditions } from './pack-b'
import { simplificationPackCAdditions } from './pack-c'
import { baseSimplificationTasks } from './tasks'

export {
  simplificationPackAAdditions,
  simplificationPackBAdditions,
  simplificationPackCAdditions,
}
export { baseSimplificationTasks } from './tasks'

export const simplificationPackA = [
  ...baseSimplificationTasks.slice(0, 7),
  ...simplificationPackAAdditions,
]

export const simplificationPackB = [
  ...baseSimplificationTasks.slice(7, 16),
  ...simplificationPackBAdditions,
]

export const simplificationPackC = [
  ...baseSimplificationTasks.slice(16),
  ...simplificationPackCAdditions,
]

export const simplificationTasks = [
  ...simplificationPackA,
  ...simplificationPackB,
  ...simplificationPackC,
].sort((left, right) => left.id.localeCompare(right.id))

export const simplificationTaskById = new Map(
  simplificationTasks.map((task) => [task.id, task]),
)
