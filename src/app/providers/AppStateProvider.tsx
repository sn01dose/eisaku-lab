/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState } from '../../domain/learner/types'
import {
  clearAppState,
  createInitialState,
  loadAppState,
  saveAppState,
} from '../../services/storage'

type StateUpdater = AppState | ((previous: AppState) => AppState)

interface AppStateContextValue {
  state: AppState
  updateState: (updater: StateUpdater) => void
  replaceState: (state: AppState) => void
  clearData: () => void
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  const [state, setState] = useState<AppState>(() => loadAppState())

  const updateState = useCallback((updater: StateUpdater) => {
    setState((previous) => {
      const next =
        typeof updater === 'function' ? updater(previous) : updater
      return saveAppState(next)
    })
  }, [])

  const replaceState = useCallback((next: AppState) => {
    setState(saveAppState(next))
  }, [])

  const clearData = useCallback(() => {
    clearAppState()
    setState(createInitialState())
  }, [])

  const value = useMemo(
    () => ({ state, updateState, replaceState, clearData }),
    [clearData, replaceState, state, updateState],
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState は AppStateProvider の内側で使用してください。')
  }
  return context
}
