import type {
  SpellingErrorTag,
  WritingErrorTag,
} from '../../domain/learner/types'

export type ReviewErrorTag = SpellingErrorTag | WritingErrorTag

export interface ParsedReviewFix {
  source: string
  correction: string
  tag: ReviewErrorTag | null
  note: string
  priority: boolean
  complete: boolean
  raw: string
}

export interface ParsedReviewOutput {
  fixes: ParsedReviewFix[]
  rewrittenAnswer: string | null
}

const SPELLING_ERROR_TAGS = [
  'vowelChoice',
  'consonantChoice',
  'doubleConsonant',
  'silentLetter',
  'omission',
  'insertion',
  'transposition',
  'prefix',
  'suffix',
  'inflection',
  'irregular',
  'soundToLetter',
  'notRecalled',
] as const satisfies readonly SpellingErrorTag[]

const WRITING_ERROR_TAGS = [
  'missingSubject',
  'missingVerb',
  'wordOrder',
  'tense',
  'thirdPersonS',
  'number',
  'article',
  'pronoun',
  'preposition',
  'conjunction',
  'fragment',
  'runOn',
  'literalTranslation',
  'wordChoice',
  'spelling',
  'punctuation',
  'capitalization',
] as const satisfies readonly WritingErrorTag[]

const KNOWN_ERROR_TAGS = new Set<string>([
  ...SPELLING_ERROR_TAGS,
  ...WRITING_ERROR_TAGS,
])

const FIX_START = /^\s*---FIX---\s*$/i
const FIX_END = /^\s*---END---\s*$/i
const REWRITE_HEADING =
  /^\s*(?:#{1,6}\s*)?書き直し(?:\s*[:：]\s*(.*))?\s*$/
const MARKDOWN_HEADING = /^\s*#{1,6}\s+\S/
const COLUMN_SEPARATOR = /\s*[｜|\t/]\s*/

function asKnownTag(value: string): ReviewErrorTag | null {
  return KNOWN_ERROR_TAGS.has(value) ? (value as ReviewErrorTag) : null
}

function parseFixLine(line: string): ParsedReviewFix | null {
  const raw = line.trim()
  if (!raw) return null

  const priority = /^\s*★/.test(raw)
  const withoutPriority = raw.replace(/^\s*★\s*/, '')
  const columns = withoutPriority.split(COLUMN_SEPARATOR)
  const source = columns[0]?.trim() ?? ''
  const correction = columns[1]?.trim() ?? ''
  const tag = asKnownTag(columns[2]?.trim() ?? '')
  const note = columns
    .slice(3)
    .map((column) => column.trim())
    .filter(Boolean)
    .join(' / ')

  return {
    source,
    correction,
    tag,
    note,
    priority,
    complete: Boolean(source && correction && tag),
    raw,
  }
}

interface RewriteSection {
  answer: string | null
  lineIndexes: Set<number>
}

function extractRewriteSection(lines: readonly string[]): RewriteSection {
  const lineIndexes = new Set<number>()
  const headingIndex = lines.findIndex((line) => REWRITE_HEADING.test(line))
  if (headingIndex < 0) return { answer: null, lineIndexes }

  const headingMatch = lines[headingIndex]?.match(REWRITE_HEADING)
  const answerLines: string[] = []
  const inlineAnswer = headingMatch?.[1]?.trim()
  lineIndexes.add(headingIndex)
  if (inlineAnswer) answerLines.push(inlineAnswer)

  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (MARKDOWN_HEADING.test(line) || FIX_START.test(line)) break
    lineIndexes.add(index)
    answerLines.push(line)
  }

  const answer = answerLines.join('\n').trim()
  return { answer: answer || null, lineIndexes }
}

function markerCandidateLines(lines: readonly string[]): string[] {
  const candidates: string[] = []
  let insideFixBlock = false

  for (const line of lines) {
    if (FIX_START.test(line)) {
      insideFixBlock = true
      continue
    }
    if (FIX_END.test(line)) {
      insideFixBlock = false
      continue
    }
    if (insideFixBlock && line.trim()) candidates.push(line)
  }

  return candidates
}

function fallbackCandidateLines(
  lines: readonly string[],
  excludedIndexes: ReadonlySet<number>,
): string[] {
  return lines.filter((line, index) => {
    if (excludedIndexes.has(index)) return false
    return (line.match(/[｜|]/g) ?? []).length >= 2
  })
}

export function parseReviewOutput(output: string): ParsedReviewOutput {
  const lines = output.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  const rewrite = extractRewriteSection(lines)
  const hasFixMarker = lines.some((line) => FIX_START.test(line))
  const candidateLines = hasFixMarker
    ? markerCandidateLines(lines)
    : fallbackCandidateLines(lines, rewrite.lineIndexes)

  return {
    fixes: candidateLines
      .map(parseFixLine)
      .filter((fix): fix is ParsedReviewFix => fix !== null),
    rewrittenAnswer: rewrite.answer,
  }
}
