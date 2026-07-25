import type {
  FeedbackResult,
  StageId,
  WritingTask,
} from '../../domain/learner/types'

export interface FeedbackProvider {
  review(input: {
    task: WritingTask
    answer: string
    stage: StageId
  }): Promise<FeedbackResult>
}
