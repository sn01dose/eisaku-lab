# 英作ラボ

国語で考える力を、英語を自力で書く力へつなぐ、端末内完結型の学習アプリです。スペリングの想起、段階的な英作文、日本語の言い換え、間隔反復、間違いノートを一つの学習循環にまとめています。

## 必要環境

- Node.js 22.12 以上
- npm 10 以上
- Android Chrome、または最新のデスクトップブラウザー

外部API、アカウント、APIキーは不要です。学習データや答案を外部へ送信しません。

## インストールと起動

Windows PowerShell:

```powershell
Set-Location "C:\Users\shudi\Documents\New project\eisaku-lab"
npm install
npm run dev
```

表示された `Local` のURLをブラウザーで開いてください。

macOS / Linux:

```bash
cd /path/to/eisaku-lab
npm install
npm run dev
```

## 検証

Windows PowerShell:

```powershell
npm run test
npm run lint
npm run build
npm run preview
```

`npm run build` の成果物は `dist/` に作られます。

## 学習データの保存

履歴、復習カード、習熟度、答案、設定はブラウザーの `localStorage` に、キー `eisaku-lab:state` で保存されます。保存形式は `schemaVersion` 付きで、現在は version 1 です。同じブラウザー・同じサイトURLで再読み込みすると続きから再開できます。

ブラウザーのサイトデータを消すと履歴も消えます。設定画面または指導者モードの「JSONバックアップ」を定期的に保存してください。「JSONから復元」で同じ状態へ戻せます。進捗と解答履歴はCSVでも出力できます。

## 教材を追加する

教材は `src/data/` 以下に置き、画面へ直接書きません。

- スペリング: `src/data/spelling/`
- 短文・和文英訳と自由英作文: `src/data/writing/`
- 日本語言い換え: `src/data/simplification/`
- 診断: `src/data/diagnostics/`
- ミニレッスン: `src/data/lessons/`

既存の型に従ってデータを追加し、各 `index.ts` から公開します。追加後は `npm run test` を実行してください。ID重複、存在しない技能ID、綴りとチャンクの不一致、模範解答数などを検証します。詳しい執筆規約は `docs/CONTENT_GUIDE.md` を参照してください。

## AI添削連携を将来追加する

既定の添削は `src/services/feedback/localFeedback.ts` で端末内だけで行います。`FeedbackProvider` インターフェースは `src/services/feedback/types.ts` にあります。将来サーバー側に `/api/feedback` を用意した場合は `RemoteFeedbackProvider` へ差し替えられます。

APIキーはフロントエンドへ置かず、サーバー側だけで管理してください。現在の「AI添削用プロンプトをコピー」はクリップボードへ文章をコピーするだけで、外部送信はしません。

## GitHub Pagesで公開する

Viteの `base` は `/eisaku-lab/`、ルーターは `HashRouter` に設定済みです。リポジトリ名を変更する場合は `vite.config.ts` の `base` と `public/manifest.webmanifest` のパスも合わせてください。

1. GitHubで `eisaku-lab` リポジトリを作成します。
2. このフォルダーの内容をリポジトリへコミットしてpushします。
3. GitHubの **Settings → Pages → Build and deployment** で **GitHub Actions** を選びます。
4. `main` ブランチへのpush後、同梱の `.github/workflows/deploy-pages.yml` がテスト・lint・buildを行い、Pagesへ配置します。
5. 公開URL `https://<ユーザー名>.github.io/eisaku-lab/` を開きます。

このリポジトリからのcommit、push、公開操作は自動では行いません。
