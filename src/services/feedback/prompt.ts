import type { StageId, WritingTask } from '../../domain/learner/types'

export function buildFeedbackPrompt(input: {
  task: WritingTask
  answer: string
  stage: StageId
}): string {
  return [
    'あなたは高校生の英作文指導者です。',
    `現在のステージ: ${input.stage}`,
    `問題: ${input.task.promptJa}`,
    `学習者の英文: ${input.answer}`,
    '',
    '次の方針で日本語の添削をしてください。',
    '- まだ学習していない高度な表現に直しすぎないこと。',
    '- 内容・構成・文法・語彙・スペリングを分けて短く評価すること。',
    '- できていることを最初に述べること。',
    '- 最重要の修正点を1〜2個に絞ること。',
    '- 学習者が自力で直せるヒントを先に出すこと。',
    '- 最後に自然な模範解答を1つ示すこと。',
  ].join('\n')
}
