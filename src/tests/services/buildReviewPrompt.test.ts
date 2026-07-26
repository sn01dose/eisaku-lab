import { describe, expect, it } from 'vitest'
import type {
  AppState,
  SkillId,
  SpellingWord,
  WritingTask,
} from '../../domain/learner/types'
import { buildReviewPrompt } from '../../services/feedback/buildReviewPrompt'
import { createInitialState } from '../../services/storage/migrations'

const NOW = new Date('2026-07-26T12:00:00.000Z')

const translationTask: WritingTask = {
  id: 'wr-prompt-test',
  stage: 5,
  type: 'translatePlain',
  promptJa: 'この経験が彼女の考え方を変えた。',
  simplifiedJapanese: ['彼女はこの経験をしました。', 'その後、考え方が変わりました。'],
  modelAnswers: [
    'This experience changed the way she thought.',
    'Going through this experience transformed her perspective.',
  ],
  requiredSkills: ['writing.translation'],
  commonErrors: ['literalTranslation'],
  explanation: '安全な主語と動詞で原文の要素を保ちます。',
  estimatedMinutes: 3,
  theme: '経験',
}

const paragraphTask: WritingTask = {
  ...translationTask,
  id: 'wr-paragraph-test',
  type: 'paragraph',
  promptJa: 'オンライン学習について意見を書いてください。',
  modelAnswers: [
    'Online learning is useful because students can study at home.',
    'Digital lessons give learners more flexibility in where they study.',
  ],
  rubric: {
    minWords: 100,
    maxWords: 150,
    needsReason: true,
    needsExample: true,
    needsConclusion: true,
  },
}

function stateWithStableSkills(
  stableSkills: readonly SkillId[] = [],
): AppState {
  const state = createInitialState(NOW)
  stableSkills.forEach((skillId, index) => {
    state.mastery[skillId] = {
      ...state.mastery[skillId],
      stable: true,
      updatedAt: new Date(NOW.getTime() - index * 86_400_000).toISOString(),
    }
  })
  return state
}

function alphabeticSuffix(index: number): string {
  return [676, 26, 1]
    .map((divisor) =>
      String.fromCharCode(97 + Math.floor(index / divisor) % 26),
    )
    .join('')
}

function spellingWord(
  index: number,
  skillId: SkillId,
  stage: SpellingWord['stage'] = 5,
): SpellingWord {
  const word = `vocab${alphabeticSuffix(index)}`
  return {
    id: `test-${index}`,
    word,
    meaningJa: '検証語',
    stage,
    partOfSpeech: '名詞',
    strategy: 'pattern',
    chunks: [word],
    chunkKind: 'phonetic',
    patterns: [],
    skillIds: [skillId],
    exampleEn: `We use ${word} in this sentence.`,
    exampleJa: '検証用の例文です。',
    acceptedAnswers: [word],
    commonMistakes: [],
    errorTags: ['irregular'],
  }
}

