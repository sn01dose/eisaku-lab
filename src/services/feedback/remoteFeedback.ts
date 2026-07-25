import type { FeedbackResult } from '../../domain/learner/types'
import type { FeedbackProvider } from './types'

export class RemoteFeedbackProvider implements FeedbackProvider {
  constructor(private readonly endpoint = '/api/feedback') {}

  async review(
    input: Parameters<FeedbackProvider['review']>[0],
  ): Promise<FeedbackResult> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      throw new Error('外部添削を利用できません。ローカル判定を使用してください。')
    }
    return (await response.json()) as FeedbackResult
  }
}
