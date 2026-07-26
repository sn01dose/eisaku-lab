import type {
  SkillId,
  StageId,
} from '../../domain/learner/types'
import type { StudyPlan } from '../../domain/plan/types'
import type { WeeklySnapshot } from '../../domain/report/types'

export interface ReportStageWindow {
  stage: StageId
  startDate: string
  endDate: string
  days: number
}

export interface ReportPlanSummary {
  targetDate: string
  remainingDays: number
  effectiveDays: number
  phase: StudyPlan['phase']
  finalPhaseStartDate: string
  stageWindows: ReportStageWindow[]
}

export interface LearningReportPayload {
  version: 1
  snapshots: WeeklySnapshot[]
  plan: ReportPlanSummary | null
  stableSkillIds: SkillId[]
  unresolvedNoteCount: number
}

export interface SharedEssay {
  createdAt: string
  answer: string
}

export interface BuildLearningReportInput {
  selectedSnapshots: readonly WeeklySnapshot[]
  previousSnapshot?: WeeklySnapshot | null
  plan?: StudyPlan | null
  stableSkillIds?: readonly SkillId[]
  unresolvedNoteCount?: number
  personalComment?: string
  includeEssays?: boolean
  essays?: readonly SharedEssay[]
  includeTransferData?: boolean
}

export interface BuiltLearningReport {
  text: string
  transferCode: string
  payload: LearningReportPayload
}
