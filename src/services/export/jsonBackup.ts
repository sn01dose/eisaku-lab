import type { AppState } from '../../domain/learner/types'
import { migrateState } from '../storage/migrations'

export function exportStateToJson(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importStateFromJson(serialized: string): AppState {
  let raw: unknown
  try {
    raw = JSON.parse(serialized)
  } catch {
    throw new Error('JSONを読み取れませんでした。ファイルを確認してください。')
  }
  return migrateState(raw)
}
