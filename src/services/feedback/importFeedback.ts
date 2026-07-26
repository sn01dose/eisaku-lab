import type {
  FeedbackFinding,
  FeedbackResult,
  MistakeNote,
} from '../../domain/learner/types'
import { skillsForErrorTags } from '../../domain/mastery/skillMap'
import { uid, wordCount } from '../../utils/format'
import {
  cleanedSpellingCorrections,
  CUSTOM_SPELLING_PREFIX,
  customSpellingRefId,
  customSpellingWord,
  DEFAULT_POSITIVE,
  findCatalogWord,
  normalizeWord,
  orderedGrammarFindings,
  scheduleByTomorrow,
  sentenceCount,
  tomorrowCard,
  upsertNote,
} from './importFeedbackHelpers'
import type {
  FeedbackImportResult,
  ImportInput,
  ManualFeedbackDraft,
} from './importFeedbackTypes'

export type {
  FeedbackImportResult,
  FeedbackImportSummary,
  FeedbackPriority,
  ManualFeedbackDraft,
  ManualGrammarFinding,
  ManualSpellingCorrection,
} from './importFeedbackTypes'

export function validateManualFeedback(draft: ManualFeedbackDraft): string[] {
  const errors: string[] = []
  if (!draft.correctedAnswer.trim()) {
    errors.push('修正版の英文を入力してください。')
  }
  const grammar = orderedGrammarFindings(draft.grammarFindings)
  const spelling = cleanedSpellingCorrections(draft.spellingCorrections)
  const enteredSpelling = draft.spellingCorrections.filter(
    ({ input, correction, meaningJa, errorTag }) =>
      input.trim() || correction.trim() || meaningJa?.trim() || errorTag,
  )
  if (grammar.length === 0 && spelling.length === 0) {
    errors.push('文法またはスペルの指摘を1件以上入力してください。')
  }
  if (
    enteredSpelling.some(
      ({ input, correction }) => !input.trim() || !correction.trim(),
    )
  ) {
    errors.push('スペルは「書いた綴り」と「正しい綴り」を両方入力してください。')
  }
  if (enteredSpelling.some(({ errorTag }) => !errorTag)) {
    errors.push('スペルの誤りの種類を選択してください。')
  }
  if (
    spelling.some(
      ({ input, correction }) =>
        !/^[a-z]+(?:['-][a-z]+)*$/i.test(input) ||
        !/^[a-z]+(?:['-][a-z]+)*$/i.test(correction),
    )
  ) {
    errors.push('スペル欄には英単語を1語ずつ入力してください。')
  }
  if (
    spelling.some(
      ({ input, correction }) =>
        normalizeWord(input) === normalizeWord(correction),
    )
  ) {
    errors.push('書いた綴りと正しい綴りには異なる語を入力してください。')
  }
  return errors
}

export function importManualFeedback(input: ImportInput): FeedbackImportResult {
  const essay = input.state.essays.find(({ id }) => id === input.essayId)
  if (!essay) throw new Error('指定された英作文が見つかりません。')
  const errors = validateManualFeedback(input.draft)
  if (errors.length > 0) throw new Error(errors[0])

  const now = input.now ?? new Date()
  const nowIso = now.toISOString()
  const makeId = input.makeId ?? uid
  const grammar = orderedGrammarFindings(input.draft.grammarFindings)
  const spelling = cleanedSpellingCorrections(input.draft.spellingCorrections)
  const correctedAnswer = input.draft.correctedAnswer.trim()
  const notes = [...input.state.notes]
  const cards = { ...input.state.cards }
  const customSpellingWords = { ...input.state.customSpellingWords }
  let notesCreated = 0
  let notesUpdated = 0
  let cardsCreated = 0
  let knownSpellingCards = 0
  let customSpellingCards = 0

  const recordNote = (note: MistakeNote) => {
    if (upsertNote(notes, note) === 'created') notesCreated += 1
    else notesUpdated += 1
  }

  for (const finding of grammar) {
    recordNote({
      id: makeId('note'),
      at: nowIso,
      updatedAt: nowIso,
      kind: 'writing',
      refId: essay.taskId,
      input: finding.input.trim() || essay.answer,
      correction: finding.correction.trim() || correctedAnswer,
      primaryErrorTag: finding.errorTag,
      errorTags: [finding.errorTag],
      skillIds: skillsForErrorTags([finding.errorTag]),
      occurrenceCount: 1,
      conquered: false,
      reviewCardId: null,
    })
  }

  for (const correction of spelling) {
    if (!correction.errorTag) {
      throw new Error('スペルの誤りの種類を選択してください。')
    }
    const catalogWord = findCatalogWord(correction.correction, input.spellingWords)
    const refId =
      catalogWord?.id ?? customSpellingRefId(correction.correction)
    const cardId = `card:${refId}`
    const freshCard = tomorrowCard(
      refId,
      'writingMistake',
      now,
    )
    if (!cards[cardId]) cardsCreated += 1
    cards[cardId] = scheduleByTomorrow(cards[cardId], freshCard)
    if (catalogWord) knownSpellingCards += 1
    else customSpellingCards += 1

    const tags = [correction.errorTag]
    if (!catalogWord) {
      if (!correction.meaningJa) {
        throw new Error(
          `教材にない「${correction.correction}」の日本語の意味を入力してください。`,
        )
      }
      customSpellingWords[refId] = customSpellingWord({
        refId,
        word: correction.correction,
        meaningJa: correction.meaningJa,
        actual: correction.input,
        essayAnswer: correctedAnswer,
        stage: essay.stage,
        errorTags: [...tags],
        skillIds: skillsForErrorTags(tags),
      })
    }
    recordNote({
      id: makeId('note'),
      at: nowIso,
      updatedAt: nowIso,
      kind: 'spelling',
      refId,
      input: correction.input,
      correction: catalogWord?.word ?? correction.correction,
      primaryErrorTag: correction.errorTag,
      errorTags: [...tags],
      skillIds: skillsForErrorTags(tags),
      occurrenceCount: 1,
      conquered: false,
      reviewCardId: cardId,
    })
  }

  const findings: FeedbackFinding[] = [
    {
      id: makeId('feedback'),
      severity: 'positive',
      message: input.draft.positiveMessage.trim() || DEFAULT_POSITIVE,
    },
    ...grammar.map((finding) => ({
      id: makeId('feedback'),
      severity:
        finding.priority === 'primary'
          ? ('important' as const)
          : ('check' as const),
      message: finding.message,
      errorTag: finding.errorTag,
    })),
    ...spelling.map(({ input: actual, correction }) => ({
      id: makeId('feedback'),
      severity: 'check' as const,
      message: `「${actual}」の綴りを「${correction}」に直します。`,
      errorTag: 'spelling' as const,
    })),
  ]
  const feedback: FeedbackResult = {
    findings,
    wordCount: wordCount(correctedAnswer),
    sentenceCount: sentenceCount(correctedAnswer),
    checkedAt: nowIso,
  }

  return {
    state: {
      ...input.state,
      cards,
      customSpellingWords,
      notes,
      essays: input.state.essays.map((item) =>
        item.id === essay.id
          ? { ...item, feedback, updatedAt: nowIso }
          : item,
      ),
    },
    feedback,
    summary: {
      essayId: essay.id,
      primaryErrorTag: grammar[0]?.errorTag ?? null,
      notesCreated,
      notesUpdated,
      cardsCreated,
      knownSpellingCards,
      customSpellingCards,
    },
  }
}

export function isCustomSpellingRefId(refId: string): boolean {
  return refId.startsWith(CUSTOM_SPELLING_PREFIX)
}
