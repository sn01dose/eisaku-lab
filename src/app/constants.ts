export const APP_NAME = '英作ラボ'
export const APP_TAGLINE = '国語の強さを、英語を書く力へ。'

export const STAGES = [
  {
    id: 1,
    name: '土台をつくる',
    target: '基本語を見ないで書き、主語と動詞のある文を組み立てます。',
    words: '20〜40語',
  },
  {
    id: 2,
    name: '文の骨格を固める',
    target: '基本文型と不定詞・動名詞・比較を安全に使います。',
    words: '40〜60語',
  },
  {
    id: 3,
    name: '文をつなぐ',
    target: '結論・理由・具体例を短い英文でつなぎます。',
    words: '60〜90語',
  },
  {
    id: 4,
    name: '意見を組み立てる',
    target: '賛否と根拠を決め、簡単な日本語を経て英語にします。',
    words: '80〜120語',
  },
  {
    id: 5,
    name: '抽象的な内容を書く',
    target: '教育・環境・技術などを、対比や因果で説明します。',
    words: '100〜150語',
  },
  {
    id: 6,
    name: '難関大実戦',
    target: '和文英訳・要約・条件英作文を時間内に仕上げます。',
    words: '120〜200語',
  },
] as const

export const GOAL_LABELS = {
  foundation: '土台から書けるようにする',
  commonTest: '共通テスト後の記述に備える',
  university: '大学入試の英作文に備える',
  selective: '難関大の記述に備える',
} as const
