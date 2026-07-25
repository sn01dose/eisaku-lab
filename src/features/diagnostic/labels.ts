import type { DiagnosticItem } from '../../domain/learner/types'

export const DIAGNOSTIC_SECTION_LABELS: Record<
  DiagnosticItem['section'],
  string
> = {
  spellChoice: '綴りの見分け',
  dictation: '音から綴る',
  fillLetters: '文字を補う',
  chunking: 'まとまりを捉える',
  basicTranslate: '基本英文を作る',
  reorder: '語順を組み立てる',
  shortOpinion: '意見をまとめる',
}
