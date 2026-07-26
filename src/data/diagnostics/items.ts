import { defineDiagnosticItems } from '../factories'

export const diagnosticItems = defineDiagnosticItems([
  {
    id: 'dg-0001',
    section: 'spellChoice',
    skillIds: ['spelling.shortVowel'],
    payload: {
      promptJa: '「計画」という意味の正しいつづりを選んでください。',
      options: ['plen', 'plan', 'plann', 'plane'],
      answer: 'plan',
    },
    estimatedSeconds: 20,
  },
  {
    id: 'dg-0002',
    section: 'spellChoice',
    skillIds: ['spelling.silentLetter'],
    payload: {
      promptJa: '「答え」という意味の正しいつづりを選んでください。',
      options: ['anser', 'awnser', 'answer', 'answar'],
      answer: 'answer',
    },
    estimatedSeconds: 20,
  },
  {
    id: 'dg-0003',
    section: 'spellChoice',
    skillIds: ['spelling.vowelTeam'],
    payload: {
      promptJa: '「受け取る」という意味の正しいつづりを選んでください。',
      options: ['recieve', 'receve', 'receeve', 'receive'],
      answer: 'receive',
    },
    estimatedSeconds: 20,
  },
  {
    id: 'dg-0004',
    section: 'spellChoice',
    skillIds: ['spelling.doubleConsonant'],
    payload: {
      promptJa: '「必要な」という意味の正しいつづりを選んでください。',
      options: ['neccessary', 'necessary', 'necesary', 'necessery'],
      answer: 'necessary',
    },
    estimatedSeconds: 20,
  },
  {
    id: 'dg-0005',
    section: 'spellChoice',
    skillIds: ['spelling.suffix'],
    payload: {
      promptJa: '「責任」という意味の正しいつづりを選んでください。',
      options: ['responsability', 'responsibilty', 'responsibility', 'responsibillity'],
      answer: 'responsibility',
    },
    estimatedSeconds: 20,
  },
  {
    id: 'dg-0006',
    section: 'spellChoice',
    skillIds: ['spelling.irregular'],
    payload: {
      promptJa: '「リズム」という意味の正しいつづりを選んでください。',
      options: ['rythm', 'rhythym', 'rhithm', 'rhythm'],
      answer: 'rhythm',
    },
    estimatedSeconds: 20,
  },
  {
    id: 'dg-0007',
    section: 'dictation',
    skillIds: ['spelling.longVowel'],
    payload: { answer: 'write', meaningJa: '書く', wordId: 'sp-0002' },
    estimatedSeconds: 35,
  },
  {
    id: 'dg-0008',
    section: 'dictation',
    skillIds: ['spelling.irregular'],
    payload: { answer: 'because', meaningJa: 'なぜなら', wordId: 'sp-0025' },
    estimatedSeconds: 35,
  },
  {
    id: 'dg-0009',
    section: 'dictation',
    skillIds: ['spelling.suffix'],
    payload: { answer: 'development', meaningJa: '発展・開発', wordId: 'sp-0071' },
    estimatedSeconds: 35,
  },
  {
    id: 'dg-0010',
    section: 'dictation',
    skillIds: ['spelling.prefix', 'spelling.suffix'],
    payload: { answer: 'inequality', meaningJa: '不平等', wordId: 'sp-0120' },
    estimatedSeconds: 35,
  },
  {
    id: 'dg-0011',
    section: 'dictation',
    skillIds: ['spelling.doubleConsonant', 'spelling.irregular'],
    payload: { answer: 'accommodate', meaningJa: '対応する', wordId: 'sp-0140' },
    estimatedSeconds: 35,
  },
  {
    id: 'dg-0012',
    section: 'fillLetters',
    skillIds: ['spelling.vowelTeam'],
    payload: { display: 'fr__nd', answer: 'friend', meaningJa: '友人' },
    estimatedSeconds: 25,
  },
  {
    id: 'dg-0013',
    section: 'fillLetters',
    skillIds: ['spelling.doubleConsonant'],
    payload: { display: 'di__erent', answer: 'different', meaningJa: '異なる' },
    estimatedSeconds: 25,
  },
  {
    id: 'dg-0014',
    section: 'fillLetters',
    skillIds: ['spelling.suffix'],
    payload: { display: 'environ____', answer: 'environment', meaningJa: '環境' },
    estimatedSeconds: 25,
  },
  {
    id: 'dg-0015',
    section: 'fillLetters',
    skillIds: ['spelling.irregular'],
    payload: { display: 'q_e_tionnaire', answer: 'questionnaire', meaningJa: '質問票' },
    estimatedSeconds: 25,
  },
  {
    id: 'dg-0016',
    section: 'chunking',
    skillIds: ['spelling.prefix', 'spelling.suffix'],
    payload: {
      word: 'development',
      answer: ['de', 'velop', 'ment'],
      options: ['de', 'dev', 'velop', 'elop', 'ment'],
    },
    estimatedSeconds: 30,
  },
  {
    id: 'dg-0017',
    section: 'chunking',
    skillIds: ['spelling.prefix', 'spelling.suffix'],
    payload: {
      word: 'renewable',
      answer: ['re', 'new', 'able'],
      options: ['re', 'ren', 'new', 'ew', 'able'],
    },
    estimatedSeconds: 30,
  },
  {
    id: 'dg-0018',
    section: 'chunking',
    skillIds: ['spelling.prefix', 'spelling.suffix'],
    payload: {
      word: 'indispensable',
      answer: ['in', 'dispens', 'able'],
      options: ['in', 'indis', 'dispens', 'pens', 'able'],
    },
    estimatedSeconds: 30,
  },
  {
    id: 'dg-0019',
    section: 'basicTranslate',
    skillIds: ['writing.subjectVerb', 'writing.wordOrder'],
    payload: {
      promptJa: '私は毎日英語を勉強します。',
      modelAnswers: ['I study English every day.', 'Every day, I study English.'],
    },
    estimatedSeconds: 45,
  },
  {
    id: 'dg-0020',
    section: 'basicTranslate',
    skillIds: ['writing.tense', 'writing.agreement'],
    payload: {
      promptJa: '彼女は昨日その本を読みました。',
      modelAnswers: ['She read the book yesterday.', 'Yesterday, she read that book.'],
    },
    estimatedSeconds: 45,
  },
  {
    id: 'dg-0021',
    section: 'basicTranslate',
    skillIds: ['writing.connector', 'writing.infinitive'],
    payload: {
      promptJa: '疲れていたので、早く寝ることにしました。',
      modelAnswers: [
        'Because I was tired, I decided to go to bed early.',
        'I decided to go to bed early because I was tired.',
      ],
    },
    estimatedSeconds: 50,
  },
  {
    id: 'dg-0022',
    section: 'basicTranslate',
    skillIds: ['writing.relativeClause'],
    payload: {
      promptJa: 'これは姉が私に勧めてくれた本です。',
      modelAnswers: [
        'This is the book my sister recommended to me.',
        'This is a book that my sister recommended.',
      ],
    },
    estimatedSeconds: 55,
  },
  {
    id: 'dg-0023',
    section: 'basicTranslate',
    skillIds: ['writing.japaneseSimplification', 'writing.connector'],
    payload: {
      promptJa: 'オンライン授業は便利ですが、集中するのが難しいことがあります。',
      modelAnswers: [
        'Online classes are convenient, but it can be difficult to concentrate.',
        'Online learning is useful. However, staying focused can be difficult.',
      ],
    },
    estimatedSeconds: 60,
  },
  {
    id: 'dg-0024',
    section: 'basicTranslate',
    skillIds: ['writing.translation', 'writing.argument'],
    payload: {
      promptJa: '利用できる技術を、必ず利用すべきだとは限りません。',
      modelAnswers: [
        'We should not necessarily use every technology that is available.',
        'The fact that a technology is available does not mean that we should use it.',
      ],
    },
    estimatedSeconds: 75,
  },
  {
    id: 'dg-0025',
    section: 'reorder',
    skillIds: ['writing.wordOrder', 'writing.agreement'],
    payload: {
      promptJa: '彼は毎朝バスで学校へ行きます。',
      tokens: ['He', 'goes', 'to school', 'by bus', 'every morning'],
      modelAnswers: [
        'He goes to school by bus every morning.',
        'Every morning, he goes to school by bus.',
      ],
    },
    estimatedSeconds: 45,
  },
  {
    id: 'dg-0026',
    section: 'reorder',
    skillIds: ['writing.connector', 'writing.tense'],
    payload: {
      promptJa: '雨だったので、私たちは家にいました。',
      tokens: ['we', 'stayed', 'home', 'because', 'it', 'was raining'],
      modelAnswers: [
        'We stayed home because it was raining.',
        'Because it was raining, we stayed home.',
      ],
    },
    estimatedSeconds: 50,
  },
  {
    id: 'dg-0027',
    section: 'reorder',
    skillIds: ['writing.relativeClause', 'writing.article'],
    payload: {
      promptJa: '私が訪れた町は海の近くにあります。',
      tokens: ['the town', 'I visited', 'is', 'near', 'the sea'],
      modelAnswers: [
        'The town I visited is near the sea.',
        'The town that I visited is near the sea.',
      ],
    },
    estimatedSeconds: 60,
  },
  {
    id: 'dg-0028',
    section: 'reorder',
    skillIds: ['writing.connector', 'writing.argument'],
    payload: {
      promptJa: '費用はかかりますが、この計画は長期的には役立ちます。',
      tokens: ['although', 'the plan', 'is costly', 'it', 'will help', 'in the long term'],
      modelAnswers: [
        'Although the plan is costly, it will help in the long term.',
        'The plan is costly, but it will be useful in the long term.',
      ],
    },
    estimatedSeconds: 65,
  },
  {
    id: 'dg-0029',
    section: 'shortOpinion',
    skillIds: ['writing.argument', 'writing.paragraphStructure'],
    payload: {
      promptJa: '高校生は毎日読書をするべきですか。40〜60語で意見と理由を書いてください。',
      modelAnswers: [
        'High school students should read every day, even if they have only a short time. Reading introduces ideas and words that do not appear in daily conversation. It also gives students a quiet chance to think. A daily goal of ten minutes would be realistic for busy students.',
        'I do not think every student must read a book every day. Students have different schedules and can learn from articles or audio materials as well. Schools should encourage regular reading, but students should be able to choose the form and the days that fit their lives.',
      ],
      rubric: { minWords: 40, maxWords: 60, needsReason: true },
    },
    estimatedSeconds: 180,
  },
  {
    id: 'dg-0030',
    section: 'shortOpinion',
    skillIds: ['writing.argument', 'writing.paragraphStructure', 'writing.connector'],
    payload: {
      promptJa: '学校でAIを使うときに最も大切なルールは何ですか。60〜90語で説明してください。',
      modelAnswers: [
        'The most important rule is that students must explain which parts of their work involved AI. This record makes the process visible to teachers and helps students notice when they depend too much on the tool. AI can suggest questions or check a draft, but the student should choose the ideas and write the final answer.',
        'Students should always check AI output against a reliable source. AI can produce a confident answer that is incomplete or inaccurate. For example, a student could compare a historical claim with a textbook or an official record. This rule teaches students to treat AI as a source of suggestions rather than as an authority.',
      ],
      rubric: { minWords: 60, maxWords: 90, needsReason: true, needsExample: true },
    },
    estimatedSeconds: 240,
  },
])

export const diagnosticItemById = new Map(
  diagnosticItems.map((item) => [item.id, item]),
)
