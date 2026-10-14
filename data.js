const word = (id,term,ipa,meaning,collocation,example,translation,cloze,answers=[]) => ({id,term,ipa,meaning,collocation,example,translation,cloze,answers});
export const lessons = [
  {
    id:'boundaries', tag:'职场与边界', title:'为什么我们总在说「好」？', english:'The quiet cost of saying yes', subtitle:'一次善意的帮忙，什么时候变成了义务？', color:'sage', art:'window', question:'When does helping someone become an obligation?',
    prompt:'用 reluctant 或 boundary 写一句话，回应同事今晚的临时请求。', model:"I'm reluctant to take on another task tonight. I need to set a boundary and leave on time.", translation:'我不太愿意今晚再接一项任务。我需要划定界限，准时下班。',
    text:"“Just this once,” your colleague says. You are reluctant to refuse because he helped you when you first joined. Yet the requests have become frequent, and resentment is beginning to build. You wonder whether this is a reasonable compromise or an unspoken obligation. Tonight, you decide to set a boundary. You acknowledge his difficulty, but explain that you have plans. To your surprise, he accepts it. Being considerate does not require you to be available all the time. Perhaps the hardest part of saying no is giving yourself permission to do it.",
    zh:'“就这一次。”同事说。你不情愿拒绝，因为刚入职时他帮过你。但请求越来越频繁，不满开始积累。你疑惑：这是合理的妥协，还是一项心照不宣的义务？今晚，你决定划定界限。你承认他的困难，但说明自己已有安排。出乎意料，他接受了。体贴并不意味着你必须随时有空。或许，拒绝最难的一步，是允许自己这样做。',
    words:[
      word('b1','reluctant','/rɪˈlʌktənt/','不情愿的；有所顾虑的','be reluctant to do something',"I'm reluctant to work late again.",'我不太愿意再次加班。',"I'm ____ to work late again."),
      word('b2','resentment','/rɪˈzentmənt/','不满；怨愤','resentment builds up','Resentment builds when requests become demands.','当请求变成要求，不满就会积累。','____ builds when requests become demands.'),
      word('b3','compromise','/ˈkɒmprəmaɪz/','妥协；折中办法','reach a compromise','We need to reach a compromise.','我们需要达成一个折中办法。','We need to reach a ____.'),
      word('b4','obligation','/ˌɒblɪˈɡeɪʃən/','义务；责任','feel an obligation to','I feel an obligation to help my team.','我觉得有义务帮助团队。','I feel an ____ to help my team.'),
      word('b5','boundary','/ˈbaʊndəri/','边界；界限','set a boundary','You can set a boundary without being rude.','你可以礼貌地划定界限。','You can set a ____ without being rude.'),
      word('b6','acknowledge','/əkˈnɒlɪdʒ/','承认；认可','acknowledge a difficulty',"I acknowledge your concern, but I disagree.",'我理解你的顾虑，但我不同意。',"I ____ your concern, but I disagree."),
      word('b7','considerate','/kənˈsɪdərət/','体贴的；考虑周到的','be considerate of others','It was considerate of you to ask first.','你先询问的做法很体贴。','It was ____ of you to ask first.'),
      word('b8','permission','/pəˈmɪʃən/','允许；许可','give yourself permission to','Give yourself permission to rest.','允许自己休息。','Give yourself ____ to rest.')
    ]
  },
  {
    id:'attention', tag:'心理与日常', title:'很累，为什么还不想睡？', english:'One more scroll, one less hour', subtitle:'你想找回的，可能是属于自己的时间。', color:'sand', art:'moon', question:'What makes an evening feel like your own?',
    prompt:'用 reclaim 或 deliberate 写一句你今晚想做的改变。', model:'I want to reclaim my evening by making a deliberate choice to put my phone away.', translation:'我想通过有意识地放下手机，重新拿回自己的夜晚。',
    text:'You are exhausted, but you keep scrolling. Each distraction offers a brief escape from a demanding day. The strange part is that you do not even enjoy it very much. You may be trying to reclaim a sense of autonomy: the day belonged to work, and the night should belong to you. Yet the habit brings only temporary relief. By morning, you feel worse. A deliberate pause can help you notice what you actually need. Is it entertainment, connection, or simply quiet? The answer might change how you spend the next ten minutes.',
    zh:'你已经筋疲力尽，却还在刷手机。每一次分心都让你短暂逃离忙碌的一天。奇怪的是，你甚至没那么享受。你可能想重新获得一点自主感：白天属于工作，夜晚该属于你。但这个习惯只带来暂时的缓解，早晨反而更难受。有意识地暂停一下，可以帮助你看清真正的需要：娱乐、联系，还是安静？答案可能改变接下来十分钟的安排。',
    words:[
      word('a1','exhausted','/ɪɡˈzɔːstɪd/','筋疲力尽的','feel exhausted','I feel exhausted after a demanding day.','忙碌一天后，我筋疲力尽。','I feel ____ after a demanding day.'),
      word('a2','distraction','/dɪˈstrækʃən/','使人分心的事物','a welcome distraction','The walk was a welcome distraction.','散步让我愉快地暂时转移注意力。','The walk was a welcome ____.'),
      word('a3','reclaim','/rɪˈkleɪm/','重新取回；收回','reclaim your time','I want to reclaim my evenings.','我想拿回属于自己的夜晚。','I want to ____ my evenings.'),
      word('a4','autonomy','/ɔːˈtɒnəmi/','自主权；自主性','a sense of autonomy','Flexible hours give people a sense of autonomy.','灵活工时带给人自主感。','Flexible hours give people a sense of ____.'),
      word('a5','temporary','/ˈtempərəri/','暂时的','temporary relief','Scrolling provides only temporary relief.','刷手机只能带来暂时的缓解。','Scrolling provides only ____ relief.'),
      word('a6','relief','/rɪˈliːf/','缓解；宽慰','a sense of relief','I felt a sense of relief when it was over.','事情结束时，我松了一口气。','I felt a sense of ____ when it was over.'),
      word('a7','deliberate','/dɪˈlɪbərət/','有意的；深思熟虑的','a deliberate choice','Rest can be a deliberate choice.','休息可以是一个有意识的选择。','Rest can be a ____ choice.'),
      word('a8','demanding','/dɪˈmɑːndɪŋ/','要求高的；费力的','a demanding job','A demanding job leaves little energy for hobbies.','繁重的工作让人很少有精力投入爱好。','A ____ job leaves little energy for hobbies.')
    ]
  },
  {
    id:'choices', tag:'思考与选择', title:'投入越多，越难放手？', english:'The ticket you do not have to use', subtitle:'过去的成本，应该决定下一步吗？', color:'rose', art:'ticket', question:'When is walking away a sensible decision?',
    prompt:'用 investment 或 justify 写一句话，解释一个你可以停止的计划。', model:'The previous investment does not justify spending more time on a plan that no longer works.', translation:'之前的投入，不能成为继续把时间花在失效计划上的理由。',
    text:'You bought a ticket months ago. Now the event no longer interests you, but staying home feels like wasting the money. Your investment creates an attachment that is hard to question. You try to justify going, even though the opportunity to spend a quiet evening at home seems more appealing. The money is gone either way. What remains is a decision about your future time. A sensible choice considers the consequence of the next action, rather than the expense of the last one. Sometimes, walking away is how you stop a small loss from becoming a larger one.',
    zh:'几个月前你买了票。如今活动已经不再吸引你，但留在家里似乎浪费了钱。投入带来了一种难以质疑的依恋。你试着为出门找理由，尽管在家安静地待一晚更有吸引力。无论如何，钱已经花掉。剩下的是如何使用未来时间的决定。明智的选择考虑下一步的后果，而非上一步的开销。有时，放手能阻止小损失变成大损失。',
    words:[
      word('c1','investment','/ɪnˈvestmənt/','投入；投资','an investment of time','Learning requires an investment of time.','学习需要投入时间。','Learning requires an ____ of time.'),
      word('c2','attachment','/əˈtætʃmənt/','依恋；情感上的联系','an emotional attachment','I have an emotional attachment to this place.','我对这个地方有感情。','I have an emotional ____ to this place.'),
      word('c3','justify','/ˈdʒʌstɪfaɪ/','证明合理；为……提供理由','justify a decision','How do you justify spending more money?','你如何说明花更多钱是合理的？','How do you ____ spending more money?'),
      word('c4','opportunity','/ˌɒpəˈtjuːnəti/','机会','an opportunity to','This is an opportunity to try something new.','这是尝试新事物的机会。','This is an ____ to try something new.'),
      word('c5','appealing','/əˈpiːlɪŋ/','有吸引力的','an appealing idea','A quiet evening sounds appealing.','安静的一晚听起来很诱人。','A quiet evening sounds ____.'),
      word('c6','sensible','/ˈsensəbl/','明智的；合理的','a sensible decision','Leaving early was a sensible decision.','早些离开是明智的决定。','Leaving early was a ____ decision.'),
      word('c7','consequence','/ˈkɒnsɪkwəns/','后果；结果','consider the consequence','Consider the consequence before you act.','行动前考虑后果。','Consider the ____ before you act.'),
      word('c8','expense','/ɪkˈspens/','费用；开销','at considerable expense','They rebuilt the house at considerable expense.','他们花了很大一笔钱重建房屋。','They rebuilt the house at considerable ____.')
    ]
  },
  {
    id:'curiosity', tag:'世界与好奇', title:'总买两杯咖啡的客人', english:'A small ritual, a different story', subtitle:'你看到的事实，和你讲的故事之间。', color:'blue', art:'coffee', question:'What could change your first impression of someone?',
    prompt:'用 assumption 或 perspective 写一句话，表达你对这位客人的看法。', model:'My first assumption was wrong. A different perspective helped me understand his ritual.', translation:'我最初的假设错了。换个角度让我理解了他的习惯。',
    text:'Every evening, a customer orders two coffees and sits alone by the window. You assume he is waiting for someone. One night, curiosity wins, and you ask. He smiles: one cup is for now, the other for his overnight shift. The explanation is ordinary, but it changes your perspective. You had turned an observation into a story about loneliness. That is how an assumption works: it fills the gap between what we notice and what we know. His little ritual reminds you to stay curious. Sometimes, the most unexpected discovery is that your first impression was simply incomplete.',
    zh:'每天晚上，一位客人点两杯咖啡，独自坐在窗边。你以为他在等人。一晚，好奇心占了上风，你问了他。他笑着说：一杯现在喝，另一杯留给夜班。解释很普通，却改变了你的视角。你把一个观察编成了关于孤独的故事。假设正是这样运作的：填补所见与所知之间的空隙。他的小习惯提醒你保持好奇。有时，最意外的发现只是：你的第一印象并不完整。',
    words:[
      word('q1','curiosity','/ˌkjʊəriˈɒsəti/','好奇心','out of curiosity','I asked out of curiosity.','我出于好奇问了问。','I asked out of ____.'),
      word('q2','perspective','/pəˈspektɪv/','视角；看法','a different perspective','Try looking at it from a different perspective.','试着换个角度看它。','Try looking at it from a different ____.'),
      word('q3','observation','/ˌɒbzəˈveɪʃən/','观察；观察所得','make an observation','An observation is not always an explanation.','观察到的现象不一定就是解释。','An ____ is not always an explanation.'),
      word('q4','assumption','/əˈsʌmpʃən/','假设；未经证实的看法','make an assumption','We made an assumption without asking.','我们没有询问就作了假设。','We made an ____ without asking.'),
      word('q5','ritual','/ˈrɪtʃuəl/','固定习惯；仪式','a daily ritual','Making coffee is my daily ritual.','煮咖啡是我的每日固定习惯。','Making coffee is my daily ____.'),
      word('q6','unexpected','/ˌʌnɪkˈspektɪd/','意想不到的','an unexpected discovery','The conversation led to an unexpected discovery.','这段交谈带来了意外的发现。','The conversation led to an ____ discovery.'),
      word('q7','impression','/ɪmˈpreʃən/','印象','a first impression','My first impression was wrong.','我的第一印象错了。','My first ____ was wrong.'),
      word('q8','incomplete','/ˌɪnkəmˈpliːt/','不完整的','incomplete information','We often judge with incomplete information.','我们常凭不完整的信息作判断。','We often judge with ____ information.')
    ]
  }
];
export const allWords = lessons.flatMap(l => l.words.map(w => ({...w,lesson:l.id,lessonTitle:l.title})));
export const wordMap = Object.fromEntries(allWords.map(w => [w.id,w]));