describe('buildReviewPrompt', () => {
  it('定着技能が0件でもフォールバックで80語以上を用意する', () => {
    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience change her idea.',
      stage: 5,
      state: stateWithStableSkills(),
      now: NOW,
    })

    expect(result.vocabularyCount).toBeGreaterThanOrEqual(80)
    expect(result.vocabularyCount).toBeLessThanOrEqual(400)
    expect(result.vocabularyWords).toContain('study')
    expect(result.vocabularyWords).toContain('different')
    expect(result.prompt).toContain(`（${result.vocabularyCount}語）`)
  })

  it('30件の定着候補だけで80語に届かない場合も基礎語を補う', () => {
    const stableWords = Array.from({ length: 30 }, (_, index) =>
      spellingWord(index, 'spelling.shortVowel'),
    )
    const fallbackWords = Array.from({ length: 90 }, (_, index) =>
      spellingWord(index + 30, 'spelling.irregular', 1),
    )
    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her.',
      stage: 5,
      state: stateWithStableSkills(['spelling.shortVowel']),
      now: NOW,
      spellingWords: [...stableWords, ...fallbackWords],
      writingTasks: [translationTask],
    })

    expect(result.vocabularyCount).toBeGreaterThanOrEqual(80)
    expect(result.vocabularyWords).toContain(stableWords[0].word)
    expect(result.vocabularyWords).toContain(fallbackWords[0].word)
  })

  it('十分に定着語がある場合は基礎語フォールバックを追加しない', () => {
    const stableWords = Array.from({ length: 100 }, (_, index) =>
      spellingWord(index, 'spelling.shortVowel'),
    )
    const fallbackOnly = spellingWord(200, 'spelling.irregular', 1)
    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her.',
      stage: 5,
      state: stateWithStableSkills(['spelling.shortVowel']),
      now: NOW,
      spellingWords: [...stableWords, fallbackOnly],
      writingTasks: [translationTask],
    })

    expect(result.vocabularyCount).toBeGreaterThanOrEqual(80)
    expect(result.vocabularyWords).not.toContain(fallbackOnly.word)
  })

  it('語彙を400語に制限し、定着日の新しい技能に紐づく語を優先する', () => {
    const newerWords = Array.from({ length: 250 }, (_, index) =>
      spellingWord(index, 'spelling.shortVowel'),
    )
    const olderWords = Array.from({ length: 200 }, (_, index) =>
      spellingWord(index + 250, 'spelling.longVowel'),
    )
    const state = stateWithStableSkills([
      'spelling.shortVowel',
      'spelling.longVowel',
    ])

    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her.',
      stage: 5,
      state,
      now: NOW,
      spellingWords: [...newerWords, ...olderWords],
      writingTasks: [translationTask],
    })

    expect(result.vocabularyCount).toBe(400)
    expect(result.vocabularyWords).toContain(newerWords.at(-1)?.word)
    expect(result.vocabularyWords).not.toContain(olderWords.at(-1)?.word)
    expect(result.vocabularyWords).toEqual(
      [...result.vocabularyWords].sort((a, b) => a.localeCompare(b)),
    )
  })

  it('和文英訳と自由英作文で評価基準を切り替える', () => {
    const state = stateWithStableSkills()
    const translation = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her idea.',
      stage: 5,
      state,
      now: NOW,
    })
    const paragraph = buildReviewPrompt({
      task: paragraphTask,
      answer: 'Online learning is useful.',
      stage: 5,
      state,
      now: NOW,
    })

    expect(translation.prompt).toContain('これは和文英訳です。')
    expect(translation.prompt).toContain('原文にある要素の脱落は減点')
    expect(paragraph.prompt).toContain('これは自由英作文です。')
    expect(paragraph.prompt).toContain('語数条件（100〜150語）')
    expect(paragraph.prompt).not.toContain('これは和文英訳です。')
  })

  it('参考解答には安全側だけを載せ、自然側の全文を載せない', () => {
    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her idea.',
      stage: 5,
      state: stateWithStableSkills(),
      now: NOW,
    })

    expect(result.prompt).toContain(translationTask.modelAnswers[0])
    expect(result.prompt).not.toContain(translationTask.modelAnswers[1])
  })

  it('学習者の答案を改変せず、そのまま埋め込む', () => {
    const answer = "  I  don't change $&.\n{{stageName}}\tKeep THIS.  "
    const result = buildReviewPrompt({
      task: translationTask,
      answer,
      stage: 5,
      state: stateWithStableSkills(),
      now: NOW,
    })

    expect(result.prompt).toContain(`## 学習者の答案\n${answer}\n\n## 参考解答`)
  })

  it('直近30日の誤りを回数順で最大3件、日本語名にする', () => {
    const state = stateWithStableSkills()
    state.attempts = [
      {
        id: 'at-1',
        at: '2026-07-25T10:00:00.000Z',
        kind: 'writing',
        refId: translationTask.id,
        isRecall: true,
        input: '',
        correct: false,
        hintLevelUsed: 0,
        responseTimeMs: 1000,
        errorTags: ['article', 'tense'],
        skillIds: [],
      },
      {
        id: 'at-2',
        at: '2026-07-24T10:00:00.000Z',
        kind: 'writing',
        refId: translationTask.id,
        isRecall: true,
        input: '',
        correct: false,
        hintLevelUsed: 0,
        responseTimeMs: 1000,
        errorTags: ['article', 'vowelChoice', 'wordOrder'],
        skillIds: [],
      },
      {
        id: 'at-old',
        at: '2026-06-01T10:00:00.000Z',
        kind: 'writing',
        refId: translationTask.id,
        isRecall: true,
        input: '',
        correct: false,
        hintLevelUsed: 0,
        responseTimeMs: 1000,
        errorTags: ['article'],
        skillIds: [],
      },
    ]

    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her.',
      stage: 5,
      state,
      now: NOW,
    })

    expect(result.prompt).toContain(
      '直近で目立つ誤り：冠詞（2回）、時制（1回）、母音の選択（1回）',
    )
    expect(result.prompt).not.toContain('語順（1回）')
  })

  it('語彙を含めない設定でも件数と一覧をUI向けに返す', () => {
    const result = buildReviewPrompt({
      task: translationTask,
      answer: 'This experience changed her.',
      stage: 5,
      state: stateWithStableSkills(),
      now: NOW,
      includeVocabulary: false,
    })

    expect(result.includedVocabulary).toBe(false)
    expect(result.vocabularyCount).toBeGreaterThanOrEqual(80)
    expect(result.prompt).toContain('（語彙リストは含めていません）')
    expect(result.prompt).not.toContain(`（${result.vocabularyCount}語）`)
  })
})
