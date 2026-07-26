import { defineMiniLessons } from '../factories'

export const additionalWritingLessonsB = defineMiniLessons([
  {
    id: 'ls-0026',
    title: '不定詞と動名詞を動詞の型で選ぶ',
    skillIds: ['writing.infinitive', 'writing.gerund'],
    bodyMd:
      'to do と doing はどちらも日本語で「すること」と訳せますが、前の動詞によって選ぶ形が変わります。want、decide、hope の後は to do、enjoy、finish、avoid の後は doing が基本です。すべてを意味だけで決めず、want to study や enjoy reading のように動詞と後続の形を一組で覚えます。主語として一般的な活動を置く場合は Reading is useful のような動名詞が安全です。迷ったら、すでに学んだ組み合わせへ言い換えてください。最後に中心動詞が二つ並んでいないかを確認します。',
    examples: [
      { en: 'I decided to join the volunteer group.', ja: 'decide の後は to 不定詞です。' },
      { en: 'She enjoys reading science books.', ja: 'enjoy の後は動名詞です。' },
    ],
    triggerTags: ['wordChoice'],
  },
  {
    id: 'ls-0027',
    title: '関係詞は二つの短文から組み立てる',
    skillIds: ['writing.relativeClause', 'writing.wordOrder'],
    bodyMd:
      '関係詞を使う前に、伝えたい内容を二つの短文にします。I met a student. She studies robots. の共通部分 a student と she を確認し、I met a student who studies robots. とつなぎます。人なら who、物なら which、どちらにも使える that が候補ですが、まず先行詞の直後に説明を置く語順を守ります。長くなって主語や動詞を見失うなら、無理につながず二文のままで構いません。完成後は、主節と関係節のそれぞれに動詞があるか、関係詞が何を説明するかを確認してください。',
    examples: [
      { en: 'I met a student who studies robots.', ja: 'who は a student を説明します。' },
      { en: 'This is the book that changed my view.', ja: 'that 以下が the book を説明します。' },
    ],
    triggerTags: ['fragment', 'runOn'],
  },
  {
    id: 'ls-0028',
    title: '要約では主張と支えを分ける',
    skillIds: ['writing.summary', 'writing.paragraphStructure'],
    bodyMd:
      '要約は原文の文を短く写す作業ではありません。まず筆者が最も伝えたい主張を一文で決め、その主張を支える理由や結果を一つか二つ選びます。細かな例、固有名詞、同じ内容の繰り返しは、中心を理解するために必要でなければ省きます。原文と同じ表現を無理に残さず、自分が確実に使える基本語へ言い換えて構いません。ただし、筆者の賛否や因果関係を逆にしないでください。書いた後は、要約だけを読んで「何が主張で、なぜか」が分かるかを確認します。',
    examples: [
      { en: 'The author argues that cities should improve buses because reliable transport reduces car use.', ja: '主張と中心の理由を一文で示します。' },
      { en: 'The passage explains how sleep supports memory and recommends regular sleep habits.', ja: '説明の中心と提案を残します。' },
    ],
    triggerTags: ['wordChoice', 'runOn'],
  },
  {
    id: 'ls-0029',
    title: '和文英訳は意味の核を守る',
    skillIds: ['writing.translation', 'writing.japaneseSimplification'],
    bodyMd:
      '和文英訳では、日本語の語順や抽象語を一語ずつ英語へ置き換える必要はありません。最初に「誰が何をする」「何と何がどの関係か」という意味の核を日本語で短くします。「制度の実効性を担保する」なら、文脈に応じて make sure the system works と表せます。原文にない強い断定や具体例を足さず、条件、否定、対比は必ず残します。高度な語を探して文の骨格を崩すより、複数の短い英文へ分けてください。最後に原文と英語を比べ、主体と論理関係が同じかを確認します。',
    examples: [
      { en: 'We need rules to make sure the system works.', ja: '制度が実際に働くよう、規則が必要です。' },
      { en: 'The plan may save money, but it could reduce access.', ja: '費用の利点と利用機会の減少を対比します。' },
    ],
    triggerTags: ['literalTranslation', 'wordChoice'],
  },
  {
    id: 'ls-0030',
    title: '一文を切る位置を骨格で決める',
    skillIds: ['writing.paragraphStructure', 'writing.connector'],
    bodyMd:
      '一文が長くなったら、語数だけで機械的に切らず、主語と動詞の組を数えます。独立した二つの主張が and やコンマだけで続いているなら、ピリオドで分ける候補です。理由の because 節や条件の if 節は、どの主張を支えるかが明確なら同じ文に残せます。切った後は、次の文に However、Therefore、For example など、本当に必要な関係だけを置きます。接続語を足す前に、前後の文を短く言い直してください。最後に各文が単独でも主語と動詞を持ち、文末記号で閉じているか確認します。',
    examples: [
      { en: 'The service is useful. However, it is expensive.', ja: '独立した二つの評価を分けます。' },
      { en: 'If buses run often, more people will use them.', ja: '条件と結果は一文で関係を示せます。' },
    ],
    triggerTags: ['punctuation', 'runOn', 'conjunction'],
  },
  {
    id: 'ls-0031',
    title: '名詞句を一まとまりで点検する',
    skillIds: ['writing.article', 'writing.plural', 'writing.wordOrder'],
    bodyMd:
      '名詞の誤りは、単語だけでなく、その前後を含む名詞句で確認します。a useful tool なら冠詞、形容詞、名詞の順です。数えられる単数名詞には多くの場合 a、the、my などが必要で、複数なら名詞の形と動詞の数をそろえます。さらに access to information のように、名詞の後ろに特定の前置詞が続く表現もあります。まず中心名詞を選び、数を決め、前の限定語、後ろの説明の順に見直してください。一度に段落全体を直さず、重要な名詞句から一つずつ整えます。',
    examples: [
      { en: 'Students need access to reliable information.', ja: 'access to information を一まとまりで確認します。' },
      { en: 'A local library provides useful services.', ja: '単数名詞の前と動詞の形をそろえます。' },
    ],
    triggerTags: ['article', 'preposition', 'number'],
  },
  {
    id: 'ls-0032',
    title: '代名詞で段落の流れを保つ',
    skillIds: ['writing.paragraphStructure', 'writing.paraphrase'],
    bodyMd:
      '段落では同じ名詞を毎文繰り返す必要はありませんが、代名詞へ替えるときは読み手が迷わないことが優先です。最初に smartphones のような名詞を明示し、次の文で they を使います。文と文の間の内容全体を受ける場合は This idea や This change のように名詞を添えると安全です。it や this だけで複数の候補を指せる状態なら、中心名詞を書き直してください。言い換えは単なる語の交換ではなく、同じ対象を保ちながら流れを作る方法です。最後に各代名詞から前へたどり、指す内容が一つか確かめます。',
    examples: [
      { en: 'Smartphones are convenient, but they can distract students.', ja: 'they は smartphones を受けます。' },
      { en: 'The city added more buses. This change improved access.', ja: 'This change が前文全体の変化を受けます。' },
    ],
    triggerTags: ['pronoun', 'wordChoice'],
  },
])
