import type { AppState, StageId } from '../learner/types'
import { buildStudyPlan, dateKey } from './buildStudyPlan'

function nextStageAfterExpiredWindows(
  state: AppState,
  today: string,
): StageId {
  const current = state.profile?.currentStage ?? 1
  let nextStage = current
  for (const window of state.plan?.stageWindows ?? []) {
    if (window.stage < current || window.endDate > today) continue
    const stageAfterWindow =
      window.stage === 6 ? 6 : ((window.stage + 1) as StageId)
    if (stageAfterWindow > nextStage) nextStage = stageAfterWindow
  }
  return nextStage
}

export function refreshStudyPlan(
  state: AppState,
  now = new Date(),
): AppState {
  if (!state.profile?.targetDate) {
    return state.plan === null ? state : { ...state, plan: null }
  }
  const targetDate = state.profile.targetDate
  const currentStage = nextStageAfterExpiredWindows(state, dateKey(now))
  let profile =
    currentStage === state.profile.currentStage
      ? state.profile
      : { ...state.profile, currentStage }
  let plan = buildStudyPlan({
    targetDate,
    currentStage,
    historyStartedAt: profile.createdAt,
    sessions: state.sessions,
    attempts: state.attempts,
    mastery: state.mastery,
    previousPlan: state.plan,
    now,
  })

  const firstAllocatedStage = plan.stageWindows[0]?.stage
  if (firstAllocatedStage && firstAllocatedStage > profile.currentStage) {
    profile = { ...profile, currentStage: firstAllocatedStage }
    plan = buildStudyPlan({
      targetDate,
      currentStage: firstAllocatedStage,
      historyStartedAt: profile.createdAt,
      sessions: state.sessions,
      attempts: state.attempts,
      mastery: state.mastery,
      previousPlan: plan,
      now,
    })
  }

  return { ...state, profile, plan }
}
