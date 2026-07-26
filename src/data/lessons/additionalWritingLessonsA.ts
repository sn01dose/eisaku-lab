import { defineMiniLessons } from '../factories'

export const additionalWritingLessonsA = defineMiniLessons([
  {
    id: 'ls-0019',
    title: '三人称単数の s は主語から決める',
    skillIds: ['writing.agreement', 'writing.subjectVerb'],
    bodyMd:
      '現在の習慣や事実を書くとき、主語が he、she、it、または単数の名詞なら、一般動詞の形を確認します。My brother play ではなく My brother plays です。まず時制が現在かを確かめ、次に主語の中心語を一つ選びます。The number of students の中心は number なので is を使います。長い主語でも、動詞の直前の名詞だけに引かれないようにしてください。否定文と疑問文では does が変化を受け持つため、中心動詞は原形へ戻します。提出前は主語と動詞を線で結び、一組ずつ確認します。',
    examples: [
      { en: 'She studies English every day.', ja: '現在の習慣で、主語は三人称単数です。' },
      { en: 'Does the plan reduce waste?', ja: 'does の後の動詞は原形です。' },
    ],
    triggerTags: ['thirdPersonS'],
  },
  {
    id: 'ls-0020',
    title: '代名詞が指す相手を一つにする',
    skillIds: ['writing.paragraphStructure', 'writing.wordOrder'],
    bodyMd:
      'it、they、this などを使う前に、読み手が何を指すか一つに決められるか確認します。二つの複数名詞のあとに they を置くと、どちらを指すのか曖昧になることがあります。その場合は students や these devices のように名詞をもう一度書く方が安全です。また、単数の内容を受ける it と複数を受ける they の数もそろえます。日本語では省ける主語でも、英文の各文では必要な代名詞を補います。段落を読み返すときは代名詞に丸を付け、その直前に対応する名詞があるかを確かめてください。',
    examples: [
      { en: 'The students used tablets. They shared the results.', ja: 'They は the students を指します。' },
      { en: 'This rule is useful because it saves time.', ja: 'it は単数の this rule を受けます。' },
    ],
    triggerTags: ['pronoun'],
  },
  {
    id: 'ls-0021',
    title: '前置詞は場面と組み合わせで選ぶ',
    skillIds: ['writing.wordOrder', 'writing.translation'],
    bodyMd:
      '日本語の一つの助詞に、英語の前置詞を一対一で当てはめることはできません。場所なら点を示す at、内部を示す in、面への接触を示す on が基本ですが、実際には arrive at、interested in のように語との組み合わせも重要です。まず「場所」「時」「方向」「手段」のどの関係かを決め、次に動詞や形容詞と一緒に例文で確認します。迷った表現は高度な前置詞句へ直さず、go to the library のような確実な形へ言い換えて構いません。最後は前置詞だけでなく、その前後を一まとまりで読み直します。',
    examples: [
      { en: 'We arrived at the station at nine.', ja: '到着する場所と時刻に at を使います。' },
      { en: 'She is interested in local history.', ja: 'interested in を組み合わせで確認します。' },
    ],
    triggerTags: ['preposition'],
  },
  {
    id: 'ls-0022',
    title: '英作文中の綴りを復習へ戻す',
    skillIds: ['spelling.wordFamily', 'writing.translation'],
    bodyMd:
      '英作文で綴りを間違えた語は、その答案だけ直して終わらせません。まず内容が伝わっている点を残し、最も重要な一語だけを選びます。正しい形と自分の形を文字マスで比べ、母音、子音、接辞、例外のどのルートで確認するかを決めます。その後、語を隠して意味から入力し、翌日以降の復習カードへ戻します。反対に、英作文の流れの中で同じ語を正しく書けたときは、文脈からも再現できた証拠になります。単語練習と英作文を別々にせず、間違いと成功を両方向へつないでください。',
    examples: [
      { en: 'The project supports local businesses.', ja: 'supports と businesses の綴りを文脈で再現します。' },
      { en: 'Technology can improve access to education.', ja: '長い語も文の意味から思い出します。' },
    ],
    triggerTags: ['spelling'],
  },
  {
    id: 'ls-0023',
    title: '文末記号で考えの境界を示す',
    skillIds: ['writing.paragraphStructure', 'writing.connector'],
    bodyMd:
      'ピリオドや疑問符は飾りではなく、どこで一つの考えが終わるかを読み手に示します。主語と動詞を持つ内容を and やコンマだけで長くつなぐと、境界が分かりにくくなります。まず一文で伝える中心を一つにし、終わったらピリオドを置きます。直接の質問には疑問符を使い、文末記号の直後は大文字から始めます。略語や小数点のピリオドとは役割が違う点にも注意してください。提出前に各文の最後だけを順に見て、記号があり、その前が完成した文になっているか確認します。',
    examples: [
      { en: 'The bus was late. I walked to school.', ja: '二つの出来事をピリオドで分けます。' },
      { en: 'How can we reduce food waste?', ja: '直接の質問は疑問符で終えます。' },
    ],
    triggerTags: ['punctuation'],
  },
  {
    id: 'ls-0024',
    title: '大文字は文と名前の始まりに置く',
    skillIds: ['writing.paragraphStructure', 'writing.translation'],
    bodyMd:
      '大文字と小文字の違いは、単語の音ではなく文中の役割を示します。文の最初、固有名詞、曜日や月、代名詞 I は大文字で始めます。一方、普通名詞を強調したいという理由だけで大文字にはしません。まず文末記号を確認し、その次の文字が大文字かを見ます。次に、人名、地名、組織名など特定の名前を探します。すべての語を一度に見直すより、この二段階に分ける方が確実です。綴り自体が正しければ不正解扱いにはせず、内容を保ったまま表記だけを整えてください。',
    examples: [
      { en: 'I visited Kyoto in April.', ja: 'I、地名、月を大文字で始めます。' },
      { en: 'The class begins on Monday.', ja: '文頭と曜日を大文字にします。' },
    ],
    triggerTags: ['capitalization'],
  },
  {
    id: 'ls-0025',
    title: '主語と動詞の数をそろえる',
    skillIds: ['writing.agreement', 'writing.plural'],
    bodyMd:
      '主語が一つなら単数、複数なら複数として、現在形の動詞や be 動詞を対応させます。The students is ではなく The students are です。主語が長いときは、of の後ろの名詞ではなく中心となる名詞を見ます。One of the reasons の中心は One なので is が続きます。there is、there are では後ろの名詞の数を確認します。まず名詞の単数・複数を決め、それから動詞を選ぶ順番にしてください。段落を直すときは、すべての名詞ではなく各文の中心となる主語と動詞だけを一組ずつ点検します。',
    examples: [
      { en: 'These ideas are useful.', ja: '複数の主語に are を使います。' },
      { en: 'One of the reasons is cost.', ja: '中心語 One に合わせて is を使います。' },
    ],
    triggerTags: ['number', 'thirdPersonS'],
  },
])
