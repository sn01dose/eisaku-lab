# 学習データ設計

## 参照元

共通型の唯一の定義元は `src/domain/learner/types.ts` です。教材は `src/data/`、学習者の状態はストレージサービスを通して保存します。UIは教材と保存状態をIDで結び、教材本文を保存データへ複製しません。

## 教材

### `SpellingWord`

`id` は `sp-` で始まる不変の参照キーです。`strategy` は主な学習ルート、`chunks` は画面の文字マス下に示すまとまり、`chunkKind` は音の区切りか形態素かを示します。`acceptedAnswers` は正規化後に許容する綴り、`commonMistakes` は教材内の既知誤りを逆引きして英作文フィードバックへ接続するために使います。

不変条件:

- `chunks.join('') === word`
- `acceptedAnswers.includes(word)`
- `chunkLabels` がある場合は `chunkLabels.length === chunks.length`
- `skillIds` は `ALL_SKILL_IDS` に含まれる

### `WritingTask`

短文と段落は同じ型を使い、`type` と `rubric` で振る舞いを変えます。`modelAnswers` は複数の自然な表現を許容します。`requiredSkills` は習熟度更新と今日の学習生成、`commonErrors` はフィードバックとミニレッスン選択に使います。

短文は `wr-0001`〜`wr-0100`、段落課題は `wr-0101` 以降です。区間は運用上の区別であり、型の意味ではありません。画面では `extendedWritingTasks` と `shortWritingTasks` を利用し、全体検索には `writingTasks` を利用します。

### `SimplificationTask`

`originalJa` を五つの `targetPoints` で分析し、複数の `modelSimplified` と任意の `modelEn` を示します。改行は一文一内容を視覚的に示すため、文字列内の `\n` として保持します。

### `MiniLesson`

`triggerTags` と直近の誤り履歴を照合し、同じ誤りが3回続いた場合に提示します。`bodyMd` は200〜400字です。本文をHTMLとして信頼せず、Markdown表示を導入する場合も安全なレンダラーを通します。

### `DiagnosticItem`

`section` を判別子とするUnionです。`payload` を読む前に `section` で分岐します。

| section | payloadの中心 |
|---|---|
| `spellChoice` | 選択肢と正答 |
| `dictation` | 正答、意味、任意の語ID |
| `fillLetters` | 穴あき表示と完全な正答 |
| `chunking` | 語、正しいチャンク、選択肢 |
| `basicTranslate` | 日本語と複数の模範解答 |
| `reorder` | トークンと複数の模範解答 |
| `shortOpinion` | 日本語課題、模範解答、語数等のrubric |

## 学習者状態

`AppState` は必ず `schemaVersion` を持ちます。

| フィールド | 役割 |
|---|---|
| `profile` | 学習時間、目標、現在・推奨ステージ、支援レベル |
| `cards` | 間隔反復カード。キーはカードID |
| `attempts` | 解答履歴。直近1000件に制限 |
| `mastery` | `SkillId` ごとの得点、正解日、安定判定 |
| `notes` | 原因別の間違いノート |
| `essays` | 保存した英作文とローカルフィードバック |
| `diagnostic` | 中断・再開可能な診断状態 |
| `sessions` | 今日の学習の項目、進行位置、完了状態 |

`Attempt.isRecall` は想起と写しを区別します。この値は習熟度更新の重みに使うため、表示モードから推測して後付けせず、解答時点で記録します。

## ID参照

| 状態 | 参照先 |
|---|---|
| `ReviewCard.refId` | spellingなら `SpellingWord.id`、writingなら `WritingTask.id`、simplificationなら `SimplificationTask.id` |
| `Attempt.refId` | `kind` に対応する教材IDまたは診断ID |
| `SavedEssay.taskId` | `WritingTask.id` |
| `MistakeNote.refId` | `kind` に対応する教材ID |
| `SessionItem.refId` | `kind` に対応する教材IDまたはミニレッスンID |

教材IDは保存データとの外部キーです。公開後の再採番や別教材への再利用を禁止します。教材を廃止する場合も、既存履歴を表示できるようにIDと最小限の参照情報を保持する方針とします。

## データ集約

`src/data/index.ts` は次を安定した名前で公開します。

- `spellingWords`
- `shortWritingTasks`
- `extendedWritingTasks`
- `writingTasks`
- `simplificationTasks`
- `miniLessons`
- `diagnosticItems`
- `dataCounts`
- `countByStage`

各種の `*ById` は `Map` で、画面やセッション項目からの参照に使えます。教材配列は起動時に生成される静的データであり、変更をlocalStorageへ書き戻しません。

## 保存と移行

保存時は完全な `AppState` を一つのストレージ層から読み書きします。ページが個別にlocalStorageへアクセスしません。読み込み時は次の順です。

1. JSONとして解析できるか確認する
2. `schemaVersion` を確認する
3. 版ごとの移行関数を順番に適用する
4. 現行形として必須フィールドを検証する
5. 不正なデータなら既定状態へ安全に戻し、元データを勝手に上書きしない

JSONバックアップは `schemaVersion` を含む `AppState` 全体です。CSVは閲覧・集計用で、復元形式には使いません。教材そのものはアプリのビルドに含まれるため、バックアップへ重複して含めません。

## 検証責務

`src/tests/data/curriculumData.test.ts` は教材の静的な不変条件を検証します。ストレージの往復、版移行、1000件制限はストレージサービスのテスト、間隔反復と習熟度はdomainの純粋関数テストが担当します。型検査だけではID重複やチャンク結合を検出できないため、教材検証テストを削除しません。
