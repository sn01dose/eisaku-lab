import { defineSimplificationTasks } from '../factories'

export const simplificationPackAAdditions = defineSimplificationTasks([
  {
    id: 'sj-0021',
    stage: 2,
    originalJa: '限られた部活動の時間を有効に活用するためには、練習の目標と順序を部員全員で共有しておくことが望ましいです。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '部員には練習時間が限られています。\n最初に、今日の目標と練習の順番を全員で確認します。\nすると時間を有効に使えます。',
      '練習を始める前に、部員が目標と予定を共有します。\nその結果、短い時間でも集中して練習できます。',
    ],
    modelEn: [
      "Club members have limited practice time. Before they begin, they should share the day's goal and schedule. This helps them use their time well.",
      'Members can practice efficiently in a short time if they agree on their goal and plan first.',
    ],
    explanation: '時間、部員の行動、その結果を別々の文にして、主語を明確にします。',
  },
  {
    id: 'sj-0022',
    stage: 2,
    originalJa: '給食の食べ残しを減らすには、生徒の好みだけでなく、一人ひとりが食べられる量の違いにも配慮する必要があります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '生徒が食べられる量はそれぞれ違います。\n学校は量を選べるようにします。\nそうすれば、給食の食べ残しを減らせます。',
      'すべての生徒に同じ量を出すと、食べ残しが増えることがあります。\n生徒が自分に合う量を選べる仕組みが必要です。',
    ],
    modelEn: [
      'Students can eat different amounts. Schools should let them choose a suitable portion. This can reduce food waste at lunch.',
      'Serving every student the same amount may increase waste. Students need a way to choose how much food they receive.',
    ],
    explanation: '「配慮する」を、学校が給食の量を選べるようにする行動へ置き換えます。',
  },
  {
    id: 'sj-0023',
    stage: 2,
    originalJa: '近い距離の移動に自転車を使うことは、健康の維持と環境への負担の軽減の両方に役立ちます。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '近い場所へ行くとき、私たちは自転車を使えます。\n自転車に乗ると運動になります。\nまた、車の排気ガスを出しません。',
      '自転車は体を動かす機会を増やします。\n短い移動で車を使わなければ、環境への負担も減らせます。',
    ],
    modelEn: [
      'We can ride a bicycle to nearby places. Cycling gives us exercise and produces no car exhaust.',
      'Bicycles help us exercise. Using them for short trips can also reduce the harm caused by cars.',
    ],
    explanation: '健康と環境という二つの効果を、一文ずつ具体的に述べます。',
  },
  {
    id: 'sj-0024',
    stage: 2,
    originalJa: '授業中に疑問点を質問することは、自分だけでなく、同じ点で困っているほかの生徒の理解にもつながります。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '分からないことがあれば、生徒は先生に質問します。\nその答えは、同じ疑問を持つほかの生徒にも役立ちます。',
      '一人の生徒が質問すると、先生がその点を説明します。\nクラス全体が内容を理解しやすくなります。',
    ],
    modelEn: [
      'When a student does not understand something, they can ask the teacher. The answer may also help other students with the same question.',
      "One student's question gives the teacher a chance to explain the point. This can help the whole class understand it.",
    ],
    explanation: '質問する人、説明する人、助かる人を分けて、動作の主体を示します。',
  },
  {
    id: 'sj-0025',
    stage: 2,
    originalJa: '図書館での読み聞かせボランティアは、子どもが本に親しむきっかけをつくると同時に、地域の世代間交流を促します。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '地域の人が図書館で子どもに本を読みます。\n子どもは本を楽しむ機会を得ます。\nまた、違う世代の人と話せます。',
      '読み聞かせでは、大人と子どもが同じ本を楽しみます。\nこの活動は子どもを本に近づけ、世代の違う人を結びます。',
    ],
    modelEn: [
      'Local volunteers read books to children at the library. Children can enjoy books and talk with people from another generation.',
      'At a reading event, adults and children enjoy the same story. The activity brings children closer to books and connects generations.',
    ],
    explanation: '「親しむきっかけ」と「世代間交流」を、読むことと話すことに分けます。',
  },
  {
    id: 'sj-0026',
    stage: 3,
    originalJa: 'スマートフォンの通知を常に確認する習慣は、短時間の中断を繰り返し生じさせ、学習への集中を保ちにくくします。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      'スマートフォンの通知が来るたびに、生徒は画面を見ます。\nそのたびに勉強が止まります。\nそのため、集中を続けにくくなります。',
      '通知を何度も確認すると、学習が細かく中断されます。\n集中する時間を作るには、通知を切ることが役立ちます。',
    ],
    modelEn: [
      'Students look at their phones whenever a notification arrives. Each look interrupts their study, so it becomes hard to stay focused.',
      'Checking notifications repeatedly breaks study time into small pieces. Turning them off can help students concentrate.',
    ],
    explanation: '通知を見る行動、中断、集中への影響を順番に分けて因果を示します。',
  },
  {
    id: 'sj-0027',
    stage: 3,
    originalJa: 'グループで課題に取り組むと多様な意見を得られる反面、合意を形成するまでに時間がかかる場合があります。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      'グループでは、メンバーが違う意見を出します。\nそれは考えを広げる助けになります。\n一方で、全員が同意するまで時間がかかることもあります。',
      '共同作業には利点があります。\n私たちは多くの考えを聞けます。\nしかし、一つの結論を選ぶのは簡単ではありません。',
    ],
    modelEn: [
      "Group members offer different opinions, which can broaden everyone's thinking. However, reaching an agreement may take time.",
      'Working in a group lets us hear many ideas. On the other hand, choosing one conclusion is not always easy.',
    ],
    explanation: '多様な意見という利点と、合意に必要な時間を別の文で対比します。',
  },
  {
    id: 'sj-0028',
    stage: 3,
    originalJa: 'ニュースを正確に理解するには、記事の内容だけでなく、誰がどのような根拠に基づいて発信したのかを確かめる姿勢が重要です。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '私たちはニュースの内容を読みます。\nさらに、発信した人と、その人が示す根拠を確認します。\nそれから情報を信じるか判断します。',
      '記事だけを見てすぐに信じてはいけません。\n情報源と証拠を調べると、内容が信頼できるか考えやすくなります。',
    ],
    modelEn: [
      'We read the content of a news report and check who published it and what evidence it gives. Then we decide whether to trust it.',
      'We should not trust an article immediately. Checking its source and evidence helps us judge whether it is reliable.',
    ],
    explanation: '「確かめる姿勢」を、情報源と根拠を調べてから判断する手順にします。',
  },
  {
    id: 'sj-0029',
    stage: 3,
    originalJa: '適度な運動には体力を高める効果だけでなく、気分を切り替え、学習への意欲を取り戻しやすくする効果もあります。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '適度な運動は体を強くします。\nまた、運動すると気分が変わります。\nその後、勉強を始めやすくなることがあります。',
      '少し体を動かすと、私たちは休憩できます。\n気持ちが新しくなり、もう一度学習に向かいやすくなります。',
    ],
    modelEn: [
      'Moderate exercise makes our bodies stronger. It can also refresh our minds and help us return to studying.',
      'Moving our bodies for a short time gives us a break. We may then feel ready to study again.',
    ],
    explanation: '体力、気分、学習意欲への効果を分け、基本動詞で表します。',
  },
  {
    id: 'sj-0030',
    stage: 3,
    originalJa: '地域の行事を継続する意義は、伝統を保存することに加え、住民が顔を合わせて関係を築く場を保つことにあります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '地域の行事は伝統を次の世代へ伝えます。\nまた、住民が集まって話す場所になります。\nそこで人々は互いを知ることができます。',
      '住民が行事を続けると、昔からの習慣が残ります。\n同時に、近所の人と会う機会も残ります。',
    ],
    modelEn: [
      'Local events pass traditions on to the next generation. They also give residents a place to meet and get to know one another.',
      'Continuing a community event preserves an old custom and keeps an opportunity for neighbors to meet.',
    ],
    explanation: '「意義」を、伝統を伝えることと住民が会うことの二つに分けます。',
  },
  {
    id: 'sj-0031',
    stage: 3,
    originalJa: '公共交通機関に遅れが生じた際、正確な情報を早く提供することは、利用者の不安を減らし、次の行動を選びやすくします。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      '電車やバスが遅れたとき、運営会社は正しい情報をすぐに伝えます。\n利用者は状況を理解できます。\nそのため、別の道を選びやすくなります。',
      '利用者は、遅れの理由と見込み時間を知る必要があります。\n情報があれば、待つか別の交通手段を使うか決められます。',
    ],
    modelEn: [
      'When a train or bus is delayed, the operator should quickly give accurate information. Passengers can then choose what to do next.',
      'Passengers need to know the reason for a delay and how long it may last. This information helps them decide whether to wait or take another route.',
    ],
    explanation: '情報を出す主体と、情報を使って判断する利用者を別の文にします。',
  },
  {
    id: 'sj-0032',
    stage: 3,
    originalJa: 'オンラインで提出した課題に具体的な助言が返されれば、生徒は場所に関係なく自分の弱点を把握して学び直せます。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '先生はオンラインで課題に助言を書きます。\n生徒は家でもその助言を読めます。\n直す点を知り、もう一度練習できます。',
      '生徒が課題を送ると、先生が具体的なコメントを返します。\n生徒は間違えた理由を確認して学び直せます。',
    ],
    modelEn: [
      'Teachers write feedback on work submitted online. Students can read it at home, identify what to improve, and practice again.',
      'When students send in an assignment, teachers can return specific comments. The students can then review why they made mistakes.',
    ],
    explanation: '「弱点を把握」を、助言を読んで直す点を知る行動として表します。',
  },
  {
    id: 'sj-0033',
    stage: 3,
    originalJa: 'AIが示した説明は学習の手がかりになりますが、その内容が常に正しいとは限らないため、資料で確認する必要があります。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      'AIの説明は勉強に役立つことがあります。\nしかし、AIが誤った情報を出すこともあります。\n大切な内容は教科書などで確認します。',
      '学習者はAIから考え方のヒントを得られます。\nそれでも、答えをそのまま信じず、別の資料と比べる必要があります。',
    ],
    modelEn: [
      'AI explanations can help us study. However, AI sometimes gives incorrect information, so we should check important points in reliable sources.',
      'Learners can get useful hints from AI. Even so, they need to compare its answers with other materials instead of trusting them immediately.',
    ],
    explanation: 'AIの利点、誤りの可能性、学習者が確認する行動を三文に分けます。',
  },
  {
    id: 'sj-0034',
    stage: 3,
    originalJa: '学習計画は一度決めた通りに守ることよりも、進み具合を確かめながら現実的に調整することが重要です。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '学習者は最初に計画を立てます。\nその後、実際にどこまで進んだかを確認します。\n必要なら計画を変えます。',
      '計画を必ず守ることだけが大切なのではありません。\n進み方に合わせて、無理のない予定に直すことも大切です。',
    ],
    modelEn: [
      'Learners make a plan and then check their actual progress. They should change the plan when necessary.',
      'Following a plan exactly is not the only goal. It is also important to adjust it to a realistic schedule.',
    ],
    explanation: '計画を立てる、進み方を見る、計画を変えるという三つの行動にほどきます。',
  },
  {
    id: 'sj-0035',
    stage: 3,
    originalJa: '観光地で複数の言語による案内を用意することは、旅行者の利便性を高めるだけでなく、地域のルールを守ってもらうことにもつながります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '地域は案内をいくつかの言語で書きます。\n旅行者は道や施設を理解しやすくなります。\nまた、ごみや騒音のルールも知ることができます。',
      '多言語の表示は旅行者を助けます。\n地域の決まりも説明すれば、旅行者は適切に行動しやすくなります。',
    ],
    modelEn: [
      'A community can provide signs in several languages. Visitors can find places more easily and learn local rules about litter and noise.',
      'Multilingual information helps travelers. When it also explains local rules, visitors are more likely to act appropriately.',
    ],
    explanation: '「利便性」と「ルールを守る」を、案内から得られる具体的な情報に変えます。',
  },
  {
    id: 'sj-0036',
    stage: 4,
    originalJa: '在宅勤務は通勤の負担を軽減する一方で、同僚との偶発的な会話が減り、孤立を感じやすくなるという課題もあります。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      '在宅勤務をすると、働く人は通勤しなくてよくなります。\nしかし、同僚と自然に話す機会が減ります。\nそのため、一人だと感じる人もいます。',
      '家で働けば、移動の時間を節約できます。\n一方で、職場での短い会話がなくなり、人とのつながりが弱くなることがあります。',
    ],
    modelEn: [
      'Working from home removes the need to commute. However, workers have fewer casual conversations with colleagues and may feel isolated.',
      'Remote work can save travel time. On the other hand, losing brief workplace conversations may weaken social connections.',
    ],
    explanation: '通勤の利点と会話が減る課題を分け、働く人を主語にします。',
  },
  {
    id: 'sj-0037',
    stage: 4,
    originalJa: '制服が学校への帰属意識を育てるという考えがある一方で、服装による自己表現を制限すると感じる生徒もいます。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      '制服を着ると、学校の一員だと感じる生徒がいます。\n一方で、自分らしい服を選べないと感じる生徒もいます。',
      '制服には、学校のまとまりを示す役割があります。\nしかし、服で自分を表したい生徒には制限になることがあります。',
    ],
    modelEn: [
      'Some students feel that uniforms make them part of their school. Others feel that uniforms keep them from expressing themselves through clothing.',
      'Uniforms can represent unity at school. However, they may limit students who want to express themselves through what they wear.',
    ],
    explanation: '異なる意見を持つ生徒をそれぞれ主語にし、一文へ詰め込みません。',
  },
  {
    id: 'sj-0038',
    stage: 4,
    originalJa: '再生可能エネルギーを安定して利用するには、発電設備を増やすだけでなく、天候による変動を補う蓄電の仕組みも整える必要があります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '太陽光や風力の発電量は天候で変わります。\nそのため、電気が多いときに蓄える設備が必要です。\n必要なときにその電気を使います。',
      '再生可能エネルギーの設備を増やすだけでは十分ではありません。\n安定して電気を届けるには、電気を保存する仕組みも必要です。',
    ],
    modelEn: [
      'Solar and wind power change with the weather. We therefore need systems that store extra electricity and supply it when needed.',
      'Building more renewable power facilities is not enough. Energy storage is also necessary for a stable electricity supply.',
    ],
    explanation: '天候による変化、蓄える設備、使う場面の順にして必要性を示します。',
  },
])
