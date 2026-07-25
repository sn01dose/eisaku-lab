import { makeExtendedWritingTasks, type ExtendedWritingSeed } from '../factories'

const seeds = [
  [
    '大学は、専攻にかかわらず全学生に科学リテラシーを学ばせるべきだ、という意見について120〜200語で論じてください。',
    [
      'Universities should require all students to study basic scientific literacy, although the course should not simply repeat high school science. Citizens regularly face claims about health, climate, statistics, and new technologies. To judge these claims, they need to understand evidence, uncertainty, correlation, and the limits of a study. These skills matter to lawyers, teachers, journalists, and voters as much as to scientists. Critics may argue that a common requirement reduces time for specialized study. A focused course, however, could use cases from each student’s field and teach a method of evaluation rather than a large body of facts. For example, students could compare how two news reports interpret the same research. The aim would not be to make everyone a scientist. It would be to help graduates ask informed questions, recognize unsupported certainty, and make responsible decisions in a society shaped by science.',
      'A compulsory scientific-literacy course would be valuable if universities designed it around reasoning and communication. Modern public debates often include numerical evidence, yet a graph or technical term can appear convincing even when the underlying method is weak. Students should learn to ask who collected the data, what was measured, which alternatives were excluded, and how certain the conclusion is. They should also practice explaining uncertainty without suggesting that nothing is known. Some students may already have these skills, so universities could offer an assessment and allow advanced alternatives. This would answer the concern that requirements waste time. Shared minimum competence and flexible routes are compatible. Whatever their careers, graduates will encounter scientific claims that influence personal choices and public policy. Universities therefore have a responsibility to prepare them to evaluate such claims rather than merely accept or reject them.',
    ],
    ['writing.argument', 'writing.paragraphStructure', 'writing.connector'],
    ['runOn', 'wordChoice', 'article'],
    'timed',
    '教育制度',
    '必修化の目的、想定される反論、授業内容、制度上の調整を一つの論証にします。',
    120,
    200,
    true,
    true,
    true,
  ],
  [
    '公共空間での顔認証技術について、安全とプライバシーの両面から120〜200語で論じてください。',
    [
      'Facial recognition in public spaces may help investigators identify a specific suspect, but continuous use would threaten privacy and could change how people behave. Unlike a guard who observes one place, a networked system can track movements over time and connect them with other data. Errors also do not affect everyone equally; a false match may lead to questioning or exclusion. Governments should therefore prohibit general real-time tracking and permit narrowly defined searches only for serious cases with independent authorization. Agencies must publish accuracy data, delete unrelated records quickly, and provide a way to challenge mistakes. Supporters may say these limits reduce the technology’s speed. That is precisely why legal safeguards are needed: convenience for authorities should not silently become permanent surveillance. Public safety is important, but a system is legitimate only when its necessity, effectiveness, and impact on rights can be examined.',
      'The debate over facial recognition should not be framed as a simple choice between safety and privacy. In a limited emergency, comparing an image with a specific list might help find a missing person. Scanning everyone continuously is a different practice because it treats ordinary movement as data to be stored and analyzed. Before any use, authorities should demonstrate that less intrusive methods are insufficient. The law should specify the purpose, location, time limit, and people who may access the results. Independent audits must test accuracy across demographic groups, and automatic matches should never count as proof by themselves. Citizens also need notice and an effective complaint process. These conditions may make deployment slower, but speed is not the only measure of public value. Careful limits can preserve genuinely useful cases while preventing a temporary tool from becoming an invisible system of social control.',
    ],
    ['writing.argument', 'writing.paragraphStructure', 'writing.connector'],
    ['runOn', 'literalTranslation', 'wordChoice'],
    'timed',
    '科学技術',
    '用途を限定し、一般監視との違い、誤判定、法的条件、検証可能性を扱います。',
    120,
    200,
    true,
    true,
    true,
  ],
  [
    '次の内容を120〜160語の英語で要約してください。「都市の緑地は気温を下げ、雨水を吸収し、住民の運動や交流の場になる。しかし、緑地を新しく整備すると周辺の家賃が上がり、従来の住民が住み続けられなくなる場合がある。公平な計画には、緑地整備と住宅支援を同時に進め、利用状況だけでなく住民構成の変化も追うことが必要である。」',
    [
      'Urban green spaces provide several environmental and social benefits. Trees and soil can reduce heat and absorb rainwater, while parks give residents places to exercise and meet one another. However, creating an attractive new park can raise nearby rents and push out people who lived in the area before the improvement. A project intended to help a community may therefore distribute its benefits unfairly. Cities should combine investment in green space with measures that protect affordable housing and existing residents. They should also evaluate more than the number of park users. Changes in rent, housing stability, and the composition of the neighborhood can reveal whether local people are able to share in the improvement. Fair urban greening means improving the environment without making the area unaffordable to the community it was meant to serve.',
      'Parks and other urban green areas can cool neighborhoods, manage storm water, and support exercise and social contact. These gains, however, may come with an unintended cost. When a new green space makes an area more desirable, housing prices can increase and long-term residents may be displaced. For this reason, environmental planning and housing policy should not be treated separately. A fair plan would preserve affordable homes, consult residents, and monitor who remains in the neighborhood after the project is completed. Visitor numbers alone cannot show whether the policy has succeeded. Officials should also examine rent changes and housing security over time. The central challenge is to create healthier urban spaces while ensuring that the people who already live nearby can continue to live there and benefit from them.',
    ],
    ['writing.summary', 'writing.paraphrase', 'writing.paragraphStructure'],
    ['literalTranslation', 'runOn', 'wordChoice'],
    'summary',
    '環境',
    '利点、意図しない問題、公平にする条件という中心構造を残し、例の追加は避けます。',
    120,
    160,
    true,
    false,
    true,
  ],
  [
    '「測定できるものだけを目標にすると、本来の目的が損なわれることがある」という考えを、教育または社会の具体例とともに120〜200語で論じてください。',
    [
      'Measurable targets can guide improvement, but they may distort education when the measure becomes the purpose. Suppose a school judges writing instruction only by the number of essays students complete. Teachers and students may produce more texts, yet spend less time planning, revising, or discussing whether an argument is clear. The count rises while the ability the count was meant to represent does not. Schools should therefore use several kinds of evidence: finished work, changes between drafts, explanations of choices, and performance on later tasks. Numbers remain useful because they reveal patterns and make goals visible. They should function as signals that invite further questions, not as complete definitions of success. Good evaluation begins by stating the educational purpose and then choosing measures that illuminate it. When the purpose is forgotten, an efficient-looking system can reward activity while discouraging genuine learning.',
      'A target can change behavior in ways that undermine its original goal. For example, a city might evaluate a job-support program only by how quickly participants find employment. Staff would then have an incentive to direct people toward the first available position, even if the work is unstable or unrelated to their skills. The reported placement rate could improve while long-term employment becomes worse. A better evaluation would include job retention, income stability, participant choice, and follow-up after several months. No measure is perfect, and collecting more data also has costs. Nevertheless, combining indicators makes it harder for one narrow number to control every decision. Institutions should regularly ask whether people are improving the real outcome or merely improving the score. Measurement supports responsible policy only when it remains connected to the purpose it was designed to serve.',
    ],
    ['writing.argument', 'writing.paragraphStructure', 'writing.paraphrase'],
    ['runOn', 'wordChoice', 'article'],
    'timed',
    '論証',
    '抽象的な主張を具体例に落とし、指標が行動を変える仕組みと改善策を説明します。',
    120,
    200,
    true,
    true,
    true,
  ],
] satisfies readonly ExtendedWritingSeed[]

export const extendedWritingStage6 = makeExtendedWritingTasks(6, 122, seeds)
