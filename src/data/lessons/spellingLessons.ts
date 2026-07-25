import { defineMiniLessons } from '../factories'

export const spellingMiniLessons = defineMiniLessons([
  {
    id: 'ls-0001',
    title: '母音は「音」と「型」を両方見る',
    skillIds: ['spelling.shortVowel', 'spelling.longVowel'],
    bodyMd:
      '母音の音だけを頼りにすると、同じように聞こえるつづりで迷うことがあります。まず聞こえた母音を手がかりに候補を出し、次に語の型を確認します。短母音のあとに子音が続く plan や stop と、語末の e が前の母音を長くする make や hope を比べましょう。ただし、この型ですべての語を説明することはできません。規則に合わない語は例外として覚え、無理に規則へ当てはめないことが大切です。最後は答えを隠し、音か意味から一語全体を思い出して入力します。',
    examples: [
      { en: 'plan / plane', ja: '計画／飛行機・平面' },
      { en: 'hop / hope', ja: '跳ぶ／望む' },
    ],
    triggerTags: ['vowelChoice', 'soundToLetter'],
  },
  {
    id: 'ls-0002',
    title: '見えない文字を位置で覚える',
    skillIds: ['spelling.silentLetter'],
    bodyMd:
      '発音されない文字は、聞き取りだけでは再現できません。know の k、write の w、could の l のように、どの位置に見えない文字があるかを語全体の形で確認します。silent e は make や time のように前の母音と関係する場合がありますが、すべての無音文字が同じ働きをするわけではありません。文字マスで無音文字の位置に印を置く気持ちで見たあと、答えを隠して入力してください。脱落したら、語全体を何度も写すより、その位置を含む短いまとまりを確認してから再び想起します。',
    examples: [
      { en: 'know', ja: '語頭の k は発音しません。' },
      { en: 'could', ja: 'l は発音しませんが、つづりに残ります。' },
    ],
    triggerTags: ['silentLetter', 'omission'],
  },
  {
    id: 'ls-0003',
    title: '母音チームを一まとまりにする',
    skillIds: ['spelling.vowelTeam'],
    bodyMd:
      '二つ以上の母音字が一つの音に関わるときは、文字をばらばらにせずチームとして見ます。read の ea、receive の ei、school の oo が例です。同じ音に複数のつづりがあり、同じつづりでも発音が変わるため、音だけの万能規則にはできません。そこで「その語ではどのチームか」を例文と一緒に覚えます。誤った母音を選んだら、正解の二文字を確認し、単語を隠してもう一度入力します。似た語と比べるときも、根拠のない語呂ではなく実際のつづりを基準にします。',
    examples: [
      { en: 'receive', ja: 'c の後の ei を一まとまりで確認します。' },
      { en: 'learn', ja: 'ear の三文字を切り離さずに見ます。' },
    ],
    triggerTags: ['vowelChoice', 'soundToLetter'],
  },
  {
    id: 'ls-0004',
    title: '子音を重ねる条件を確かめる',
    skillIds: ['spelling.doubleConsonant', 'spelling.inflection'],
    bodyMd:
      '短い母音のあとに一つの子音で終わる語へ -ing や -ed を付けるとき、最後の子音を重ねる場合があります。run → running、plan → planned が代表です。一方、read → reading のように母音の条件が違う語や、help → helped のように子音が連続する語では重ねません。まず語幹を確認し、次に語尾を付ける二段階で考えましょう。二重子音の過不足が起きたら、完成語だけでなく「語幹｜語尾」の境界を見てから、答えを隠して再入力します。',
    examples: [
      { en: 'run + ing → running', ja: '最後の n を重ねます。' },
      { en: 'help + ed → helped', ja: 'p を重ねません。' },
    ],
    triggerTags: ['doubleConsonant', 'inflection'],
  },
  {
    id: 'ls-0005',
    title: '接尾辞を固定した部品として扱う',
    skillIds: ['spelling.suffix', 'spelling.wordFamily'],
    bodyMd:
      '長い語は、語幹と接尾辞に分けると再現しやすくなります。development は develop + -ment、useful は use + -ful、education は educa + -tion と見ます。接尾辞は意味や品詞の手がかりにもなりますが、語幹の形が変わる語もあるため、実際の語構成が明確なものだけを扱います。語尾で間違えたら、最後の数文字だけを写して終わらせません。「語幹がどこまでか」「接尾辞は何か」を声に出さず確認し、単語全体を隠してつなぎ直してください。',
    examples: [
      { en: 'develop + ment', ja: '動詞から名詞を作ります。' },
      { en: 'use + ful', ja: '「〜に満ちた・〜する性質」の形容詞です。' },
    ],
    triggerTags: ['suffix', 'omission'],
  },
  {
    id: 'ls-0006',
    title: '接頭辞と語幹の境界を見る',
    skillIds: ['spelling.prefix', 'spelling.wordFamily'],
    bodyMd:
      '接頭辞は語の前に付き、意味の方向を加えます。re- は「再び」、dis- は否定や分離、in- は中へ、または否定を表すことがあります。receive や support のように、現代英語で語幹の意味を直感的に分けにくい語もあります。その場合は無理な語源説明を作らず、つづりの区切りとして利用します。語頭を取り違えたときは、最初の二、三文字と残りの境界を確認し、その後で一語全体を意味から思い出して入力してください。',
    examples: [
      { en: 're + new + able', ja: '再び＋新しくする＋可能な' },
      { en: 'in + equal + ity', ja: '否定＋等しい＋状態' },
    ],
    triggerTags: ['prefix', 'consonantChoice'],
  },
  {
    id: 'ls-0007',
    title: '語形変化は語幹から組み立てる',
    skillIds: ['spelling.inflection', 'spelling.doubleConsonant'],
    bodyMd:
      '活用した形を一語ずつ別に暗記する前に、語幹へ何が起きたかを確認します。study → studied では y を i に変えて -ed、catch → catches では音を作るため -es、plan → planned では最後の子音を重ねます。ただし不規則形はこの手順で作れないため、別の例外ルートで覚えます。誤りが起きたら「語幹を正しく書けたか」「語尾を正しく選んだか」を分けて判定し、最後は変化後の語全体を想起してください。',
    examples: [
      { en: 'study → studied', ja: '子音字＋y を i に変えて -ed を付けます。' },
      { en: 'catch → catches', ja: '語尾に -es を付けます。' },
    ],
    triggerTags: ['inflection', 'doubleConsonant'],
  },
  {
    id: 'ls-0008',
    title: '例外語は例外として管理する',
    skillIds: ['spelling.irregular', 'spelling.silentLetter'],
    bodyMd:
      'enough、people、rhythm のような語は、聞こえた音を通常の対応だけで文字に戻すのが難しい語です。ここで根拠のない語呂や疑似語源を作ると、別の語で混乱することがあります。例外語は、音、文字の並び、短い例文の三つを一組にして記録します。まず正しい形を文字マスで見て、注意する位置を一つだけ選びます。その後は形を隠し、意味や音から入力します。間違えた位置を確認し、翌日、三日後、七日後にもう一度思い出すことで定着させます。',
    examples: [
      { en: 'enough', ja: '語末の ough を一まとまりで保持します。' },
      { en: 'rhythm', ja: '母音字として働く y の位置を確認します。' },
    ],
    triggerTags: ['irregular', 'notRecalled'],
  },
])
