import { defineMiniLessons } from '../factories'

export const additionalSpellingLessons = defineMiniLessons([
  {
    id: 'ls-0017',
    title: '余分な文字は入った理由を切り分ける',
    skillIds: ['spelling.wordFamily', 'spelling.irregular'],
    bodyMd:
      '正しい語にない文字を書いたときは、単に「一文字多い」で終わらせず、どこからその文字を補ったかを確認します。音を長く感じて母音を足したのか、似た語の形を混ぜたのか、語尾の規則を広く使いすぎたのかで、次の練習が変わります。まず余分な文字だけを琥珀のマスで見つけ、前後を含む三、四文字のまとまりを確認します。その後は正解を隠し、意味か音から一語全体を入力してください。削るだけの写しではなく、正しい文字数と並びをもう一度想起することが定着につながります。',
    examples: [
      { en: 'coming, not comming', ja: '語幹 come の形を確認してから -ing を付けます。' },
      { en: 'development, not developement', ja: 'develop と -ment の境界を確認します。' },
    ],
    triggerTags: ['insertion'],
  },
  {
    id: 'ls-0018',
    title: '入れ替わった二文字を一組で直す',
    skillIds: ['spelling.vowelTeam', 'spelling.wordFamily'],
    bodyMd:
      '隣り合う二文字の順序が逆になった場合、片方ずつ独立して覚え直すより、正しい二文字を一つの並びとして確認します。receive の ei や friend の ie のように、似た母音字は特に順序が揺れやすい部分です。ただし、すべての語に使える短い規則を作るのではなく、その語の正しい形を基準にします。差分表示の弧で入れ替わった位置を見たら、前後一文字を含めたまとまりを読み、答えを隠します。最後に語全体を入力し、翌日も同じ順序を音や意味から再現できるか確かめてください。',
    examples: [
      { en: 'receive: cei, not cie', ja: 'c の後を含む三文字で順序を確認します。' },
      { en: 'friend: rie, not rei', ja: '中央の三文字を一まとまりで保持します。' },
    ],
    triggerTags: ['transposition'],
  },
])
