import { defineSimplificationTasks } from '../factories'

export const simplificationPackCAdditions = defineSimplificationTasks([
  {
    id: 'sj-0055',
    stage: 5,
    originalJa: '科学的な不確実性を率直に示すことは信頼を損なうどころか、何が判明しており何が未解明なのかを社会と共有するために不可欠です。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '研究者は、分かったことと、まだ分からないことを分けて説明します。\n不確実な点を隠さない方が、市民は情報を正しく判断できます。',
      '科学には確かな部分と不確かな部分があります。\n両方を伝えると、人々は結論の限界も含めて理解できます。',
    ],
    modelEn: [
      'Researchers should explain what is known and what remains unknown. When they do not hide uncertainty, the public can judge the information more accurately.',
      'Science contains both firm findings and uncertain points. Communicating both helps people understand the limits of a conclusion.',
    ],
    explanation: '「信頼」と「不確実性」の関係を、研究者が二種類の情報を伝える行動へほどきます。',
  },
  {
    id: 'sj-0056',
    stage: 5,
    originalJa: '業績を測る指標が組織の目標そのものになると、数値を改善する行動が優先され、本来求められる仕事の質が後景に退く場合があります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '会社が処理した件数だけで社員を評価します。\nすると、社員は件数を増やそうとします。\n一件ずつ丁寧に対応する時間が減るかもしれません。',
      '数字は仕事の一部を測る道具です。\nその数字だけを目標にすると、数字に表れない質が低下することがあります。',
    ],
    modelEn: [
      'A company evaluates workers only by the number of cases they complete. Workers then try to raise that number and may spend less time serving each customer carefully.',
      'A measure shows only one part of a job. If the measure becomes the goal, quality that it cannot capture may decline.',
    ],
    explanation: '抽象的な「指標と質」を、処理件数と一件への対応時間という例に置き換えます。',
  },
  {
    id: 'sj-0057',
    stage: 5,
    originalJa: '表現の自由を尊重することと、発言によって現実に生じる被害を放置しないことは、単純な二者択一として扱うべきではありません。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '人は自分の意見を述べる自由を持ちます。\n同時に、脅迫や個人情報の公開による被害から人を守る必要があります。\n二つを区別して考えます。',
      '意見への反対と、人を危険にさらす発言への対応は同じではありません。\n自由を守りながら、具体的な被害を防ぐ規則が必要です。',
    ],
    modelEn: [
      'People have the right to express their opinions. At the same time, society must protect people from harm caused by threats or the exposure of private information.',
      'Disagreeing with an opinion is different from responding to speech that puts someone in danger. Rules should protect freedom while preventing specific harm.',
    ],
    explanation: '「自由か規制か」ではなく、意見への反対と具体的な被害を区別します。',
  },
  {
    id: 'sj-0058',
    stage: 5,
    originalJa: '教育内容の標準化は最低限の学習機会を保障する一方、地域や生徒の状況に応じた柔軟な授業を狭める可能性もあります。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      '共通の学習内容があれば、どの地域の生徒も基本を学べます。\nしかし、先生が地域の課題や生徒の関心を授業に入れる時間が減ることもあります。',
      '全国で同じ基準を使うと、学ぶ内容の差を小さくできます。\n一方で、学校が生徒に合わせて内容を変える余地も必要です。',
    ],
    modelEn: [
      'A common curriculum ensures that students in every region learn the basics. However, it may leave teachers less time for local issues and student interests.',
      'National standards can reduce differences in what students learn. Schools still need room to adapt lessons to their students.',
    ],
    explanation: '標準化の利点と制約を、基本を学ぶ機会と授業を変える余地で対比します。',
  },
  {
    id: 'sj-0059',
    stage: 5,
    originalJa: '行政サービスを一律に集約すれば効率は上がるかもしれませんが、地域固有の事情を踏まえた迅速な判断が難しくなるおそれがあります。',
    targetPoints: ['subject', 'concrete', 'connector'],
    modelSimplified: [
      '複数の地域の仕事を一つの役所に集めると、費用を減らせることがあります。\nしかし、その役所は各地域の交通や人口を詳しく知らず、対応が遅れるかもしれません。',
      '中央で同じ方法を使えば、事務を効率化できます。\n一方で、地域の担当者が現場に合わせて決める力も残す必要があります。',
    ],
    modelEn: [
      'Combining services in one office may reduce costs. However, that office may not understand local transport or population needs, and its response may be slow.',
      'Using one central system can make administration more efficient. Local staff still need the power to respond to conditions in their area.',
    ],
    explanation: '「地域固有の事情」を、交通、人口、現場での判断という具体的な要素にします。',
  },
  {
    id: 'sj-0060',
    stage: 5,
    originalJa: '気候変動対策の費用を現在の負担だけで評価すると、対策を先送りした結果を将来世代が引き受けるという時間的な不公平を見落とします。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '気候対策には今、お金がかかります。\nしかし、対策を遅らせると、将来の人々がより大きな災害と費用に直面するかもしれません。',
      '現在の安さだけで政策を選んではいけません。\n今行動しない場合に、次の世代が何を負担するかも比べる必要があります。',
    ],
    modelEn: [
      'Climate action costs money now. However, delaying it may leave future generations with greater disasters and higher costs.',
      'We should not choose a policy only because it is cheaper today. We must also consider what the next generation will bear if we fail to act.',
    ],
    explanation: '「時間的な不公平」を、現在の費用と将来世代が負う災害や費用の比較にします。',
  },
  {
    id: 'sj-0061',
    stage: 6,
    originalJa: '二つの現象が同時に生じているという事実は、一方が他方の原因であることを直ちに意味せず、第三の要因や逆方向の影響も検討しなければなりません。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '二つの出来事が一緒に増えても、一方が他方を起こしたとは限りません。\n別の原因が両方に影響した可能性があります。\n原因と結果が逆かもしれません。',
      '同時に起きることと、原因になることは違います。\n結論を出す前に、ほかの原因と影響の向きを調べる必要があります。',
    ],
    modelEn: [
      'When two events increase together, one does not necessarily cause the other. A third factor may affect both, or the direction of cause and effect may be reversed.',
      'Happening together is not the same as causing something. Before drawing a conclusion, we must examine other causes and the direction of the relationship.',
    ],
    explanation: '相関と因果を分け、第三の要因と逆方向の因果という二つの可能性を短文で示します。',
  },
  {
    id: 'sj-0062',
    stage: 6,
    originalJa: '成果を個人の努力だけに帰する見方は、出発点となる教育機会や周囲から得られる支援の差を不可視化し、格差を正当化しかねません。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '努力は成果に影響します。\nしかし、全員が同じ学校、時間、支援から始めるわけではありません。\n結果だけを見て努力の差だと決めるのは公平ではありません。',
      'ある人は静かな勉強場所や助言を得られますが、別の人は得られません。\n成功を本人の努力だけで説明すると、この違いを見落とします。',
    ],
    modelEn: [
      'Effort affects achievement, but people do not begin with the same education, time, or support. It is unfair to explain every result as a difference in effort.',
      'One person may have a quiet place to study and helpful advice, while another does not. Attributing success only to personal effort hides this difference.',
    ],
    explanation: '「出発点の差」を、学校、時間、勉強場所、助言の有無へ具体化します。',
  },
  {
    id: 'sj-0063',
    stage: 6,
    originalJa: '技術は中立的な道具にすぎないという主張は、設計段階で誰の利便性を優先し、どの行動を促すかという価値判断が組み込まれる点を見過ごしています。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '技術の使い方だけでなく、作り方にも価値判断があります。\n設計者は、どの機能を目立たせ、誰が使いやすい形にするかを選びます。',
      'アプリは単なる道具ではありません。\n通知や初期設定によって、利用者が何を見るか、どれほど長く使うかに影響します。',
    ],
    modelEn: [
      'Values shape not only how technology is used but also how it is designed. Designers choose which features to emphasize and whose needs to prioritize.',
      'An app is not simply a neutral tool. Its notifications and default settings influence what users see and how long they remain on it.',
    ],
    explanation: '「価値判断が組み込まれる」を、設計者が機能、利用者、初期設定を選ぶこととして表します。',
  },
  {
    id: 'sj-0064',
    stage: 6,
    originalJa: '文化を保存するという営みを過去の形の固定と同一視すれば、担い手が新しい状況に応じて意味を作り替えてきた歴史そのものを否定することになります。',
    targetPoints: ['subject', 'oneIdea', 'basicWords'],
    modelSimplified: [
      '文化を守ることは、昔の形を一切変えないことではありません。\n人々は新しい生活に合わせて習慣を変えながら、その意味を伝えてきました。',
      '伝統は同じ形のまま残ってきたのではありません。\n次の世代は大切な部分を受け継ぎ、自分たちの状況に合う形にします。',
    ],
    modelEn: [
      'Protecting a culture does not mean keeping every old form unchanged. People have adapted customs to new ways of life while passing on their meaning.',
      'Traditions have not survived in a completely fixed form. Each generation preserves what matters and adapts it to new conditions.',
    ],
    explanation: '保存を固定と考えず、大切な意味を保ちながら形を変える過程に言い換えます。',
  },
  {
    id: 'sj-0065',
    stage: 6,
    originalJa: '緊急時に行政へ強い権限を与える必要があるとしても、その必要性を理由に期間や検証の手続きを曖昧にすれば、例外的な措置が常態化する危険があります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '災害などの緊急時には、行政が早く決める必要があります。\nそれでも、強い権限には終了日と見直しの手続きを定めます。\nそうしなければ、緊急措置が長く残るかもしれません。',
      '緊急の権限を認める場合も、いつ終えるかを決める必要があります。\n議会や裁判所が後で判断を確認できるようにします。',
    ],
    modelEn: [
      'During an emergency, the government may need to act quickly. Even so, special powers need an end date and a review process, or they may remain in place too long.',
      'Emergency authority should include a clear time limit. Legislatures or courts must also be able to review the decisions later.',
    ],
    explanation: '「例外の常態化」を、終了日、見直し、外部による確認がない状態として示します。',
  },
  {
    id: 'sj-0066',
    stage: 6,
    originalJa: 'アルゴリズムの判断過程が複雑で説明困難であることは、その判断によって不利益を受けた人に異議申立ての機会を与えなくてよい理由にはなりません。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      'システムの仕組みを完全に説明できない場合があります。\nそれでも、不利益を受けた人は理由を知り、人間に再確認を求められるべきです。',
      'AIが融資や採用を断ったとき、利用者には質問する窓口が必要です。\n担当者がデータと判断を見直せるようにします。',
    ],
    modelEn: [
      'A system may be too complex to explain fully. Even so, a person harmed by its decision should receive a reason and be able to request human review.',
      'When AI rejects a loan or job application, the applicant needs a way to ask questions. A staff member should be able to review the data and decision.',
    ],
    explanation: '「異議申立て」を、理由を知り、窓口で質問し、人間の再確認を求める手順にします。',
  },
  {
    id: 'sj-0067',
    stage: 6,
    originalJa: '平均値の改善を集団全体の状況改善とみなすと、利益が一部に集中し、別の層では状況が悪化している可能性を覆い隠します。',
    targetPoints: ['subject', 'concrete', 'oneIdea'],
    modelSimplified: [
      '全体の平均が上がっても、全員の状況が良くなったとは限りません。\n一部の人の大きな改善が平均を上げ、別の人の悪化を隠すことがあります。',
      '平均だけでなく、年齢、地域、所得などのグループごとの数字も見ます。\n誰が利益を得て、誰が取り残されたかを確認します。',
    ],
    modelEn: [
      'A higher average does not mean that everyone is better off. A large gain for one group may raise the average while hiding a decline for another.',
      'We should examine results by age, region, and income as well as the overall average. This shows who benefited and who was left behind.',
    ],
    explanation: '平均の問題を、一部の改善が別の層の悪化を隠す具体的な仕組みへ言い換えます。',
  },
  {
    id: 'sj-0068',
    stage: 6,
    originalJa: '専門家の合意を尊重することと異論を排除することは同じではなく、少数意見であっても新たな証拠や検証可能な反例を示すなら検討に値します。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      '多くの専門家が同じ結論を支持するなら、その合意には重みがあります。\nしかし、少数の研究者が新しい証拠を示した場合は、その証拠を調べる必要があります。',
      '異論が少数だからという理由だけで退けてはいけません。\n主張を確かめられるデータや反例があるかを基準に判断します。',
    ],
    modelEn: [
      'When many experts support the same conclusion, their agreement carries weight. However, new evidence offered by a minority still deserves examination.',
      'A dissenting view should not be rejected only because few people hold it. We should ask whether it offers testable data or a counterexample.',
    ],
    explanation: '合意の重みと異論の検討条件を分け、人数ではなく証拠を判断基準にします。',
  },
  {
    id: 'sj-0069',
    stage: 6,
    originalJa: '結果を元に戻せない政策ほど、完全な確実性を待つのではなく、損失の大きさと判断を修正できる余地を比較した上で慎重に決める必要があります。',
    targetPoints: ['subject', 'oneIdea', 'concrete'],
    modelSimplified: [
      '政策の結果を後で元に戻せないことがあります。\nその場合、何もしない損失と行動する損失を比べます。\n小さく試し、見直せる方法があるかも考えます。',
      'すべてが確実になるまで待てない問題もあります。\n決定の前に、失敗した場合の被害と、途中で方針を変えられるかを確認します。',
    ],
    modelEn: [
      'Some policy outcomes cannot be reversed. In such cases, we must compare the harm of acting with the harm of doing nothing and look for a limited trial that can be reviewed.',
      'We cannot always wait for complete certainty. Before deciding, we should assess the possible damage and whether the policy can be changed later.',
    ],
    explanation: '不可逆性への対応を、二種類の損失、小規模な試行、見直し可能性の比較にします。',
  },
  {
    id: 'sj-0070',
    stage: 6,
    originalJa: '歴史的出来事を現在の価値観だけで断罪することも、当時の常識を理由に免責することも、行為が置かれた文脈とその被害を同時に理解する妨げになります。',
    targetPoints: ['subject', 'oneIdea', 'connector'],
    modelSimplified: [
      '過去の行為を考えるとき、当時の社会状況を調べます。\n同時に、その行為で誰がどのような被害を受けたかも見ます。\nどちらか一方だけでは十分ではありません。',
      '現在の基準だけで過去を判断すると、当時の選択肢を見落とします。\nしかし、当時は普通だったという理由だけで被害を無視してはいけません。',
    ],
    modelEn: [
      'When judging an action in the past, we should study its historical context and also identify who was harmed. Considering only one side is not enough.',
      'Present standards alone may hide the choices people faced in the past. However, saying that an action was normal at the time does not erase its harm.',
    ],
    explanation: '現在の評価、当時の文脈、実際の被害という三要素を分けてから結び直します。',
  },
])
