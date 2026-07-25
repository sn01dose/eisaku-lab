# 教材追加ガイド

## 原則

教材はすべて `src/data/` に置きます。画面コンポーネントへ問題文や模範解答を直書きしません。共通型は `src/domain/learner/types.ts` だけを参照し、データ側で同じ型を再定義しません。教材の追加後は、画面を直さなくても `src/data/index.ts` の統合配列から利用できる状態を保ちます。

英文は高校生が実際に使える自然な表現にします。一つの日本語に対して語句を置換しただけの答えを増やすのではなく、構文または焦点が異なる自然な模範解答を最低2つ用意します。「正解は一つ」という見せ方を避けながら、現在のステージで再現可能な表現に抑えます。

教材テーマには、学校生活、部活動、読書、勉強法、スマートフォン、SNS、AI、環境、地域社会、ボランティア、観光、異文化理解、オンライン学習、将来の仕事、健康、科学技術、公共交通、教育制度を優先します。

## ID

| 種別 | 形式 | 現在の範囲 |
|---|---|---|
| スペリング | `sp-0001` | `sp-0001`〜`sp-0150` |
| 英作文 | `wr-0001` | 短文 `wr-0001`〜`wr-0100`、段落 `wr-0101`〜`wr-0125` |
| 日本語言い換え | `sj-0001` | `sj-0001`〜`sj-0020` |
| ミニレッスン | `ls-0001` | `ls-0001`〜`ls-0016` |
| 診断 | `dg-0001` | `dg-0001`〜`dg-0030` |

既存IDを変更すると保存済みの学習履歴が参照できなくなるため、削除や再採番はしません。末尾へ新しいIDを追加します。

## スペリング語を追加する

ステージ別ファイルは `src/data/spelling/stage1.ts` から `stage6.ts` です。各行は `SpellingSeed` の順序に従い、`makeSpellingWords` が完全な `SpellingWord` へ変換します。

必ず確認する項目:

- `chunks.join('')` が `word` と完全に一致する
- `acceptedAnswers` にはファクトリーが標準綴りを自動で含める
- `commonMistakes` は実際に起こりやすい誤りだけにする
- `chunkKind` は音節的な区切りなら `phonetic`、明確な語構成なら `morpheme`
- `chunkLabels` を付ける場合は `chunks` と同数にする
- 主ルート `strategy` は `sound`、`pattern`、`morpheme`、`irregular` の一つ
- 語源が曖昧な語を接頭辞・語幹へ無理に分けない
- 例文だけで意味と使い方が理解できるようにする

米英差を認める場合は、例として標準語 `color` の `acceptedAnswers` に `colour` を追加します。表示の標準語は一つに保ちます。

## 短文課題を追加する

`src/data/writing/shortStage*.ts` に `ShortWritingSeed` を追加します。支援を徐々に減らせるよう、同じステージでも次の形式を組み合わせます。

- `reorder`: 語順を作る
- `cloze`: 必要な形を補う
- `matching`: 二つの安全な型を対応させる
- `translateWithBank`: 語句バンク付き和文英訳
- `translateWithFrame`: 英文骨格付き和文英訳
- `translatePlain`: 日本語のみから英訳
- `combine`: 二文を論理関係でつなぐ
- `deliteralize`: 直訳しにくい日本語をほどく

`modelAnswers` は最低2つ、`requiredSkills` と `commonErrors` は共通型に存在する値だけを使います。`sentenceFrame` の空所は `______` に統一します。語句バンクは正解文の順番をそのまま並べず、学習者が語順を判断できるようにします。

## 段落・自由英作文を追加する

`src/data/writing/extendedStage*.ts` に `ExtendedWritingSeed` を追加します。`rubric` の語数はロードマップに合わせます。

- Stage 1: 20〜40語
- Stage 2: 40〜60語
- Stage 3: 60〜90語
- Stage 4: 80〜120語
- Stage 5: 100〜150語
- Stage 6: 120〜200語

課題文は、結論・理由・具体例・まとめのどれが必要かを明確にします。`needsReason`、`needsExample`、`needsConclusion` を実際の指示と一致させます。模範解答は賛成と反対、または異なる具体例を用意し、どちらの立場でも論理が成立することを示します。

## 日本語言い換えを追加する

`src/data/simplification/tasks.ts` に追加します。五つの観点から必要なものを `targetPoints` に指定します。

- `subject`: 主語を明確にする
- `oneIdea`: 一文に一つの内容
- `concrete`: 抽象語を具体化する
- `basicWords`: 難しい言い回しを基本語へ
- `connector`: 接続関係を明確にする

`modelSimplified` と `modelEn` はそれぞれ最低2つ用意します。情報を勝手に追加せず、元の主張・条件・程度を保ちます。簡単化は内容を幼くすることではなく、英語で安全に再構成できる単位へ分けることです。

## ミニレッスンを追加する

`src/data/lessons/` に追加します。本文は200〜400字、例は最低2つにします。一つのレッスンで直す点を増やしすぎず、誤りの原因と次に行う操作を説明します。`triggerTags` は同じ誤りが3回続いたときの起動条件です。似たタグを広く登録しすぎると無関係な場面で表示されるため、直接関係するタグだけを選びます。

## 診断を追加・変更する

`src/data/diagnostics/items.ts` では判定可能な `payload` を使います。問題形式ごとの必須項目は `DiagnosticItem` の判別Unionで型検査されます。診断時間を増やす場合は全体が15〜25分に収まるかを確認し、単純な選択問題だけでなく、想起によるディクテーション、短文英訳、短い意見文を残します。

診断IDを差し替えると中断データへ影響します。既存問題の軽微な文言修正以外は、新IDを追加して診断セットを移行する方法を選びます。

## 検証

PowerShell:

```powershell
Set-Location "C:\Users\shudi\Documents\New project\eisaku-lab"
npm run test
npm run lint
npm run build
```

教材検証テスト `src/tests/data/curriculumData.test.ts` は、数量、ステージ分布、ID重複、`skillId`、チャンク、模範解答、診断参照、プレースホルダを確認します。数量を意図的に増やした場合は「最低数量以上」を守ったうえで、期待値も同じ変更で更新します。

追加時の最終確認:

1. 英文を声に出して読み、不自然な直訳になっていないか
2. 模範解答同士に実質的な違いがあるか
3. 高校生にふさわしく、本人を低く扱う表現がないか
4. ステージ5・6にも継続して教材を追加しているか
5. `npm run test`、`npm run lint`、`npm run build` が成功するか
