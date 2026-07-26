import { defineSimplificationTasks } from '../factories'

export const simplificationPackBAdditions = defineSimplificationTasks([
  {
    id: 'sj-0039',
    stage: 4,
    originalJa: '教育のデジタル化を進める際には、端末を配布するだけでなく、通信環境や操作を支援する体制の格差にも目を向ける必要があります。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '学校が全員に端末を配っても、それだけでは十分ではありません。\n家に安定したインターネットがない生徒もいます。\n操作を相談できる人がいない生徒もいます。',
      'デジタル学習には端末、通信環境、使い方の支援が必要です。\n学校は三つがすべての生徒に届くか確認する必要があります。',
    ],
    modelEn: [
      'Giving every student a device is not enough. Some students lack a stable internet connection or someone who can help them use the device.',
      'Digital learning requires devices, internet access, and technical support. Schools need to make sure that every student has all three.',
    ],
    explanation: '「格差」を、通信環境と操作支援を持たない生徒の状況へ具体化します。',
  },
  {
    id: 'sj-0040',
    stage: 4,
    originalJa: '教育における公平性とは全員を同じように扱うことではなく、それぞれが学習に参加するために必要な条件を整えることです。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '生徒が必要とする助けは同じではありません。\n文字を大きくする必要がある生徒も、説明を繰り返し聞く必要がある生徒もいます。\n必要に合わせて助けることが公平です。',
      '全員に同じ教材を渡すだけでは、全員が学べるとは限りません。\n学校は生徒ごとに学びやすい方法を用意します。',
    ],
    modelEn: [
      'Students do not all need the same help. Some need larger text, while others need to hear an explanation again. Fairness means providing the help each student needs.',
      'Giving everyone the same material does not ensure that everyone can learn. Schools should provide methods that meet different needs.',
    ],
    explanation: '抽象語「公平性」を、異なる必要に応じて支援方法を変えることとして示します。',
  },
  {
    id: 'sj-0041',
    stage: 4,
    originalJa: '観光による経済効果を地域に広く行き渡らせるには、一部の有名施設だけでなく、小規模な店や周辺地域にも旅行者を導く工夫が必要です。',
    targetPoints: ['subject', 'concrete', 'connector'],
    modelSimplified: [
      '旅行者が有名な場所だけでお金を使うと、利益は一部に集まります。\n地域は小さな店や周辺の町も案内します。\nすると、より多くの人が観光から収入を得られます。',
      '観光の利益を広げるには、旅行者に複数の場所を訪れてもらう必要があります。\n地図や周遊バスで小さな店にも行きやすくできます。',
    ],
    modelEn: [
      'If visitors spend money only at famous sites, the benefits stay in a few places. Local maps and transport can guide them to small shops and nearby towns.',
      'To spread the benefits of tourism, a region should help travelers visit several areas. Maps and loop buses can make small businesses easier to reach.',
    ],
    explanation: '「経済効果が行き渡る」を、旅行者が小さな店でもお金を使う流れに変えます。',
  },
  {
    id: 'sj-0042',
    stage: 4,
    originalJa: '消費者が環境への責任を果たすためには、商品の表示から生産方法や廃棄後の影響を読み取り、価格以外の基準でも選ぶことが求められます。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '消費者は値段だけで商品を選ばないようにします。\n表示を見て、どのように作られたかを確認します。\n捨てた後に再利用できるかも考えます。',
      '買い物のとき、私たちは材料、生産方法、包装を比べられます。\n環境への負担が少ない商品を選ぶことができます。',
    ],
    modelEn: [
      'Consumers should consider more than price. They can read labels to learn how a product was made and whether it can be reused after disposal.',
      'When shopping, we can compare materials, production methods, and packaging. This helps us choose products that cause less environmental harm.',
    ],
    explanation: '「環境への責任」を、表示を読み、三つの点を比べて選ぶ行動にします。',
  },
  {
    id: 'sj-0043',
    stage: 4,
    originalJa: 'SNSが公共的な議論の場となるには、意見を素早く広められる利点と、感情的な反応が対話を妨げる危険の両方を考える必要があります。',
    targetPoints: ['oneIdea', 'concrete', 'connector'],
    modelSimplified: [
      'SNSでは、多くの人に意見をすぐ届けられます。\nしかし、怒ったまま短い言葉を投稿すると、相手の話を聞く対話が難しくなります。',
      'SNSは社会の問題を話し合う場所になります。\nそのためには、投稿する前に根拠を示し、相手の意見を読んでから答える必要があります。',
    ],
    modelEn: [
      'Social media lets people share opinions quickly. However, angry and brief posts can make genuine dialogue difficult.',
      'Social media can be a place for public discussion if users give evidence and read other views before responding.',
    ],
    explanation: '「公共的な議論」を、根拠を示し、相手の意見を読んで答える行動で表します。',
  },
  {
    id: 'sj-0044',
    stage: 4,
    originalJa: 'ボランティア活動を一時的な善意で終わらせないためには、参加者が無理なく役割を分担し、活動を引き継げる仕組みが欠かせません。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '一人が多くの仕事をすると、活動を続けられなくなります。\n参加者は小さな仕事を分けます。\n手順を記録し、次の人に伝えます。',
      'ボランティアを続けるには、誰かの努力だけに頼ってはいけません。\n当番と説明書があれば、新しい人も参加しやすくなります。',
    ],
    modelEn: [
      'A volunteer project may stop if one person does too much. Members should divide small tasks, record the steps, and pass them on to others.',
      "Long-term volunteer work cannot depend on one person's effort. A schedule and clear instructions make it easier for new people to join.",
    ],
    explanation: '「継続の仕組み」を、仕事の分担、記録、引き継ぎという行動に分けます。',
  },
  {
    id: 'sj-0045',
    stage: 4,
    originalJa: '住民の健康を予防の段階から支えるには、病院を充実させるだけでなく、日常的に運動や交流ができる環境を地域に整えることも重要です。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '病気になった人を病院で治すことは大切です。\n同時に、地域は歩きやすい道や公園を作ります。\n住民は毎日、体を動かし、人と会えます。',
      '健康を守る場所は病院だけではありません。\n安全な歩道や地域の運動教室も、病気を防ぐ助けになります。',
    ],
    modelEn: [
      'Treating sick people in hospitals is important. Communities should also provide safe paths and parks where residents can exercise and meet others.',
      'Hospitals are not the only places that protect health. Safe sidewalks and local exercise classes can help prevent illness.',
    ],
    explanation: '抽象的な「予防」を、歩道、公園、運動教室を日常で使うことに具体化します。',
  },
  {
    id: 'sj-0046',
    stage: 4,
    originalJa: '情報を得る手段が多様化した現在でも、公共図書館には、費用や年齢にかかわらず信頼できる資料へアクセスできる場としての役割があります。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      'インターネットには多くの情報があります。\nそれでも、図書館では誰でも無料で本や資料を使えます。\n司書に資料の探し方を相談することもできます。',
      '図書館は本を貸すだけの場所ではありません。\n端末を持たない人や情報を探すのが難しい人も、必要な資料を得られます。',
    ],
    modelEn: [
      'The internet offers a great deal of information. Still, public libraries give everyone free access to books, reliable sources, and help from librarians.',
      'Libraries do more than lend books. People without devices or research skills can use them to find the information they need.',
    ],
    explanation: '図書館の「役割」を、無料の資料、端末、司書の支援という利用場面で示します。',
  },
  {
    id: 'sj-0047',
    stage: 4,
    originalJa: '異文化交流を有意義なものにするには、違いを珍しさとして眺めるのではなく、自分の常識も一つの文化的な見方だと気づく必要があります。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '私たちは外国の習慣だけを特別だと考えがちです。\nしかし、自分にとって普通の習慣も、文化によって作られています。\n両方の理由を尋ねることが大切です。',
      '交流では、相手の違いを見るだけでは足りません。\n自分が当然だと思う行動も説明し、互いに質問します。',
    ],
    modelEn: [
      'We often treat only foreign customs as unusual. However, our own ordinary habits are also shaped by culture. We should ask about the reasons for both.',
      'Cultural exchange requires more than noticing differences. We need to explain our own assumptions and ask one another questions.',
    ],
    explanation: '「文化的な見方」を、自分の習慣を説明し、理由を尋ねる行動へ変えます。',
  },
  {
    id: 'sj-0048',
    stage: 4,
    originalJa: 'AIを用いた評価の効率性を重視しすぎると、数値化しにくい創造性や学習の過程が見落とされるおそれがあります。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      'AIは多くの答案を短時間で処理できます。\nしかし、答えに至るまでの工夫や新しい発想を正しく測れないことがあります。',
      '学校がAIの点数だけで評価すると、生徒が考え直した過程を見落とすかもしれません。\n先生が作品と学習記録も見る必要があります。',
    ],
    modelEn: [
      'AI can process many answers quickly. However, it may not measure creative ideas or the effort that led to an answer.',
      'If schools rely only on scores produced by AI, they may miss how students revised their thinking. Teachers should also examine the work and learning process.',
    ],
    explanation: '「数値化しにくいもの」を、新しい発想と考え直した過程という観察対象にします。',
  },
  {
    id: 'sj-0049',
    stage: 5,
    originalJa: '都市の持続可能性を高めるには、個々の建物を省エネ化するだけでなく、生活に必要な場所を公共交通で結ぶ都市構造そのものを見直す必要があります。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '建物が使うエネルギーを減らすことは大切です。\nさらに、住宅、学校、店を電車やバスで結びます。\n住民は車を使わずに移動できます。',
      '環境に良い都市では、生活に必要な場所が離れすぎていません。\n人々は公共交通や徒歩で通勤や買い物ができます。',
    ],
    modelEn: [
      'Reducing energy use in buildings is important. Cities should also connect homes, schools, and shops by public transport so that residents need fewer cars.',
      'In a sustainable city, essential places are not too far apart. People can commute and shop by public transport or on foot.',
    ],
    explanation: '「都市構造」を、住宅と施設の距離、公共交通、住民の移動方法に置き換えます。',
  },
  {
    id: 'sj-0050',
    stage: 5,
    originalJa: '個人情報の利用について実質的な同意を得るには、長い規約への形式的な同意を求めるだけでなく、目的と不利益を理解できる形で示さなければなりません。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '利用者が長い規約のボタンを押すだけでは、内容を理解したとは言えません。\n企業は、集める情報、使う目的、考えられる不利益を短く説明します。',
      '本当の同意には、利用者が選べることが必要です。\nサービスは情報の使い方を分かりやすく示し、断る方法も用意します。',
    ],
    modelEn: [
      'Clicking a button under a long policy does not mean that users understand it. Companies should clearly explain what data they collect, why they use it, and what risks may follow.',
      'Real consent requires a meaningful choice. A service should explain its use of data and provide a simple way to refuse.',
    ],
    explanation: '「実質的な同意」を、目的と不利益を理解し、断る選択肢を持つ状態として示します。',
  },
  {
    id: 'sj-0051',
    stage: 5,
    originalJa: '技術変化に対応する学び直しを個人の責任だけに委ねると、時間や費用に余裕のない労働者ほど新しい技能を得にくくなります。',
    targetPoints: ['subject', 'concrete', 'connector'],
    modelSimplified: [
      '働く人が新しい技能を学ぶには、時間と授業料が必要です。\nすべてを本人に任せると、余裕のない人は学べません。\n企業や政府も休暇や費用を支える必要があります。',
      '仕事が変わっても、誰もが自分のお金と休日で学び直せるわけではありません。\n勤務時間内の研修や補助金が必要です。',
    ],
    modelEn: [
      'Workers need time and money to learn new skills. If they must provide both themselves, those with fewer resources will be left behind. Employers and governments should offer support.',
      'Not everyone can retrain using personal savings and days off. Paid training time and financial aid are necessary.',
    ],
    explanation: '「個人の責任」を、誰が学習時間と費用を負担するかという問題に具体化します。',
  },
  {
    id: 'sj-0052',
    stage: 5,
    originalJa: '誤情報が民主的な意思決定を損なうのは、単に誤った事実が広まるからではなく、人々が共有できる判断の土台そのものが弱まるからです。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '市民が政策を選ぶには、基本的な事実を共有する必要があります。\n誤情報が広がると、人々は何を事実として話し合えばよいか分からなくなります。',
      '間違った情報は一つの判断を誤らせるだけではありません。\n互いの資料を信じられなくなり、同じ問題について話し合うことも難しくします。',
    ],
    modelEn: [
      'Citizens need a shared set of basic facts when choosing policies. Misinformation makes it hard to agree on what evidence a discussion should use.',
      'False information does more than cause one bad decision. It can destroy trust in sources and make public discussion itself more difficult.',
    ],
    explanation: '「判断の土台」を、市民が事実と資料を共有して話し合える状態として表します。',
  },
  {
    id: 'sj-0053',
    stage: 5,
    originalJa: '食品廃棄の問題は消費者の心がけだけでは解決できず、生産量、販売期限、寄付の仕組みを含む流通全体の見直しを要します。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '家庭が食べ物を捨てないようにすることは大切です。\nしかし、店が売れる量より多く仕入れることも廃棄を生みます。\n余った食品を早く寄付できる仕組みも必要です。',
      '食品は畑、工場、店、家庭のどこでも捨てられます。\n各段階で量を測り、作りすぎや売り残りを減らす必要があります。',
    ],
    modelEn: [
      'Households should avoid wasting food, but stores also create waste by ordering more than they can sell. Systems for donating surplus food are also needed.',
      'Food is discarded on farms, in factories, in shops, and at home. We need to measure waste at each stage and reduce excess production and unsold goods.',
    ],
    explanation: '「流通全体」を、食品が通る場所と各場所で起きる廃棄に分けます。',
  },
  {
    id: 'sj-0054',
    stage: 5,
    originalJa: '公共空間の包摂性を高める設計は、特定の人への特別対応ではなく、年齢や身体状況の異なる多くの人の利用を容易にします。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '段差のない入口は車いすの人を助けます。\n同時に、ベビーカーを押す人や重い荷物を持つ人にも便利です。',
      '大きな文字、音声案内、休めるベンチを用意します。\nすると、年齢や体の状態が違う人も同じ場所を使いやすくなります。',
    ],
    modelEn: [
      'A step-free entrance helps wheelchair users, but it is also useful for people with strollers or heavy luggage.',
      'Large print, audio guidance, and places to sit make a public space easier to use for people of different ages and abilities.',
    ],
    explanation: '「包摂性」を、段差、表示、音声、休憩場所を誰が使えるかという例で示します。',
  },
])
