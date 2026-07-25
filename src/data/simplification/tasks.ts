import { defineSimplificationTasks } from '../factories'

export const simplificationTasks = defineSimplificationTasks([
  {
    id: 'sj-0001',
    stage: 2,
    originalJa: '健康を維持するという観点から考えると、十分な睡眠時間を確保することが大切です。',
    targetPoints: ['subject', 'basicWords'],
    modelSimplified: [
      '十分に眠ることは大切です。\n睡眠は私たちの健康を守ります。',
      '私たちは毎日、十分な睡眠を取る必要があります。\nそうすれば健康を保てます。',
    ],
    modelEn: [
      'Getting enough sleep is important. Sleep protects our health.',
      'We need enough sleep every day. It helps us stay healthy.',
    ],
    explanation: '「健康を維持するという観点」を独立した説明にせず、sleep を主語にして基本語で効果を述べます。',
  },
  {
    id: 'sj-0002',
    stage: 2,
    originalJa: '読書を習慣として継続することにより、さまざまな考え方に触れることができます。',
    targetPoints: ['subject', 'basicWords'],
    modelSimplified: [
      '毎日、本を読む習慣をつけます。\n本からさまざまな考え方を学べます。',
      '私たちは本を読み続けます。\nすると、違う考えを知ることができます。',
    ],
    modelEn: [
      'We make a habit of reading every day. Books teach us different ways of thinking.',
      'If we keep reading, we can learn about different ideas.',
    ],
    explanation: '「継続することにより」を keep reading や習慣という具体的な行動に置き換えます。',
  },
  {
    id: 'sj-0003',
    stage: 2,
    originalJa: '電車を利用することは、道路の混雑を軽減するという点で有効です。',
    targetPoints: ['subject', 'concrete'],
    modelSimplified: [
      '多くの人が電車を使えば、道路を走る車が減ります。\nそのため、道路が混みにくくなります。',
      '電車は一度に多くの人を運びます。\n電車を使うと、車の数を減らせます。',
    ],
    modelEn: [
      'If more people take trains, there will be fewer cars on the road. This can reduce traffic.',
      'Trains carry many people at once. Using them can reduce the number of cars.',
    ],
    explanation: '抽象語「混雑を軽減」を「道路の車が減る」という見える変化にします。',
  },
  {
    id: 'sj-0004',
    stage: 3,
    originalJa: 'スマートフォンは、使い方によっては学習の妨げになる可能性もある一方で、必要な情報をすぐに調べられるという利点もあります。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      'スマートフォンには欠点もあります。\n使いすぎると勉強に集中できません。\nしかし、必要な情報をすぐに調べられます。',
      'スマートフォンは勉強を邪魔することがあります。\n一方で、情報を早く見つける道具にもなります。',
    ],
    modelEn: [
      'Smartphones have disadvantages. If we use them too much, we cannot focus on studying. However, they help us find information quickly.',
      'Smartphones can distract us from studying. On the other hand, they are useful tools for finding information quickly.',
    ],
    explanation: '欠点と利点を別の文にし、However や On the other hand で関係を明示します。',
  },
  {
    id: 'sj-0005',
    stage: 3,
    originalJa: '失敗した経験を振り返ることによって、自分に不足していた点を把握し、次の行動を改善できます。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '失敗した後に、何が足りなかったかを考えます。\nすると、次にすることを変えられます。',
      '私たちは失敗から学べます。\n原因を調べれば、次はもっとよい行動を選べます。',
    ],
    modelEn: [
      'After we fail, we think about what was missing. Then we can change what we do next.',
      'We can learn from failure. If we examine the cause, we can choose a better action next time.',
    ],
    explanation: '「把握」「改善」を think、change、choose など、行動が見える基本動詞にします。',
  },
  {
    id: 'sj-0006',
    stage: 3,
    originalJa: '地域の清掃活動に参加することは、環境をよくするだけでなく、住民同士が交流する機会にもなります。',
    targetPoints: ['oneIdea', 'concrete', 'connector'],
    modelSimplified: [
      '地域の清掃活動に参加すると、町がきれいになります。\nさらに、住民と話すことができます。',
      '住民が一緒にごみを拾えば、地域の環境がよくなります。\n同時に、住民は互いを知ることができます。',
    ],
    modelEn: [
      'Joining a local cleanup makes the town cleaner. In addition, we can talk with other residents.',
      'When residents pick up litter together, the area becomes cleaner. At the same time, they can get to know one another.',
    ],
    explanation: '「環境」「交流」を、町がきれいになることと住民が話すことに具体化します。',
  },
  {
    id: 'sj-0007',
    stage: 3,
    originalJa: 'オンライン授業は場所に左右されず受講できるため、学習機会の拡大につながります。',
    targetPoints: ['subject', 'concrete', 'connector'],
    modelSimplified: [
      '生徒は家からオンライン授業を受けられます。\nそのため、遠くの授業にも参加できます。',
      'オンライン授業なら、住んでいる場所は問題になりません。\n生徒はより多くの授業を選べます。',
    ],
    modelEn: [
      'Students can take online classes from home. Therefore, they can join classes offered far away.',
      'With online classes, where students live is less important. They can choose from more courses.',
    ],
    explanation: '抽象的な「学習機会の拡大」を、遠くの授業や選べる授業の数に置き換えます。',
  },
  {
    id: 'sj-0008',
    stage: 4,
    originalJa: '観光客の増加は地域経済の活性化をもたらす反面、住民の日常生活に負担を与えることもあります。',
    targetPoints: ['oneIdea', 'concrete', 'connector'],
    modelSimplified: [
      '観光客が増えると、地域の店の売上が増えます。\nしかし、道路や電車が混み、住民が困ることもあります。',
      '観光は地域にお金をもたらします。\n一方で、多すぎる観光客は住民の静かな生活を妨げます。',
    ],
    modelEn: [
      'More tourists can increase sales at local shops. However, crowded roads and trains may trouble residents.',
      'Tourism brings money to an area. On the other hand, too many visitors can disturb the daily lives of residents.',
    ],
    explanation: '「経済の活性化」と「生活への負担」を、売上と混雑という具体的な結果にします。',
  },
  {
    id: 'sj-0009',
    stage: 4,
    originalJa: 'AIを教育に導入する際には、便利さを享受するだけでなく、生徒自身が考える機会を失わないように配慮する必要があります。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      'AIは学習を便利にします。\nしかし、生徒が答えをそのまま受け取るだけではいけません。\n生徒が自分で考える課題も必要です。',
      '学校はAIを学習に使えます。\nそのとき、AIにすべてを任せず、生徒が考える時間を残す必要があります。',
    ],
    modelEn: [
      'AI makes learning more convenient. However, students should not simply accept its answers. They also need tasks that require their own thinking.',
      'Schools can use AI for learning. They must not leave everything to AI and should protect time for students to think.',
    ],
    explanation: '「享受」「配慮」を避け、誰が何をするかを school、students、AI の主語で分けます。',
  },
  {
    id: 'sj-0010',
    stage: 4,
    originalJa: 'すべての生徒に同じ支援を提供することが、必ずしも公平な教育につながるとは限りません。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '生徒が必要とする助けはそれぞれ違います。\n全員に同じ助けを与えても、公平にならないことがあります。',
      'ある生徒は端末が必要で、別の生徒は先生の説明が必要です。\n公平にするには、必要に合わせて助けを変えます。',
    ],
    modelEn: [
      'Students need different kinds of help. Giving everyone the same support is not always fair.',
      'One student may need a device, while another needs a teacher’s explanation. Fair support changes according to need.',
    ],
    explanation: '抽象語「公平」を、異なる必要に対して支援を変えることとして具体化します。',
  },
  {
    id: 'sj-0011',
    stage: 4,
    originalJa: '公共交通機関の充実は、高齢者をはじめとする自家用車を利用できない人々の移動手段を確保する上で重要です。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '高齢者など、車を運転できない人がいます。\nバスや電車が多ければ、その人たちも必要な場所へ行けます。',
      '公共交通は車を使えない人を助けます。\n例えば、高齢者が病院や店へ行きやすくなります。',
    ],
    modelEn: [
      'Some people, including older residents, cannot drive. Frequent buses and trains help them reach the places they need.',
      'Public transport helps people without cars. For example, it makes it easier for older people to reach hospitals and shops.',
    ],
    explanation: '「移動手段を確保」を、病院や店へ行けるという具体的な行動にします。',
  },
  {
    id: 'sj-0012',
    stage: 4,
    originalJa: '異文化理解を深めるには、相手の習慣を知識として学ぶだけでなく、その背景にある考え方にも目を向けることが求められます。',
    targetPoints: ['oneIdea', 'basicWords', 'connector'],
    modelSimplified: [
      '他の文化の習慣を学ぶことは大切です。\nしかし、習慣だけでなく、人々がなぜそうするのかも考える必要があります。',
      '異文化を理解するには、行動を覚えるだけでは足りません。\nその行動の理由も知る必要があります。',
    ],
    modelEn: [
      'Learning the customs of another culture is important. However, we also need to consider why people follow them.',
      'To understand another culture, memorizing behavior is not enough. We need to learn the reasons behind it.',
    ],
    explanation: '「背景にある考え方」を「なぜその行動をするのか」という問いに置き換えます。',
  },
  {
    id: 'sj-0013',
    stage: 5,
    originalJa: '環境に配慮した商品を選ぶ消費者が増えれば、企業は持続可能な生産へ移行する動機を得られると考えられます。',
    targetPoints: ['subject', 'oneIdea', 'concrete', 'connector'],
    modelSimplified: [
      '多くの消費者が環境に良い商品を選びます。\nすると、その商品がよく売れます。\n企業は環境への負担が少ない作り方を増やそうとします。',
      '消費者の選択は企業に合図を送ります。\n環境に良い商品への需要が増えれば、企業は生産方法を変える理由を持ちます。',
    ],
    modelEn: [
      'More consumers choose environmentally friendly products. These products then sell better, which encourages companies to use more sustainable methods.',
      'Consumer choices send a signal to businesses. If demand for greener products grows, companies have a reason to change how they produce goods.',
    ],
    explanation: '「動機を得る」を、売上や需要が増え、作り方を変える理由が生まれる流れにします。',
  },
  {
    id: 'sj-0014',
    stage: 5,
    originalJa: '情報が豊富に存在する現代では、情報を得る能力よりも、その信頼性を見極める能力の重要性が増しています。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '今は情報を簡単に見つけられます。\nしかし、その情報が正しいかを判断することは難しく、重要です。',
      '私たちには多くの情報があります。\n情報を集めるだけでなく、情報源と根拠を確認する力が必要です。',
    ],
    modelEn: [
      'Today, information is easy to find. However, judging whether it is reliable is difficult and important.',
      'We have access to a great deal of information. We need not only to collect it but also to check its sources and evidence.',
    ],
    explanation: '「信頼性を見極める」を、情報源と根拠を確認する行動に置き換えます。',
  },
  {
    id: 'sj-0015',
    stage: 5,
    originalJa: '技術革新によって失われる仕事がある一方で、新しい仕事が生まれるため、変化に対応できる学び直しの仕組みが欠かせません。',
    targetPoints: ['oneIdea', 'concrete', 'connector'],
    modelSimplified: [
      '新しい技術によって、なくなる仕事があります。\n一方で、新しい仕事も生まれます。\n働く人が新しい技能を学べる制度が必要です。',
      '技術が変わると、必要な技能も変わります。\nそのため、仕事をしながら学び直せる機会を用意しなければなりません。',
    ],
    modelEn: [
      'New technology removes some jobs but creates others. Workers therefore need systems that help them learn new skills.',
      'As technology changes, the skills needed at work also change. People need opportunities to retrain while they are working.',
    ],
    explanation: '仕事の増減と必要な支援を三つの短い内容に分け、因果を明確にします。',
  },
  {
    id: 'sj-0016',
    stage: 5,
    originalJa: '短期的な経済効率だけを基準に政策を評価すると、数値に表れにくい地域のつながりが損なわれる可能性があります。',
    targetPoints: ['subject', 'concrete', 'basicWords'],
    modelSimplified: [
      '政策がすぐにお金を節約できるかだけを見てはいけません。\n例えば、地域の施設を閉じると、人々が会う場所を失うことがあります。',
      '費用の数字だけでは政策の効果をすべて測れません。\n地域の人間関係のように、数字にしにくい価値もあります。',
    ],
    modelEn: [
      'We should not judge a policy only by whether it saves money quickly. Closing a local facility, for example, may remove a place where people meet.',
      'Cost figures cannot measure every effect of a policy. Some values, such as community relationships, are difficult to express in numbers.',
    ],
    explanation: '抽象的な「地域のつながり」を、施設で人が会うという具体例に変えます。',
  },
  {
    id: 'sj-0017',
    stage: 6,
    originalJa: '科学的知見には不確実性が伴うからといって、あらゆる主張が同じ程度に妥当であると結論づけることはできません。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '科学には、まだ分からないことがあります。\nしかし、すべての説明が同じように正しいわけではありません。\n多くの根拠に支えられた説明の方が信頼できます。',
      '研究の結論には不確実な部分があります。\nそれでも、根拠の量と質を比べて、より信頼できる主張を選べます。',
    ],
    modelEn: [
      'Science includes uncertainty. However, not every explanation is equally valid. A claim supported by strong evidence is more reliable.',
      'Research findings may be uncertain, but we can still compare the amount and quality of evidence behind different claims.',
    ],
    explanation: '「不確実」と「何でも同じ」を分け、根拠の質を比べられることを明示します。',
  },
  {
    id: 'sj-0018',
    stage: 6,
    originalJa: '制度が形式上はすべての人に開かれていても、利用に必要な時間や知識を持たない人がいれば、実質的な公平性は確保されません。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '制度には誰でも申し込めることになっています。\nしかし、複雑な書類を書く時間や知識がない人は利用できません。\nそれでは実際には公平ではありません。',
      '入口が全員に開かれているだけでは足りません。\n必要な情報や時間を持たない人にも使えるよう、支援を用意する必要があります。',
    ],
    modelEn: [
      'A program may officially be open to everyone. However, people without the time or knowledge to complete complex forms cannot use it. In practice, this is not fair.',
      'Equal formal access is not enough. A system needs support for people who lack the information or time required to use it.',
    ],
    explanation: '形式的な利用資格と、実際に申請できる条件を別の文で対比します。',
  },
  {
    id: 'sj-0019',
    stage: 6,
    originalJa: '反対意見を検討することは自説を弱める行為ではなく、自説がどの条件で成り立つのかを明確にする作業です。',
    targetPoints: ['subject', 'basicWords', 'connector'],
    modelSimplified: [
      '反対意見を考えても、自分の主張が弱くなるわけではありません。\nむしろ、自分の主張が成り立つ条件を見つけられます。',
      '別の立場からの疑問に答えます。\nすると、自分の主張の範囲と限界がはっきりします。',
    ],
    modelEn: [
      'Considering opposing views does not weaken our argument. Instead, it helps us identify the conditions under which the argument holds.',
      'When we answer questions from another position, the scope and limits of our own claim become clearer.',
    ],
    explanation: '「自説を弱める」と「条件を明確にする」を対比し、論証上の役割を示します。',
  },
  {
    id: 'sj-0020',
    stage: 6,
    originalJa: 'ある指標を目標として強く意識するほど、人々が指標の改善だけを目指し、本来測るべき成果から行動がずれることがあります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '組織が一つの数字だけを目標にします。\nすると、人々はその数字を上げる行動を選びます。\nしかし、本当に必要な成果がよくなるとは限りません。',
      '例えば、作文の数だけを評価すると、生徒は多く書こうとします。\nその結果、考え直したり直したりする時間が減るかもしれません。',
    ],
    modelEn: [
      'An organization makes one number its main target. People then act to raise that number, but the real outcome may not improve.',
      'For example, if schools evaluate only the number of essays, students may write more but spend less time planning and revising.',
    ],
    explanation: '指標、指標を上げる行動、本来の成果という三段階に分け、必要なら例を添えます。',
  },
])

export const simplificationTaskById = new Map(
  simplificationTasks.map((task) => [task.id, task]),
)
