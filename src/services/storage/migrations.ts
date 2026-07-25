import {
  ALL_SKILL_IDS,
  type AppState,
  type LearnerProfile,
  type SkillId,
  type SkillMastery,
} from '../../domain/learner/types'
import {
  createMasteryRecord,
  isStableMastery,
} from '../../domain/mastery/updateMastery'

export const CURRENT_SCHEMA_VERSION = 1

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSkillId(value: string): value is SkillId {
  return (ALL_SKILL_IDS as readonly string[]).includes(value)
}

function normalizeMastery(
  value: unknown,
  now: Date,
): Record<SkillId, SkillMastery> {
  const defaults = createMasteryRecord(now)
  if (!isRecord(value)) return defaults
  for (const [key, entry] of Object.entries(value)) {
    if (!isSkillId(key) || !isRecord(entry)) continue
    const score =
      typeof entry.score === 'number'
        ? Math.min(100, Math.max(0, entry.score))
        : 0
    const correctDays = Array.isArray(entry.correctDays)
      ? Array.from(
          new Set(
            entry.correctDays.filter(
              (day): day is string => typeof day === 'string',
            ),
          ),
        ).sort()
      : []
    defaults[key] = {
      skillId: key,
      score,
      correctDays,
      stable: isStableMastery(correctDays),
      updatedAt:
        typeof entry.updatedAt === 'string'
          ? entry.updatedAt
          : now.toISOString(),
    }
  }
  return defaults
}

function normalizeProfile(value: unknown, now: Date): LearnerProfile | null {
  if (value === null || value === undefined) return null
  if (!isRecord(value) || typeof value.nickname !== 'string') {
    throw new Error('学習者プロフィールの形式が正しくありません。')
  }
  const dailyMinutes = [15, 30, 45].includes(Number(value.dailyMinutes))
    ? (Number(value.dailyMinutes) as 15 | 30 | 45)
    : 30
  const stage = (candidate: unknown, fallback: number) => {
    const numeric = Number(candidate)
    return (
      Number.isInteger(numeric) && numeric >= 1 && numeric <= 6
        ? numeric
        : fallback
    ) as LearnerProfile['currentStage']
  }
  const support = Number(value.supportLevel)
  const goals = ['foundation', 'commonTest', 'university', 'selective'] as const
  const goal = goals.includes(value.goal as (typeof goals)[number])
    ? (value.goal as LearnerProfile['goal'])
    : 'foundation'
  return {
    nickname: value.nickname,
    dailyMinutes,
    goal,
    useSpeech: value.useSpeech !== false,
    targetDate: typeof value.targetDate === 'string' ? value.targetDate : null,
    currentStage: stage(value.currentStage, 1),
    recommendedStage: stage(value.recommendedStage, 1),
    supportLevel:
      Number.isInteger(support) && support >= 1 && support <= 5
        ? (support as LearnerProfile['supportLevel'])
        : 1,
    createdAt:
      typeof value.createdAt === 'string'
        ? value.createdAt
        : now.toISOString(),
  }
}

export function createInitialState(now = new Date()): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: null,
    cards: {},
    attempts: [],
    mastery: createMasteryRecord(now),
    notes: [],
    essays: [],
    diagnostic: null,
    sessions: [],
  }
}

function migrateVersionZero(raw: JsonRecord, now: Date): AppState {
  return {
    schemaVersion: 1,
    profile: normalizeProfile(raw.profile ?? raw.learner, now),
    cards: isRecord(raw.cards)
      ? (raw.cards as AppState['cards'])
      : {},
    attempts: Array.isArray(raw.attempts)
      ? (raw.attempts as AppState['attempts']).slice(-1000)
      : [],
    mastery: normalizeMastery(raw.mastery, now),
    notes: Array.isArray(raw.notes) ? (raw.notes as AppState['notes']) : [],
    essays: Array.isArray(raw.essays)
      ? (raw.essays as AppState['essays'])
      : [],
    diagnostic: isRecord(raw.diagnostic)
      ? (raw.diagnostic as unknown as AppState['diagnostic'])
      : null,
    sessions: Array.isArray(raw.sessions)
      ? (raw.sessions as AppState['sessions'])
      : [],
  }
}

function normalizeVersionOne(raw: JsonRecord, now: Date): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: normalizeProfile(raw.profile, now),
    cards: isRecord(raw.cards) ? (raw.cards as AppState['cards']) : {},
    attempts: Array.isArray(raw.attempts)
      ? (raw.attempts as AppState['attempts']).slice(-1000)
      : [],
    mastery: normalizeMastery(raw.mastery, now),
    notes: Array.isArray(raw.notes) ? (raw.notes as AppState['notes']) : [],
    essays: Array.isArray(raw.essays)
      ? (raw.essays as AppState['essays'])
      : [],
    diagnostic: isRecord(raw.diagnostic)
      ? (raw.diagnostic as unknown as AppState['diagnostic'])
      : null,
    sessions: Array.isArray(raw.sessions)
      ? (raw.sessions as AppState['sessions'])
      : [],
  }
}

export function migrateState(raw: unknown, now = new Date()): AppState {
  if (!isRecord(raw)) {
    throw new Error('バックアップの形式が正しくありません。')
  }
  const version =
    raw.schemaVersion === undefined ? 0 : Number(raw.schemaVersion)
  if (!Number.isInteger(version) || version < 0) {
    throw new Error('schemaVersion が正しくありません。')
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `このバックアップは新しい形式です（version ${version}）。`,
    )
  }
  if (version === 0) return migrateVersionZero(raw, now)
  return normalizeVersionOne(raw, now)
}
