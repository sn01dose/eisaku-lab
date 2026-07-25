import { defineMiniLessons } from '../factories'

export const writingMiniLessons = defineMiniLessons([
  {
    id: 'ls-0009',
    title: 'まず主語と動詞を置く',
    skillIds: ['writing.subjectVerb'],
    bodyMd:
      '日本語では主語を省くことができますが、英語の文には原則として主語と動詞が必要です。長い内容を英訳する前に、「誰・何が」「どうする・どんな状態か」を一組だけ決めます。「運動することは健康によい」なら Exercise is ... または Exercising is ... と骨格を先に置きます。説明を増やすのはその後です。文が崩れたときは一度すべてを直そうとせず、主語に一本線、中心の動詞に二本線を引くつもりで確認してください。',
    examples: [
      { en: 'Exercise is good for our health.', ja: '運動は健康に良いです。' },
      { en: 'Reading helps me relax.', ja: '読書は私の気分転換に役立ちます。' },
    ],
    triggerTags: ['missingSubject', 'missingVerb', 'fragment'],
  },
  {
    id: 'ls-0010',
    title: '英語の語順を骨格から戻す',
    skillIds: ['writing.wordOrder', 'writing.subjectVerb'],
    bodyMd:
      '語句を知っていても、日本語の順番のまま並べると英文は伝わりにくくなります。まず主語、動詞、動詞が必要とする目的語の順に S + V + O を作り、場所や時を後ろへ足します。「私は図書館で英語を勉強します」は I study English が骨格で、in the library は追加情報です。疑問文や否定文では助動詞の位置も確認します。迷ったら修飾語をいったん外し、短い骨格が成立してから戻してください。',
    examples: [
      { en: 'I study English in the library.', ja: '私は図書館で英語を勉強します。' },
      { en: 'Do you use this app every day?', ja: 'このアプリを毎日使いますか。' },
    ],
    triggerTags: ['wordOrder', 'missingVerb'],
  },
  {
    id: 'ls-0011',
    title: '時を示す語から時制を決める',
    skillIds: ['writing.tense'],
    bodyMd:
      '時制を選ぶ前に、出来事がいつ起きたかを決めます。yesterday や last year は過去、every day は習慣としての現在、now は進行中、next week は未来の手がかりです。ただし、if 節のように未来の内容でも現在形を使う場所があります。一段落では、過去の経験を説明している途中で理由なく現在形へ移らないよう注意します。提出前に時を示す語を丸で囲むつもりで見直し、それに対応する中心動詞を一つずつ確認してください。',
    examples: [
      { en: 'I studied science yesterday.', ja: '私は昨日、科学を勉強しました。' },
      { en: 'If I have time, I will read it.', ja: '時間があれば、それを読みます。' },
    ],
    triggerTags: ['tense'],
  },
  {
    id: 'ls-0012',
    title: '冠詞と単複を名詞の手前で確認する',
    skillIds: ['writing.article', 'writing.plural'],
    bodyMd:
      '英語の可算名詞は、単数なら多くの場合 a、an、the、my などの支えが必要で、複数なら形を変えます。まず名詞に印を付け、「一つか複数か」「聞き手がどれか分かるか」を確認します。初めて述べる一つの例は a、すでに特定できるものは the が基本です。抽象名詞や不可算名詞には別の扱いがあるため、冠詞を機械的に付けないでください。一度に全名詞を直すのではなく、中心となる名詞から順に点検します。最後に名詞句全体を読み直します。',
    examples: [
      { en: 'I read a book. The book was useful.', ja: '本を一冊読みました。その本は役立ちました。' },
      { en: 'Many students use smartphones.', ja: '多くの生徒がスマートフォンを使います。' },
    ],
    triggerTags: ['article', 'number'],
  },
  {
    id: 'ls-0013',
    title: '接続語は関係を決めてから選ぶ',
    skillIds: ['writing.connector', 'writing.paragraphStructure'],
    bodyMd:
      '接続語を増やすこと自体が目的ではありません。二つの内容の関係を先に決めます。理由なら because、対比なら but や however、例なら for example、前から導く結果なら therefore が候補です。日本語の「そして」をすべて and にすると、どの関係か見えにくくなります。一文を長くしすぎる場合は、ピリオドで切って However や Therefore から次の文を始めても構いません。接続語の前後がそれぞれ何を述べるかを短く言える状態にします。',
    examples: [
      { en: 'It is convenient. However, it can distract us.', ja: '便利です。しかし、気が散ることがあります。' },
      { en: 'I walk because the station is near.', ja: '駅が近いので歩きます。' },
    ],
    triggerTags: ['conjunction', 'runOn'],
  },
  {
    id: 'ls-0014',
    title: '難しい日本語を先にほどく',
    skillIds: ['writing.japaneseSimplification', 'writing.paraphrase', 'writing.translation'],
    bodyMd:
      '複雑な日本語をそのまま高度な英語へ移そうとすると、主語と動詞が見えなくなります。英訳の前に、主語を明確にし、一文を一つの内容に分け、抽象語を行動へ変えます。「地域経済を活性化する」は、場面に応じて local shops earn more money や create jobs と具体化できます。元の日本語と同じ語数や構造を保つ必要はありません。意味の中心と論理関係を保ちながら、自分が確実に使える英語に対応する日本語へ言い換えてください。',
    examples: [
      { en: 'More tourists support local shops.', ja: '観光客が増えると、地域の店の助けになります。' },
      { en: 'Students need time to think for themselves.', ja: '生徒が自分で考える時間が必要です。' },
    ],
    triggerTags: ['literalTranslation', 'wordChoice'],
  },
  {
    id: 'ls-0015',
    title: '段落は役割の違う文で作る',
    skillIds: ['writing.paragraphStructure', 'writing.connector'],
    bodyMd:
      '段落は同じ内容を言い換えて重ねるのではなく、役割の違う文で進めます。基本は「結論」「理由」「具体例」「まとめ」です。最初の文で問いへの答えを示し、次にそれがなぜ成り立つかを説明します。例は理由を見える場面にし、最後は新しい論点を加えず結論へ戻ります。短い課題なら、理由と例を一文ずつにしても十分です。書いた後に各文へ「結論」「理由」「例」のラベルを付け、役割のない文や同じ役割の重複を丁寧に整理します。',
    examples: [
      { en: 'I support the plan. It saves time. For example, ... Therefore, ...', ja: '結論→理由→例→まとめ' },
      { en: 'One reason is cost. A monthly pass is cheaper than ...', ja: '理由を比較の例で支えます。' },
    ],
    triggerTags: ['fragment', 'runOn', 'conjunction'],
  },
  {
    id: 'ls-0016',
    title: '反対意見を条件づくりに使う',
    skillIds: ['writing.argument', 'writing.paraphrase'],
    bodyMd:
      '反対意見は自分の主張を弱めるためではなく、主張が成り立つ条件を明確にするために使えます。まず相手のもっとも強い理由を一文で公平に述べます。次に「その懸念はどの条件なら減らせるか」「それでも残る利点は何か」を答えます。例えば費用への反論には、無料と主張し直すのではなく、試行期間、対象の限定、効果測定を提案できます。相手の意見を極端に言い換えず、自分の結論も必要に応じて狭めると、論証全体が強くなります。',
    examples: [
      { en: 'The plan is costly. However, the city can begin with a one-year trial.', ja: '費用を認め、試行という条件を加えます。' },
      { en: 'Although the tool is useful, final decisions need human review.', ja: '利点を認め、利用範囲を限定します。' },
    ],
    triggerTags: ['literalTranslation', 'wordChoice', 'runOn'],
  },
])
