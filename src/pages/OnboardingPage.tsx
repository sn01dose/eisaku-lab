import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE, GOAL_LABELS } from '../app/constants'
import { useAppState } from '../app/providers/AppStateProvider'
import { AppShell, Button, Card, PageHeader } from '../components'
import type { LearnerProfile } from '../domain/learner/types'
import { isSpeechSupported } from '../services/speech'
import '../styles/diagnostic-pages.css'

type Goal = LearnerProfile['goal']

function localDateKey(date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function OnboardingPage(): React.JSX.Element {
  const { state, updateState } = useAppState()
  const navigate = useNavigate()
  const speechSupported = isSpeechSupported()
  const existing = state.profile
  const [nickname, setNickname] = useState(existing?.nickname ?? '')
  const [dailyMinutes, setDailyMinutes] = useState<15 | 30 | 45>(
    existing?.dailyMinutes ?? 30,
  )
  const [goal, setGoal] = useState<Goal>(existing?.goal ?? 'university')
  const [useSpeech, setUseSpeech] = useState(
    speechSupported && (existing?.useSpeech ?? true),
  )
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? '')
  const [startDiagnostic, setStartDiagnostic] = useState(true)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const now = new Date().toISOString()
    const profile: LearnerProfile = {
      nickname: nickname.trim(),
      dailyMinutes,
      goal,
      useSpeech: speechSupported && useSpeech,
      targetDate: targetDate || null,
      currentStage: existing?.currentStage ?? 1,
      recommendedStage: existing?.recommendedStage ?? 1,
      supportLevel: existing?.supportLevel ?? 1,
      createdAt: existing?.createdAt ?? now,
    }
    updateState((previous) => ({
      ...previous,
      profile,
      diagnostic:
        startDiagnostic && previous.diagnostic?.completedAt
          ? null
          : previous.diagnostic,
    }))
    navigate(startDiagnostic ? '/diagnostic' : '/', { replace: true })
  }

  return (
    <AppShell hideNavigation mainClassName="setup-page">
      <PageHeader
        eyebrow={APP_NAME}
        title="はじめの設定"
        description={APP_TAGLINE}
      />

      <p className="setup-page__lead">
        発想する力は、すでにあります。学習量と支援の出し方を、
        あなたに合わせます。
      </p>

      <form className="lab-form" onSubmit={handleSubmit}>
        <Card label="プロフィール" title="呼び方を決めます">
          <label className="lab-field">
            <span className="lab-field__label">ニックネーム</span>
            <input
              autoComplete="nickname"
              className="lab-input"
              maxLength={20}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="例：なぎ"
              required
              value={nickname}
            />
          </label>
        </Card>

        <Card label="学習時間" title="1日の目安">
          <fieldset className="lab-choice-group">
            <legend className="sr-only">1日の学習時間</legend>
            <div className="lab-segments">
              {([15, 30, 45] as const).map((minutes) => (
                <label className="lab-segment" key={minutes}>
                  <input
                    checked={dailyMinutes === minutes}
                    name="dailyMinutes"
                    onChange={() => setDailyMinutes(minutes)}
                    type="radio"
                  />
                  <span>{minutes}分</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="lab-field__note">
            復習・スペリング・英作文の比率を保って問題数を調整します。
          </p>
        </Card>

        <Card label="目標" title="力を使いたい場面">
          <fieldset className="lab-choice-group">
            <legend className="sr-only">学習目標</legend>
            <div className="lab-option-list">
              {(Object.entries(GOAL_LABELS) as Array<[Goal, string]>).map(
                ([value, label]) => (
                  <label className="lab-option" key={value}>
                    <input
                      checked={goal === value}
                      name="goal"
                      onChange={() => setGoal(value)}
                      type="radio"
                    />
                    <span>{label}</span>
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <label className="lab-field">
            <span className="lab-field__label">目標日（任意）</span>
            <input
              className="lab-input"
              min={localDateKey()}
              onChange={(event) => setTargetDate(event.target.value)}
              type="date"
              value={targetDate}
            />
          </label>
        </Card>

        <Card label="音声" title="英語を聞く練習">
          <label className="lab-check">
            <input
              checked={useSpeech}
              disabled={!speechSupported}
              onChange={(event) => setUseSpeech(event.target.checked)}
              type="checkbox"
            />
            <span>端末の英語音声を使います</span>
          </label>
          <p className="lab-field__note">
            {speechSupported
              ? '音声は端末内の読み上げ機能を使います。後から変更できます。'
              : 'この環境では音声を確認できないため、意味から答える問題を使います。'}
          </p>
        </Card>

        <Card label="開始位置" title="診断を今行いますか">
          <fieldset className="lab-choice-group">
            <legend className="sr-only">診断を始める時期</legend>
            <div className="lab-option-list">
              <label className="lab-option">
                <input
                  checked={startDiagnostic}
                  name="diagnosticTiming"
                  onChange={() => setStartDiagnostic(true)}
                  type="radio"
                />
                <span>
                  今行います
                  <small>約20分・途中から再開できます</small>
                </span>
              </label>
              <label className="lab-option">
                <input
                  checked={!startDiagnostic}
                  name="diagnosticTiming"
                  onChange={() => setStartDiagnostic(false)}
                  type="radio"
                />
                <span>
                  あとで行います
                  <small>まずホームを確認します</small>
                </span>
              </label>
            </div>
          </fieldset>
        </Card>

        <div className="lab-form__action">
          <Button fullWidth type="submit">
            設定を保存して進む
          </Button>
        </div>
      </form>
    </AppShell>
  )
}

export default OnboardingPage
