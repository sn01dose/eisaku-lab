import type { SkillId, StageId } from '../learner/types'

export interface StageWindow {
  stage: StageId
  startDate: string
  endDate: string
  days: number
}

export interface StudyPlan {
  generatedAt: string
  targetDate: string
  remainingDays: number
  attendanceRate: number
  effectiveDays: number
  phase: 'build' | 'final'
  finalPhaseStartDate: string
  stageWindows: StageWindow[]
  carryOverSkills: SkillId[]
}
