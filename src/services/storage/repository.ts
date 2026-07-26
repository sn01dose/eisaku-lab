import type { AppState } from '../../domain/learner/types'
import { writingTasks } from '../../data/writing'
import { refreshStudyPlan } from '../../domain/plan/refreshStudyPlan'
import { refreshWeeklySnapshots } from '../../domain/report/weeklySnapshot'
import {
  createInitialState,
  CURRENT_SCHEMA_VERSION,
  migrateState,
} from './migrations'

export const STORAGE_KEY = 'eisaku-lab:state'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export class AppStateRepository {
  private memoryState: AppState | null = null
  private readonly storage: StorageLike | null
  private readonly key: string
  private readonly now: () => Date

  constructor(
    storage: StorageLike | null = browserStorage(),
    key = STORAGE_KEY,
    now: () => Date = () => new Date(),
  ) {
    this.storage = storage
    this.key = key
    this.now = now
  }

  private refreshRuntimeState(state: AppState): AppState {
    const now = this.now()
    return refreshStudyPlan(
      refreshWeeklySnapshots(state, now, writingTasks),
      now,
    )
  }

  load(): AppState {
    if (!this.storage) {
      return this.refreshRuntimeState(
        this.memoryState ?? createInitialState(this.now()),
      )
    }
    const serialized = this.storage.getItem(this.key)
    if (!serialized) return createInitialState(this.now())
    try {
      return this.refreshRuntimeState(
        migrateState(JSON.parse(serialized), this.now()),
      )
    } catch {
      return createInitialState(this.now())
    }
  }

  save(state: AppState): AppState {
    const normalized = this.refreshRuntimeState(
      migrateState(
        {
          ...state,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          attempts: state.attempts.slice(-1000),
        },
        this.now(),
      ),
    )
    if (this.storage) {
      this.storage.setItem(this.key, JSON.stringify(normalized))
    } else {
      this.memoryState = normalized
    }
    return normalized
  }

  clear(): void {
    this.memoryState = null
    this.storage?.removeItem(this.key)
  }
}

let defaultRepository: AppStateRepository | null = null

function repository(): AppStateRepository {
  defaultRepository ??= new AppStateRepository()
  return defaultRepository
}

export function loadAppState(): AppState {
  return repository().load()
}

export function saveAppState(state: AppState): AppState {
  return repository().save(state)
}

export function clearAppState(): void {
  repository().clear()
}
