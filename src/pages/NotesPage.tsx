import { useMemo, useState } from 'react'
import { useAppState } from '../app/providers/AppStateProvider'
import {
  Button,
  Card,
  EmptyState,
  LetterCells,
  PageHeader,
} from '../components'
import { spellingWords } from '../data'
import type {
  MistakeNote,
  SpellingErrorTag,
  WritingErrorTag,
} from '../domain/learner/types'
import '../styles/secondary-pages.css'

type NoteFilter = 'active' | 'all' | 'conquered'

const KIND_LABELS: Record<MistakeNote['kind'], string> = {
  spelling: 'スペル',
  writing: '英作文',
  simplification: '日本語言い換え',
}

const ERROR_LABELS: Record<SpellingErrorTag | WritingErrorTag, string> = {
  vowelChoice: '母音の選択',
  consonantChoice: '子音の選択',
  doubleConsonant: '子音の重なり',
  silentLetter: '発音しない文字',
  omission: '文字の抜け',
  insertion: '余分な文字',
  transposition: '文字の入れ替わり',
  prefix: '接頭辞',
  suffix: '接尾辞',
  inflection: '語形変化',
  irregular: '例外的な綴り',
  soundToLetter: '音と文字の対応',
  notRecalled: '思い出し方',
  missingSubject: '主語',
  missingVerb: '動詞',
  wordOrder: '語順',
  tense: '時制',
  thirdPersonS: '三単現の s',
  number: '単数・複数',
  article: '冠詞',
  pronoun: '代名詞',
  preposition: '前置詞',
  conjunction: '接続語',
  fragment: '文の骨格',
  runOn: '文の区切り',
  literalTranslation: '直訳',
  wordChoice: '語の選び方',
  spelling: 'スペリング',
  punctuation: '文末記号',
  capitalization: '大文字・小文字',
}

function formatNoteDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '日付未設定'
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

export function NotesPage(): React.JSX.Element {
  const { state, updateState } = useAppState()
  const [filter, setFilter] = useState<NoteFilter>('active')
  const visibleNotes = useMemo(
    () =>
      [...state.notes]
        .filter((note) => {
          if (filter === 'active') return !note.conquered
          if (filter === 'conquered') return note.conquered
          return true
        })
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
    [filter, state.notes],
  )

  const toggleConquered = (noteId: string) => {
    updateState((previous) => ({
      ...previous,
      notes: previous.notes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              conquered: !note.conquered,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    }))
  }

  return (
    <div className="secondary-page">
      <PageHeader
        eyebrow="記録｜原因から見直す"
        title="間違いノート"
        description="直す点を一つずつ確認し、できるようになった項目を整理します。"
      />

      <div className="filter-row" aria-label="ノートの表示">
        {(
          [
            ['active', '復習中'],
            ['all', 'すべて'],
            ['conquered', '克服済み'],
          ] as const
        ).map(([value, label]) => (
          <button
            className="filter-chip"
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleNotes.length === 0 ? (
        <EmptyState
          title={
            state.notes.length === 0
              ? 'まだ記録はありません'
              : 'この条件の記録はありません'
          }
          message={
            state.notes.length === 0
              ? '今日の学習を始めると、確認したい点がここに整理されます。'
              : '表示を「すべて」にすると、ほかの記録を確認できます。'
          }
          action={
            state.notes.length === 0 ? (
              <a className="button button--primary button--full" href="#/today">
                今日の学習を始める
              </a>
            ) : (
              <Button fullWidth onClick={() => setFilter('all')}>
                すべて表示する
              </Button>
            )
          }
        />
      ) : (
        <div className="note-list">
          {visibleNotes.map((note) => {
            const word =
              note.kind === 'spelling'
                ? spellingWords.find((item) => item.id === note.refId)
                : undefined

            return (
              <Card
                className={note.conquered ? 'note-card note-card--done' : 'note-card'}
                label={`${KIND_LABELS[note.kind]}｜${ERROR_LABELS[note.primaryErrorTag]}`}
                key={note.id}
              >
                <div className="note-card__meta">
                  <span>{formatNoteDate(note.updatedAt)} 更新</span>
                  <span>{note.occurrenceCount}回確認</span>
                  {note.conquered && (
                    <span className="status-pill status-pill--stable">
                      克服済み
                    </span>
                  )}
                </div>

                {note.kind === 'spelling' ? (
                  <LetterCells
                    mode="graded"
                    value={note.input}
                    correctAnswer={note.correction}
                    chunks={word?.chunks}
                    chunkLabels={word?.chunkLabels}
                    feedback={
                      note.conquered
                        ? '思い出せる状態になりました。必要なら復習へ戻せます。'
                        : 'できている部分を残し、印のある文字を確認しましょう。'
                    }
                  />
                ) : (
                  <div className="note-comparison">
                    <div>
                      <p className="field-label">書いた内容</p>
                      <p className="en-reading">{note.input || '無回答'}</p>
                    </div>
                    <div>
                      <p className="field-label">確認する表現</p>
                      <p className="en-reading">{note.correction}</p>
                    </div>
                  </div>
                )}

                <div className="tag-list" aria-label="確認する項目">
                  {note.errorTags.map((tag) => (
                    <span className="quiet-tag" key={tag}>
                      {ERROR_LABELS[tag]}
                    </span>
                  ))}
                </div>

                <Button
                  variant={note.conquered ? 'secondary' : 'primary'}
                  fullWidth
                  onClick={() => toggleConquered(note.id)}
                >
                  {note.conquered ? '復習中に戻す' : '克服済みにする'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
