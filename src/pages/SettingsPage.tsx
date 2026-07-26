import { useState, type ChangeEvent } from 'react'
import { useAppState } from '../app/providers/AppStateProvider'
import { Button, Card, EmptyState, PageHeader } from '../components'
import type { LearnerProfile } from '../domain/learner/types'
import {
  exportStateToJson,
  importStateFromJson,
} from '../services/export'
import { useSpeech } from '../services/speech'
import '../styles/secondary-pages.css'

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function saveBackup(content: string): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'application/json;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `eisaku-lab-backup-${dateStamp()}.json`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function SettingsPage(): React.JSX.Element {
  const { state, updateState, replaceState, clearData } = useAppState()
  const speech = useSpeech()
  const [transferMessage, setTransferMessage] = useState('')
  const [speechMessage, setSpeechMessage] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const profile = state.profile

  const updateProfile = (patch: Partial<LearnerProfile>) => {
    updateState((previous) => ({
      ...previous,
      profile: previous.profile
        ? { ...previous.profile, ...patch }
        : previous.profile,
    }))
  }

  const testSpeech = async () => {
    setSpeechMessage('')
    const started = await speech.test()
    setSpeechMessage(
      started
        ? '音声を再生しました。聞こえれば準備完了です。'
        : 'この環境では音声を再生できません。意味から答える練習は利用できます。',
    )
  }

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    try {
      replaceState(importStateFromJson(await file.text()))
      setTransferMessage('バックアップを復元しました。')
      setConfirmingClear(false)
    } catch {
      setTransferMessage(
        '読み込めませんでした。英作ラボのJSONバックアップを選んでください。',
      )
    } finally {
      input.value = ''
    }
  }

  return (
    <div className="secondary-page">
      <PageHeader
        eyebrow="設定｜学び方とデータ"
        title="設定"
        description="学習時間、音声、端末内の記録を管理します。"
      />

      <div className="section-stack">
        {!profile ? (
          <EmptyState
            title="学習設定がまだありません"
            message="初回設定を済ませると、学習時間や音声をここで変更できます。"
            action={
              <a
                className="button button--primary button--full"
                href="#/onboarding"
              >
                初回設定へ進む
              </a>
            }
          />
        ) : (
          <>
            <Card label="学習｜1日の目安" title="学習時間">
              <fieldset className="choice-fieldset">
                <legend>1日に取り組む時間を選んでください</legend>
                <div className="choice-row">
                  {([15, 30, 45] as const).map((minutes) => (
                    <label className="choice-option" key={minutes}>
                      <input
                        type="radio"
                        name="daily-minutes"
                        value={minutes}
                        checked={profile.dailyMinutes === minutes}
                        onChange={() => updateProfile({ dailyMinutes: minutes })}
                      />
                      <span>{minutes}分</span>
                    </label>
                  ))}
                </div>
                <p className="control-help">
                  問題数だけを調整し、学習内容の比率は変わりません。
                </p>
              </fieldset>
            </Card>

            <Card label="音声｜端末の読み上げ" title="英語音声">
              <label className="toggle-row">
                <span>
                  <strong>音声を使う</strong>
                  <small>
                    スペリングで通常・ゆっくりの読み上げを利用します。
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={profile.useSpeech}
                  onChange={(event) =>
                    updateProfile({ useSpeech: event.target.checked })
                  }
                />
              </label>
              <Button
                variant="secondary"
                fullWidth
                disabled={!speech.supported || speech.speaking}
                onClick={() => void testSpeech()}
              >
                {speech.speaking ? '音声を再生中です' : '音声をテスト'}
              </Button>
              {!speech.supported && (
                <p className="control-help">
                  この環境では音声が利用できません。意味から入力する練習はそのまま使えます。
                </p>
              )}
              <p className="transfer-message" aria-live="polite">
                {speech.error ?? speechMessage}
              </p>
            </Card>

            <Card label="目標｜予定を立てる" title="目標日">
              <label className="control-field">
                <span>目標日</span>
                <input
                  type="date"
                  value={profile.targetDate ?? ''}
                  onChange={(event) =>
                    updateProfile({ targetDate: event.target.value || null })
                  }
                />
                <small>
                  未設定でも利用できます。期限による催促は行いません。
                </small>
              </label>
            </Card>
          </>
        )}

        <Card label="共有｜本人が内容を選ぶ" title="学習レポート">
          <p className="settings-description">
            今週または直近2週間の集計を、OSの共有機能かクリップボードで渡せます。
          </p>
          <a
            className="button button--secondary button--full"
            href="#/report"
          >
            送る内容を確認
          </a>
          <p className="privacy-note">
            レポートは自動では送られません。送る内容は毎回、送る前に全文を確認できます。
          </p>
        </Card>

        <Card label="指導者向け｜通常画面と分離" title="指導者モード">
          <p className="settings-description">
            技能別の習熟度、解答履歴、支援レベルの調整、CSV出力を確認できます。
          </p>
          <a
            className="button button--secondary button--full"
            href="#/teacher"
          >
            指導者モードを開く
          </a>
        </Card>

        <Card label="管理｜この端末の記録" title="バックアップと復元">
          <p className="settings-description">
            ブラウザのデータを消す前や、別の端末へ移る前に保存してください。
          </p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              saveBackup(exportStateToJson(state))
              setTransferMessage('JSONバックアップを保存しました。')
            }}
          >
            JSONバックアップを保存
          </Button>
          <label className="file-control">
            <span>JSONバックアップを復元</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(event) => void restoreBackup(event)}
            />
          </label>
          <p className="privacy-note">
            学習データはこの端末内だけで扱い、外部へ送信しません。
          </p>
          <p className="transfer-message" aria-live="polite">
            {transferMessage}
          </p>
        </Card>

        <Card
          className="danger-zone"
          label="管理｜取り消せない操作"
          title="すべてのデータを削除"
        >
          <p className="settings-description">
            初回設定、学習履歴、復習予定、保存した英作文をこの端末から削除します。
          </p>
          {!confirmingClear ? (
            <Button
              variant="danger"
              fullWidth
              onClick={() => setConfirmingClear(true)}
            >
              削除内容を確認
            </Button>
          ) : (
            <div className="inline-confirmation" role="group" aria-label="削除確認">
              <p>
                この操作は元に戻せません。必要なら先にバックアップを保存してください。
              </p>
              <div className="button-grid button-grid--two">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmingClear(false)}
                >
                  削除をやめる
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    clearData()
                    setConfirmingClear(false)
                    setTransferMessage('この端末の学習データを削除しました。')
                  }}
                >
                  すべて削除
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
