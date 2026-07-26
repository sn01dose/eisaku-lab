import { describe, expect, it } from 'vitest'
import type {
  AppState,
  ReviewCard,
  SkillId,
  SpellingWord,
  WritingTask,
} from '../../domain/learner/types'
import { createReviewCard } from '../../domain/review/scheduler'
import {
  buildReviewPrompt,
  VOCABULARY_FALLBACK_TARGET,
} from '../../services/feedback/buildReviewPrompt'
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

const vocabularyTask: WritingTask = {
  ...translationTask,
  id: 'wr-vocabulary-test',
  wordBank: ['taskdelta'],
  modelAnswers: ['taskalpha taskbeta', 'taskgamma'],
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

function reviewWord(
  state: AppState,
  word: SpellingWord,
  overrides: Partial<ReviewCard> = {},
): void {
  const card = createReviewCard({
    kind: 'spelling',
    refId: word.id,
    source: overrides.source,
    now: NOW,
  })
  state.cards[card.id] = {
    ...card,
    repetitions: 3,
    lastResult: 'correct',
    lastReviewedAt: NOW.toISOString(),
    ...overrides,
  }
}

function selectVocabulary(
  state: AppState,
  spellingWords: readonly SpellingWord[],
  task = vocabularyTask,
) {
  return buildReviewPrompt({
    task,
    answer: 'Answer.',
    stage: task.stage,
    state,
    now: NOW,
    spellingWords,
    writingTasks: [task],
  })
}

describe('buildReviewPrompt', () => {
  it('技能だけstableな語をskillStableに分類する', () => {
    const word = spellingWord(1, 'spelling.suffix')
    const result = selectVocabulary(
      stateWithStableSkills(['spelling.suffix']),
      [word],
    )
    expect(result.vocabularyBreakdown).toMatchObject({
      wordStable: 0,
      skillStable: 1,
    })
  })

  it('3回成功し直近も自力正解の語をwordStableに分類する', () => {
    const word = spellingWord(2, 'spelling.suffix')
    const state = stateWithStableSkills()
    reviewWord(state, word)
    const result = selectVocabulary(state, [word])
    expect(result.vocabularyBreakdown.wordStable).toBe(1)
    expect(result.vocabularyWords).toContain(word.word)
  })

  it('3回でも直近がヒント付きならwordStableにしない', () => {
    const word = spellingWord(3, 'spelling.suffix')
    const state = stateWithStableSkills()
    reviewWord(state, word, { lastResult: 'hinted' })
    const result = selectVocabulary(state, [word])
    expect(result.vocabularyBreakdown.wordStable).toBe(0)
    expect(result.vocabularyWords).not.toContain(word.word)
  })

  it('成功が2回の語はwordStableにしない', () => {
    const word = spellingWord(4, 'spelling.suffix')
    const state = stateWithStableSkills()
    reviewWord(state, word, { repetitions: 2 })
    const result = selectVocabulary(state, [word])
    expect(result.vocabularyBreakdown.wordStable).toBe(0)
    expect(result.vocabularyWords).not.toContain(word.word)
  })

  it('英作文由来のカスタム語も同じ条件でwordStableにする', () => {
    const custom = {
      ...spellingWord(5, 'spelling.suffix'),
      id: 'custom-spelling:customstable',
      word: 'customstable',
      acceptedAnswers: ['customstable'],
    }
    const state = stateWithStableSkills()
    state.customSpellingWords[custom.id] = custom
    reviewWord(state, custom, { source: 'writingMistake' })
    const result = selectVocabulary(state, [])
    expect(result.vocabularyBreakdown.wordStable).toBe(1)
    expect(result.vocabularyWords).toContain('customstable')
  })

  it('400語を超えても当該課題の語を必ず残す', () => {
    const words = Array.from({ length: 450 }, (_, index) =>
      spellingWord(index + 10, 'spelling.shortVowel'),
    )
    const state = stateWithStableSkills()
    words.forEach((word) => reviewWord(state, word))
    const result = selectVocabulary(state, words)
    expect(result.vocabularyCount).toBe(400)
    expect(result.vocabularyBreakdown.task).toBe(4)
    expect(result.vocabularyWords).toEqual(
      expect.arrayContaining(['taskalpha', 'taskbeta', 'taskgamma', 'taskdelta']),
    )
  })

  it('補完時の合計を220語で止める', () => {
    const words = Array.from({ length: 300 }, (_, index) =>
      spellingWord(index, 'spelling.shortVowel', 1),
    )
    const result = selectVocabulary(stateWithStableSkills(), words)
    expect(result.vocabularyCount).toBe(220)
    expect(
      result.vocabularyBreakdown.fallbackBasic +
        result.vocabularyBreakdown.fallbackModel,
    ).toBe(216)
  })

  it('wordStableが80語以上でも合計220語まで補完する', () => {
    const stableWords = Array.from({ length: 90 }, (_, index) =>
      spellingWord(index, 'spelling.shortVowel'),
    )
    const fallbackWords = Array.from({ length: 150 }, (_, index) =>
      spellingWord(index + 100, 'spelling.shortVowel', 1),
    )
    const state = stateWithStableSkills()
    stableWords.forEach((word) => reviewWord(state, word))
    const result = selectVocabulary(state, [...stableWords, ...fallbackWords])
    expect(result.vocabularyCount).toBe(VOCABULARY_FALLBACK_TARGET)
    expect(result.vocabularyBreakdown.wordStable).toBe(90)
    expect(result.vocabularyBreakdown.fallbackBasic).toBe(126)
    expect(result.vocabularyBreakdown.fallbackModel).toBe(0)
  })

  it('内訳の合計が語数と一致する', () => {
    const result = selectVocabulary(stateWithStableSkills(), [])
    expect(Object.values(result.vocabularyBreakdown).reduce((a, b) => a + b, 0))
      .toBe(result.vocabularyWords.length)
  })

  it('表示用の語彙をアルファベット順に返す', () => {
    const result = selectVocabulary(stateWithStableSkills(), [
      spellingWord(8, 'spelling.shortVowel', 1),
      spellingWord(1, 'spelling.shortVowel', 1),
    ])
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
