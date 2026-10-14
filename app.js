import {lessons,allWords,wordMap} from './data.js';
import {STORAGE_KEY,modes,dayKey,initialState,dueWords,makePlan,schedule,checkAnswer,wordStatus,validateBackup,validateDraft} from './core.js';

const $ = (q,root=document) => root.querySelector(q);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let storageError = false, startupError = false;
let state = initialState();
try {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (raw) {
    state = validateBackup(raw,new Set(allWords.map(w=>w.id)));
    state.draft=validateDraft(raw.draft,new Set(allWords.map(w=>w.id)),new Set(lessons.map(l=>l.id)));
  }
} catch { startupError=true; }
let page='today', filter='all', search='', session=null, modal=null, installPrompt=null;
let lastReminderDay = '';
try {lastReminderDay=sessionStorage.getItem('nightflight.reminder')||'';}catch{}
let focusBeforeModal=null;
function save() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
  catch { storageError=true; toast('本机存储不可用，请在设置中导出备份；当前进度仅保留在本次打开期间。'); }
}
function toast(message) { const t=$('#toast'); t.textContent=message; t.classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('visible'),4000); }
const paths={
 star:'M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3z',
 home:'M3 10l9-7 9 7v10H3z M9 20v-7h6v7', book:'M12 5v15 M12 5C8 2 3 3 3 3v15s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2z',
 layers:'M12 3L2 8l10 5 10-5-10-5z M2 12l10 5 10-5 M2 16l10 5 10-5', chart:'M4 20V10 M12 20V4 M20 20v-7',
 settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3z M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
 arrow:'M4 12h16 M14 6l6 6-6 6', chevron:'M9 5l7 7-7 7', clock:'M12 8v5l3 2 M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0',
 volume:'M11 4L5 9H2v6h3l6 5V4z M15 8c3 2 3 6 0 8 M18 4c6 4 6 12 0 16', check:'M4 12l5 5L20 6', close:'M6 6l12 12 M6 18L18 6',
 moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z', sun:'M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2 M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0',
 search:'M20 20l-5-5 M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0', download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
 heart:'M12 21s-10-6-10-13a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13z', spark:'M12 2l2 7 7 3-7 2-2 8-2-8-7-2 7-3 2-7z M21 2v4 M19 4h4',
 pause:'M8 5v14 M16 5v14', refresh:'M20 10a8 8 0 1 0-1 8 M20 4v6h-6', coffee:'M3 8h13v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8z M16 9h2a3 3 0 0 1 0 6h-2 M6 2v3 M12 2v3',
 globe:'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0 M3 12h18 M12 3c5 5 5 13 0 18-5-5-5-13 0-18', bell:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3z M10 21h4'
};
function icon(name,cls='') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`; }
const navs=[['today','home','今日学习'],['stories','book','内容书架'],['words','layers','我的词库'],['progress','chart','学习足迹']];
function lessonNow(){return lessons.find(l=>l.id===state.settings.topic)||lessons[0];}
function todaySessions(){return state.sessions.filter(s=>s.day===dayKey());}
function headerTitle(){return {today:'给自己一点时间',stories:'总有一个问题，让你想读下去',words:'让认识的词，成为会用的词',progress:'一点一点，都算数',settings:'按你的节奏来'}[page];}
function logo(){return `<span class="brand-symbol">${icon('star')}</span><span class="brand-name">夜航<span>NIGHTFLIGHT</span></span>`;}

function render(){
  const content=session?sessionView():({today:todayView,stories:storiesView,words:wordsView,progress:progressView,settings:settingsView}[page]||todayView)();
  $('#app').innerHTML=`<a class="skip-link" href="#main">跳到主要内容</a>
  <aside class="sidebar"><a href="#today" class="brand" data-nav="today" aria-label="夜航英语首页">${logo()}</a>
    <div class="sidebar-label">YOUR LITTLE ESCAPE</div><nav aria-label="主导航">${navs.map(([id,i,label])=>`<button class="nav-link ${page===id?'active':''}" data-nav="${id}" ${page===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span>${id==='today'?'<span class="nav-dot"></span>':''}</button>`).join('')}</nav>
    <div class="sidebar-note">${icon('moon')}<p>生活很满，<br>也给自己留一点空白。</p><span>A LITTLE, BUT WELL.</span></div>
    <button class="nav-link settings-nav ${page==='settings'?'active':''}" data-nav="settings">${icon('settings')}学习偏好</button>
    <div class="profile"><span class="avatar">N</span><div>夜航学习者<small>四级基础 · 持续进阶</small></div><span class="profile-dot"></span></div>
  </aside>
  <div class="app-body"><header class="topbar"><div class="mobile-brand">${logo()}</div><div class="topbar-title">${headerTitle()}</div><div class="topbar-right"><span class="local-badge"><i></i>本机保存</span><button class="icon-button" data-nav="settings" aria-label="学习偏好">${icon('settings')}</button></div></header>
    <main id="main" tabindex="-1" class="${session?'session-main':''}">${content}</main><footer class="desktop-footer">一点好奇，一点英语，一点属于你的时间。<span>NIGHTFLIGHT · 每一小步，都有回响</span></footer>
  </div><nav class="mobile-nav" aria-label="手机导航">${navs.map(([id,i,label])=>`<button class="${page===id?'active':''}" data-nav="${id}" ${page===id?'aria-current="page"':''}>${icon(i)}<span>${label}</span></button>`).join('')}</nav>${modal?modalView():''}`;
  if(modal) setTimeout(()=>{ const el=$('.modal'); el?.focus(); },0);
}
function dateLabel(){return new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});}
function heroArt(){return `<svg class="hero-art" viewBox="0 0 420 300" fill="none" aria-hidden="true"><circle cx="249" cy="136" r="105" fill="#e3ebda"/><circle cx="338" cy="52" r="22" fill="#edcd87"/><path d="M318 52h40M338 32v40" stroke="#f8f5e9" stroke-width="2"/><path d="M171 43l6 17 17 6-17 6-6 17-6-17-17-6 17-6z" fill="#5e8473"/><path d="M118 254h263" stroke="#829783" stroke-width="2"/><path d="M300 199v55m-15-36c-22-27-2-42 12-21m5-6c-1-38 31-35 19-4m-21 45c-16-11-34-10-29-29m31 23c20-25 35-15 19 3" stroke="#557969" stroke-width="4" stroke-linecap="round"/><path d="M143 233l115-28 39 22-114 27z" fill="#205348"/><path d="M147 223l114-28 35 25-113 29z" fill="#f0e8d7"/><path d="M147 212l115-28 34 29-113 29z" fill="#dba77b"/><g transform="rotate(-11 209 155)"><rect x="127" y="75" width="171" height="138" rx="9" fill="#fcfbf4" stroke="#d1d9cb"/><path d="M139 198h147" stroke="#cfd7ca"/><text x="145" y="107" font-family="Georgia,serif" font-size="11" letter-spacing="2" fill="#5e7769">A WORD FOR TONIGHT</text><text x="145" y="147" font-family="Georgia,serif" font-size="29" fill="#244c40">reclaim.</text><text x="145" y="172" font-family="sans-serif" font-size="11" fill="#6b7b6b">to take back what is yours</text><path d="M146 183h103" stroke="#c19a64" stroke-width="2"/></g><path d="M113 165l-18-5 4 18 22 12z" fill="#edca7d"/><path d="M104 163l11-20 9 25-8 7z" fill="#c99962"/><circle cx="112" cy="118" r="3" fill="#96ac8d"/><circle cx="335" cy="137" r="3" fill="#96ac8d"/><path d="M363 183v12m-6-6h12" stroke="#849c74" stroke-width="2"/></svg>`;}
function modeButtons(){return `<div class="mode-switch" role="group" aria-label="今天的精力">${Object.entries(modes).map(([key,m])=>`<button data-mode="${key}" class="${state.settings.mode===key?'selected':''}" aria-pressed="${state.settings.mode===key}">${key==='standard'?icon('sun'):key==='short'?icon('clock'):icon('moon')}<span>${m.label}<small>${m.minutes} 分钟</small></span></button>`).join('')}</div>`;}
function weekChart(compact=false){
  const now=new Date();const days=[];
  for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(now.getDate()-i);const ss=state.sessions.filter(s=>s.day===dayKey(d));days.push({d,count:ss.length,minutes:ss.reduce((n,s)=>n+s.seconds,0)/60});}
  const max=Math.max(8,...days.map(d=>d.minutes));
  return `<div class="week-chart ${compact?'compact':''}" aria-label="最近七天实际学习记录">${days.map(({d,count,minutes})=>`<div class="chart-day"><div class="bar-space"><div class="bar ${count?'filled':''}" style="height:${count?Math.max(14,minutes/max*80):5}px" title="${esc(dayKey(d))}：${Math.round(minutes)} 分钟，${count} 次"><span>${count?Math.round(minutes)+'m':''}</span></div></div><span class="day-label ${dayKey(d)===dayKey()?'today':''}">${dayKey(d)===dayKey()?'今':['日','一','二','三','四','五','六'][d.getDay()]}</span></div>`).join('')}</div>`;
}
function todayView(){
  const lesson=lessonNow(),plan=makePlan(state,lesson),due=dueWords(state).length,today=todaySessions();
  const s=state.sessions.length,learned=Object.keys(state.words).filter(id=>!state.words[id].known).length;
  return `<div class="page-heading"><div><p class="eyebrow">${dateLabel()} <span>·</span> YOUR TIME, YOUR PACE</p><h1>${new Date().getHours()<12?'早安':'你好'}，给自己留一小步。</h1><p class="muted">不用准备好一整晚，只需要从这一刻开始。</p></div><span class="level-badge">${icon('spark')} 四级进阶</span></div>
  ${state.draft?`<div class="resume-banner">${icon('pause')}上次停在「${esc(lessons.find(l=>l.id===state.draft.lesson)?.title)}」<button class="text-button" data-action="resume">接着学 ${icon('arrow')}</button></div>`:''}
  <div class="dashboard-grid"><section class="dashboard-main"><div class="hero-card"><div class="hero-copy"><span class="pill"><i></i> 今晚的轻量计划</span><h2>${modes[state.settings.mode].minutes} 分钟，<br><em>刚刚好。</em></h2><p>学几个值得记住的词，<br>再读一个值得想一想的故事。</p>${modeButtons()}<button class="primary start-button" data-action="start">${icon('arrow')} ${state.draft?'开启新的学习':'开始今晚的学习'}<span>${plan.fresh.length} 新词 · ${plan.review.length} 复习</span></button><div class="hero-footnote">${icon('check')} 随时暂停，进度会留在这里</div></div>${heroArt()}</div>
  <div class="plan-strip"><div><span class="step-circle">01</span><div><strong>先找回熟悉感</strong><small>${plan.review.length?plan.review.length+' 个到期词':'从今天的第一句话开始'}</small></div></div><div><span class="step-circle">02</span><div><strong>在语境里学词</strong><small>${plan.fresh.length?plan.fresh.length+' 个精选目标词':'今天专心巩固旧词'}</small></div></div><div><span class="step-circle">03</span><div><strong>把它变成你的话</strong><small>主动回忆 · 一句表达</small></div></div></div>
  <div class="section-heading"><div><p class="eyebrow">A LITTLE CURIOSITY</p><h2>今晚，读点什么？</h2></div><button class="text-button" data-nav="stories">全部内容 ${icon('arrow')}</button></div><div class="story-grid">${lessons.slice(0,3).map(l=>storyCard(l)).join('')}</div>
  <div class="gentle-note">${icon('heart')} ${today.length?'今天已经为自己留过时间。想继续，也可以；到这里，也很好。':'学习不必占满生活。完成这一小步，就安心去休息。'}</div></section>
  <aside class="dashboard-rail"><div class="rail-card tonight-card"><span class="eyebrow">TONIGHT’S QUESTION</span><span class="rail-spark" aria-hidden="true">✳</span><h3>${esc(lesson.question)}</h3><p>${esc(lesson.subtitle)}</p><div class="rail-line"></div><span class="rail-tag">${esc(lesson.tag)}</span><button class="rail-link" data-preview="${lesson.id}">读一个片段 ${icon('arrow')}</button></div>
  <div class="rail-card word-summary"><div class="rail-heading"><h3>词汇正在生长</h3>${icon('layers')}</div><div class="word-number">${learned}<span>个词已开始学习</span></div><div class="word-segments">${['待巩固','能回忆','较稳定'].map((status,i)=>{const n=Object.values(state.words).filter(w=>wordStatus(w)===status).length;return `<span style="flex:${Math.max(1,n)}" class="seg-${i}" title="${status} ${n}"></span>`;}).join('')}</div><div class="word-legend"><span><i class="seg-0"></i>待巩固</span><span><i class="seg-1"></i>能回忆</span><span><i class="seg-2"></i>较稳定</span></div><button class="text-button" data-nav="words">打开我的词库 ${icon('arrow')}</button>${due?`<small class="due-note">${due} 个词到了复习时间；今天只安排 ${plan.review.length} 个。</small>`:''}</div>
  <div class="rail-card"><div class="rail-heading"><h3>这一周的微光</h3><small>最近 7 天</small></div>${weekChart(true)}<p class="week-note">${s?`累计完成 ${s} 次学习。每一次，都是实际留下的记录。`:'第一道微光，等你点亮。'}</p></div></aside></div>`;
}
function storyArt(l){
 const arts={
 window:`<rect x="62" y="18" width="113" height="90" rx="52" fill="#c0cfba"/><path d="M68 83h99M118 21v81" stroke="#f5f4e9" stroke-width="4"/><circle cx="144" cy="47" r="13" fill="#f5e1aa"/><path d="M80 102l38-11 39 14-38 11z" fill="#517266"/><path d="M79 97l39-10 39 13-38 11z" fill="#f5efe0"/><path d="M179 106V81m0 11c-19-11-20-25-8-21m9 17c16-15 24-12 17-1" stroke="#577665" stroke-width="3"/>`,
 moon:`<circle cx="121" cy="64" r="45" fill="#e4c28b"/><circle cx="140" cy="49" r="36" fill="#f0e4cf"/><rect x="76" y="61" width="36" height="58" rx="7" transform="rotate(-13 76 61)" fill="#7e8c80"/><rect x="80" y="67" width="28" height="43" rx="3" transform="rotate(-13 80 67)" fill="#f5f3e4"/><path d="M163 94l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#b3966a"/><circle cx="64" cy="39" r="3" fill="#a48b62"/>`,
 ticket:`<path d="M56 39h136v22a12 12 0 0 0 0 24v22H56V85a12 12 0 0 0 0-24z" fill="#d5aea0" transform="rotate(-9 120 73)"/><path d="M151 39v68" stroke="#faf1e8" stroke-dasharray="4 4" stroke-width="2" transform="rotate(-9 120 73)"/><path d="M81 55h46M81 66h31M81 85h41" stroke="#faf1e8" stroke-width="4" transform="rotate(-9 120 73)"/>`,
 coffee:`<ellipse cx="115" cy="108" rx="65" ry="10" fill="#b9cbc8"/><path d="M76 54h49v36a15 15 0 0 1-15 15H91a15 15 0 0 1-15-15z" fill="#f9f2dc"/><path d="M125 62h8a13 13 0 0 1 0 26h-8" stroke="#f9f2dc" stroke-width="6"/><path d="M143 56h34v34a12 12 0 0 1-12 12h-10a12 12 0 0 1-12-12z" fill="#8ea9a3"/><path d="M88 22c-10 10 12 10 0 22M105 18c-10 10 12 10 0 22" stroke="#a9b8a8" stroke-width="2"/>
 `};
 return `<svg viewBox="0 0 240 130" fill="none" aria-hidden="true">${arts[l.art]}</svg>`;
}
function storyCard(l){const count=l.words.filter(w=>state.words[w.id]).length;return `<button class="story-card ${l.color}" data-preview="${l.id}"><div class="story-art">${storyArt(l)}<span class="story-index">0${lessons.indexOf(l)+1}</span>${state.settings.topic===l.id?'<span class="selected-story">今晚推荐</span>':''}</div><div class="story-card-copy"><span class="topic-label">${esc(l.tag)}</span><h3>${esc(l.title)}</h3><p>${esc(l.subtitle)}</p><div class="story-meta"><span>${icon('layers')} ${count?count+'/':''}8 个目标词</span><span>${icon('clock')} 约 8 分钟</span></div></div></button>`;}
function storiesView(){return `<div class="page-heading"><div><p class="eyebrow">THE READING ROOM</p><h1>内容书架</h1><p class="muted">从生活出发。词汇、故事和一点新的视角。</p></div><span class="level-badge">四级进阶 · ${lessons.length} 个主题</span></div><div class="library-banner">${icon('book')}<div><strong>每篇约 100 词，8 个目标词。</strong><p>选择你感兴趣的问题。学习量会按精力和到期复习自动调整。</p></div></div><div class="story-grid library-grid">${lessons.map(storyCard).join('')}</div>`;}
function wordsView(){
 const filtered=allWords.filter(w=>{const ws=state.words[w.id];const status=wordStatus(ws);return (filter==='all'||filter==='saved'&&ws||filter==='due'&&dueWords(state).includes(w.id)||filter==='stable'&&status==='较稳定')&&(!search||[w.term,w.meaning,w.collocation].some(s=>s.toLowerCase().includes(search.toLowerCase())));});
 return `<div class="page-heading"><div><p class="eyebrow">WORDS THAT STAY</p><h1>我的词库</h1><p class="muted">记住一个词，也记住它能替你表达什么。</p></div><button class="secondary" data-action="review-only">${icon('refresh')} 复习到期词 (${dueWords(state).length})</button></div>
 <div class="word-toolbar"><div class="tabs" role="group" aria-label="筛选词汇">${[['all','全部内容'],['saved','已学习'],['due','待复习'],['stable','较稳定']].map(([id,text])=>`<button class="${filter===id?'active':''}" data-filter="${id}" aria-pressed="${filter===id}">${text}</button>`).join('')}</div><label class="search-box">${icon('search')}<input id="word-search" placeholder="搜索单词或中文释义" aria-label="搜索单词或中文释义" value="${esc(search)}"></label></div>
 <div class="word-list-header"><span>单词与搭配</span><span>学习状态</span></div><div class="word-list">${filtered.length?filtered.map(w=>`<button class="word-row" data-word="${w.id}"><div><strong>${esc(w.term)}</strong><span class="ipa">${esc(w.ipa)}</span><p>${esc(w.meaning)}<span class="word-collocation">${esc(w.collocation)}</span></p></div><span class="status-pill status-${wordStatus(state.words[w.id])==='较稳定'?'stable':state.words[w.id]?'learning':'new'}">${wordStatus(state.words[w.id])}</span>${icon('chevron')}</button>`).join(''):`<div class="empty-state">${icon('layers')}<h3>这里还没有词</h3><p>${search?'试试其他单词或中文关键词。':'完成一次学习后，这里会留下你的记录。'}</p></div>`}</div><p class="small-note">“较稳定”表示连续 3 次成功回忆。长期掌握仍需在新语境中使用。</p>`;
}
function progressView(){
 const sessions=state.sessions;const seconds=sessions.reduce((a,s)=>a+s.seconds,0),days=new Set(sessions.map(s=>s.day)).size;
 const total=sessions.reduce((a,s)=>a+s.total,0),correct=sessions.reduce((a,s)=>a+s.correct,0);
 return `<div class="page-heading"><div><p class="eyebrow">YOUR SMALL STEPS</p><h1>学习足迹</h1><p class="muted">这里记录实际完成的练习，慢慢看见自己的变化。</p></div></div>
 <div class="stats-grid">${[['累计投入',Math.round(seconds/60),'分钟'],['学习过的日子',days,'天'],['较稳定的词',Object.values(state.words).filter(w=>wordStatus(w)==='较稳定').length,'个'],['首次回忆正确率',total?Math.round(correct/total*100):'—',total?'%':'待开始']].map(([label,n,unit])=>`<div class="stat-card"><p>${label}</p><strong>${n}<small>${unit}</small></strong></div>`).join('')}</div>
 <div class="progress-grid"><div class="panel"><div class="section-heading"><h2>最近七天</h2><span class="muted">学习时长</span></div>${weekChart()}<p class="small-note">时长仅计入学习页面处于前台时的时间；休息没有惩罚。</p></div><div class="panel progress-message">${icon('spark')}<h2>让词汇真正留下来。</h2><p>学过、能回忆、能应用，是不同的进步。先看到提示再答对的练习，不计入首次回忆正确率。</p><button class="text-button" data-nav="words">看看哪些词需要巩固 ${icon('arrow')}</button></div></div>
 <div class="section-heading"><h2>最近的学习</h2><span class="muted">${sessions.length} 次实际记录</span></div><div class="history-list">${sessions.length?sessions.slice().reverse().slice(0,20).map(s=>`<div class="history-row"><span class="history-icon">${icon('check')}</span><div><strong>${esc(s.title)}</strong><small>${esc(s.day)} · ${formatDuration(s.seconds)}</small>${s.output?`<p class="history-output">${esc(s.output)}</p>`:''}</div><span>${s.newCount} 新词 <small>· 回忆 ${s.correct}/${s.total}</small></span></div>`).join(''):`<div class="empty-state">${icon('moon')}<h3>你的第一步，值得被记录。</h3><p>完成一次学习，第一条足迹就会出现在这里。</p><button class="primary" data-action="start">开始学习 ${icon('arrow')}</button></div>`}</div>`;
}
function settingsView(){return `<div class="page-heading"><div><p class="eyebrow">AT YOUR OWN PACE</p><h1>学习偏好</h1><p class="muted">把学习安排成你愿意接受的样子。</p></div></div><div class="settings-grid"><section class="panel"><h2>今天的精力</h2><p class="muted">随时可以调整。复习积压时，新词量会自动减少。</p>${modeButtons()}<div class="divider"></div><h2>给自己一个提醒</h2><p class="muted">页面保持打开时，每天最多提醒一次。</p><div class="form-row"><label for="reminder-time">方便学习的时间</label><input type="time" id="reminder-time" value="${state.settings.reminder}"></div><label class="checkbox-label"><input type="checkbox" id="reminder-enabled" ${state.settings.remind?'checked':''}><span>开启页面内提醒</span></label><button class="secondary" data-action="calendar">${icon('download')} 导出每日日历提醒</button><p class="small-note">导入手机或电脑日历后，可由日历在应用关闭时提醒。实际提醒时间由日历应用管理。</p><div class="divider"></div><h2>安装到手机 / 电脑</h2><p class="muted">支持响应式网页和 PWA。桌面浏览器可安装；iPhone 可在 Safari 中“添加到主屏幕”。</p><button class="secondary" data-action="install">${icon('download')} 安装或查看安装方法</button><p class="small-note">首次打开后缓存内容；PWA 和离线缓存需要 localhost 或 HTTPS。同一 Wi-Fi 下的 HTTP 地址可在手机浏览，但不能完整启用 PWA。</p></section>
 <section class="panel"><h2>进度与备份</h2><div class="storage-callout">${icon('layers')}<div><strong>${storageError?'当前浏览器无法持久保存':'进度保存在当前浏览器'}</strong><p>不同设备各自保存。可导出备份，再在另一设备导入；导入会替换该设备的进度。</p></div></div><div class="button-row"><button class="secondary" data-action="export">${icon('download')} 导出备份</button><label class="secondary file-button">导入备份<input type="file" id="import-file" accept="application/json,.json"></label></div><p class="small-note">备份包含词汇、完成记录和偏好。未完成的学习不会随导入迁移。</p><div class="divider"></div><h2>关于声音</h2><p class="muted">朗读使用设备提供的英语语音。部分设备需要联网下载语音；没有可用语音时，可以继续阅读和练习。</p><button class="secondary" data-speak="Give yourself permission to rest.">${icon('volume')} 试听英语语音</button><div class="divider"></div><h2>重新开始</h2><p class="muted">清空当前浏览器中的学习记录。操作前建议导出备份。</p><button class="danger-button" data-action="reset">清空本机进度</button></section></div>`;}

// Learning flow: due review → context → vocabulary → active recall → one sentence.
function start(reviewOnly=false){
 if(state.draft){modal={type:'replace',reviewOnly};focusBeforeModal=document.activeElement;render();return;}
 startNew(reviewOnly);
}
function startNew(reviewOnly=false){
 const lesson=lessonNow(),plan=makePlan(state,lesson);
 if(reviewOnly){plan.fresh=[];plan.review=dueWords(state).slice(0,modes[state.settings.mode].review);if(!plan.review.length){modal=null;render();toast('现在没有到期词。已学词会在合适的时间回来。');return;}}
 if(state.settings.mode==='rest'&&!plan.review.length){modal=null;render();toast('今天还没有到期词，安心休息吧。想学新词，可以选择“有点忙”。');return;}
 if(!plan.review.length&&!plan.fresh.length){modal=null;render();toast('这个主题的新词已学过。可以换一个主题，或等到复习时间。');return;}
 session={lesson:lesson.id,reviewOnly:reviewOnly||state.settings.mode==='rest'||!plan.fresh.length,fresh:plan.fresh,review:plan.review,stage:plan.review.length?'review':'read',index:0,queue:plan.review.map(id=>({id,kind:'review',retry:false})),answer:'',checked:false,correct:false,hinted:false,score:0,total:0,errors:[],skipped:[],seconds:0,writing:'',modelShown:false,outputChecked:false,completed:false};
 modal=null;state.draft=session;save();render();focusSession();
}
function checkpoint(){state.draft=session;save();}
function focusSession(){setTimeout(()=>{($('#answer-input')||$('#main'))?.focus();},0);}
function moveStage(stage){session.stage=stage;session.index=0;session.checked=false;session.answer='';session.hinted=false;checkpoint();render();focusSession();}
function questionView(){
 const q=session.queue[session.index],w=wordMap[q.id];
 const label=session.stage==='review'?'找回熟悉感':'让词汇留下来';
 return `<div class="exercise-top"><span class="pill">${q.retry?'再试一次':q.kind==='review'?'旧词复习':'新词回忆'}</span><span class="muted">${session.index+1} / ${session.queue.length}</span></div><p class="eyebrow">${label}</p><h2 class="exercise-title">${q.retry?'刚刚那个词，还记得吗？':'把空缺的那个词，找回来。'}</h2><p class="cloze">${esc(w.cloze).replace('____','<span class="blank">________</span>')}</p><p class="cloze-zh">${esc(w.translation)}</p><form id="answer-form"><label class="sr-only" for="answer-input">输入英文单词</label><input id="answer-input" class="answer-input" placeholder="输入你想到的英文单词" value="${esc(session.answer)}" autocomplete="off" autocapitalize="none" spellcheck="false" ${session.checked?'disabled':''}>
 ${session.checked?`<div class="feedback ${session.correct?'success':'retry'}" role="status">${icon(session.correct?'check':'refresh')}<div><strong>${session.correct?session.hinted?'借助提示找到了，继续巩固。':'对，就是这个词。':'还差一点。先看看这个词。'}</strong><p>${esc(w.term)} <span>${esc(w.meaning)}</span></p><small>${esc(w.collocation)}</small></div></div>`:''}
 <div class="exercise-actions">${!session.checked?`<button type="button" class="text-button" data-action="hint">${session.hinted?'提示已显示':'给我一点提示'}</button><button class="primary" type="submit">确认答案 ${icon('arrow')}</button>`:`<button type="button" class="secondary" data-speak="${esc(w.example)}">${icon('volume')} 听例句</button><button class="primary" type="button" data-action="next-question">继续 ${icon('arrow')}</button>`}</div></form>
 ${session.hinted&&!session.checked?`<div class="hint-box">首字母：<strong>${esc(w.term[0])}</strong> · ${esc(w.meaning)}<br><small>使用提示后答对，本次会按“需要巩固”安排复习。</small></div>`:''}`;
}
function readView(){const l=lessons.find(l=>l.id===session.lesson);return `<div class="exercise-top"><span class="pill">${esc(l.tag)}</span><span class="muted">约 ${l.text.split(/\s+/).length} 词</span></div><p class="eyebrow">A LITTLE CURIOSITY</p><h2 class="reading-title">${esc(l.title)}</h2><p class="reading-en-title">${esc(l.english)}</p><div class="reading-tools"><button class="secondary" data-speak="${esc(l.text)}">${icon('volume')} 听全文</button><button class="text-button" data-action="toggle-translation">${session.translationShown?'收起中文':'查看中文'}</button></div><p class="reading-text">${annotate(l.text,l.words)}</p>${session.translationShown?`<p class="translation-box">${esc(l.zh)}</p>`:''}<div class="reading-question">${icon('spark')}<span>${esc(l.question)}</span></div><p class="small-note">点击带下划线的词查看含义。先读懂大意，再集中学词。</p><div class="exercise-actions"><span class="muted">${session.fresh.length} 个目标词，逐个看一看</span><button class="primary" data-action="read-next">开始学词 ${icon('arrow')}</button></div>`;}
function annotate(text,words){
 const pattern=new RegExp('\\b('+words.map(w=>w.term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi');
 let out='',prev=0;for(const match of text.matchAll(pattern)){const w=words.find(w=>w.term.toLowerCase()===match[0].toLowerCase());out+=esc(text.slice(prev,match.index))+`<button class="inline-word" data-word="${w.id}">${esc(match[0])}</button>`;prev=match.index+match[0].length;}return out+esc(text.slice(prev));
}
function learnView(){const w=wordMap[session.fresh[session.index]];return `<div class="exercise-top"><span class="pill">在语境里学词</span><span class="muted">${session.index+1} / ${session.fresh.length}</span></div><p class="eyebrow">A WORD WORTH KEEPING</p><div class="learn-word"><h2>${esc(w.term)}</h2><button class="icon-button round-sound" data-speak="${esc(w.term)}" aria-label="朗读 ${esc(w.term)}">${icon('volume')}</button></div><p class="phonetic">${esc(w.ipa)}</p><p class="word-meaning">${esc(w.meaning)}</p><div class="collocation-card"><span>一起记住这个搭配</span><strong>${esc(w.collocation)}</strong></div><blockquote class="word-example">${esc(w.example)}<small>${esc(w.translation)}</small></blockquote><div class="exercise-actions"><button class="text-button" data-action="known">这个词我已经熟悉了</button><button class="primary" data-action="learn-next">记住了，继续 ${icon('arrow')}</button></div><p class="small-note">下一步会隐藏答案，让你主动回忆。现在看过，还不等于已经掌握。</p>`;}
function writeView(){const l=lessons.find(l=>l.id===session.lesson);return `<div class="exercise-top"><span class="pill">把它变成你的话</span><span class="muted">最后一步</span></div><p class="eyebrow">MAKE IT YOURS</p><h2 class="exercise-title">现在，换你来说一句。</h2><p class="write-prompt">${esc(l.prompt)}</p><label class="sr-only" for="writing-input">写一句英文</label><textarea id="writing-input" rows="4" placeholder="不必完美。先把你的意思写出来。">${esc(session.writing)}</textarea><div class="exercise-actions"><button class="text-button" data-action="show-model">看看一种表达方式</button><button class="primary" data-action="finish">${session.writing.trim()?'完成今晚的学习':'今天先到这里'} ${icon('check')}</button></div>${session.modelShown?`<div class="model-answer"><span class="eyebrow">ONE POSSIBLE ANSWER</span><p>${esc(l.model)}</p><small>${esc(l.translation)}</small><button class="text-button" data-speak="${esc(l.model)}">${icon('volume')} 听这句话</button></div>`:''}<p class="small-note">${session.writing.trim()?'对照检查：意思清楚吗？目标词搭配自然吗？这里采用自查，不提供自动评分。':'想休息时可以直接结束。你的词汇练习已经记录。'}</p>`;}
function doneView(){return `<div class="completion-art">${icon('star')}</div><p class="eyebrow">A LITTLE, BUT WELL.</p><h2 class="completion-title">今晚这一小步，<br>已经留下来了。</h2><p class="muted">现在，可以安心去休息。</p><div class="completion-stats"><div><strong>${session.fresh.length-session.skipped.length}</strong><span>接触的新词</span></div><div><strong>${session.score}/${session.total}</strong><span>首次回忆正确</span></div><div><strong>${(session.seconds/60).toFixed(1)}</strong><span>分钟的投入</span></div></div>${session.errors.length?`<p class="completion-note">${session.errors.length} 个词还需要巩固，约 10 分钟后进入复习队列。<br>一次错题，不会变成明天的一整页任务。</p>`:'<p class="completion-note">成功回忆的词会从明天起分批回来。<br>新词用过一次，再慢慢记牢。</p>'}<button class="primary" data-action="back-home">回到首页 ${icon('arrow')}</button>`;}
function sessionView(){
 const names=session.reviewOnly?['回忆旧词','完成']:['复习旧词','读一小段','语境词汇','主动回忆','自己表达'];const stages=session.reviewOnly?['review','done']:['review','read','learn','recall','write'];
 return `<div class="session-header"><button class="text-button" data-action="pause">${icon(session.stage==='done'?'arrow':'pause')} ${session.stage==='done'?'返回首页':'暂停，稍后继续'}</button><span class="session-timer" aria-label="当前学习时长">${icon('clock')} <span id="session-time">${formatTime(session.seconds)}</span></span></div><div class="session-path">${names.map((name,i)=>`<span class="${stages.indexOf(session.stage)>=i||session.stage==='done'?'passed':''}"><i>${i+1}</i>${name}</span>`).join('')}</div><section class="exercise-card ${session.stage==='done'?'done-card':''}">${{review:questionView,read:readView,learn:learnView,recall:questionView,write:writeView,done:doneView}[session.stage]()}</section>`;
}
function formatTime(n){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
function formatDuration(n){return n<60?`${n} 秒`:`${Math.round(n/60)} 分钟`;}
function checkQuestion(value){
 if(!session||session.checked)return;
 if(!value.trim()){toast('先试着输入一个词，也可以查看提示。');return;}
 const q=session.queue[session.index],w=wordMap[q.id];session.answer=value;session.checked=true;session.correct=checkAnswer(value,w);
 const independent=session.correct&&!session.hinted;
 if(!q.retry){session.total++;if(independent)session.score++;state.words[w.id]=schedule(state.words[w.id],independent?'good':'again');if(!independent){if(!session.errors.includes(w.id))session.errors.push(w.id);session.queue.push({...q,retry:true});}}
 // Corrective repeats reinforce memory without counting as independent successes.
 checkpoint();render();
}
function nextQuestion(){
 if(!session.checked)return;
 if(session.index+1<session.queue.length){session.index++;session.checked=false;session.answer='';session.hinted=false;checkpoint();render();focusSession();return;}
 if(session.stage==='review'){
   if(session.reviewOnly)finish();else if(session.fresh.length)moveStage('read');else moveStage('write');
 } else moveStage('write');
}
function nextWord(known=false){
 const id=session.fresh[session.index];state.words[id]=schedule(state.words[id],known?'known':'seen');if(known)session.skipped.push(id);
 if(session.index+1<session.fresh.length){session.index++;checkpoint();render();}
 else {session.queue=session.fresh.filter(id=>!session.skipped.includes(id)).map(id=>({id,kind:'fresh',retry:false}));moveStage(session.queue.length?'recall':'write');}
}
function finish(){
 if(session.completed)return;
 const l=lessons.find(l=>l.id===session.lesson);
 state.sessions.push({day:dayKey(),seconds:session.seconds,correct:session.score,total:session.total,newCount:session.fresh.length-session.skipped.length,title:session.reviewOnly?'找回熟悉感 · 旧词复习':l.title,output:session.writing.trim()});
 session.completed=true;session.stage='done';state.draft=null;save();render();
}
function pause(){if(!session)return;if(!session.completed)checkpoint();session=null;modal=null;window.speechSynthesis?.cancel();render();}
function speak(text){
 if(!('speechSynthesis' in window)){toast('这台设备暂不支持朗读，可继续阅读和练习。');return;}
 window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=0.88;
 const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('en'));if(voice)u.voice=voice;
 u.onerror=()=>toast('英语语音暂不可用，请检查设备语音设置。');window.speechSynthesis.speak(u);
}
function openModal(m){focusBeforeModal=document.activeElement;modal=m;render();}
function closeModal(){modal=null;render();const key=focusBeforeModal?.dataset?.word||focusBeforeModal?.dataset?.preview;if(key){($(`[data-word="${key}"]`)||$(`[data-preview="${key}"]`))?.focus();}else $('#main')?.focus();}
function modalView(){
 let body='';
 if(modal.type==='preview'){const l=lessons.find(l=>l.id===modal.id);body=`<span class="pill">${esc(l.tag)} · 四级进阶</span><h2 id="modal-title">${esc(l.title)}</h2><p class="muted">${esc(l.english)}</p><p class="preview-text">${esc(l.text.split('. ').slice(0,3).join('. '))}…</p><div class="preview-words">${l.words.map(w=>`<span>${esc(w.term)}</span>`).join('')}</div><p class="small-note">${esc(l.subtitle)} · ${l.words.filter(w=>!state.words[w.id]).length} 个未学词</p><button class="primary" data-select-lesson="${l.id}">把它加入今晚的计划 ${icon('arrow')}</button>`;}
 if(modal.type==='word'){const w=wordMap[modal.id];body=`<p class="eyebrow">${esc(w.lessonTitle)}</p><div class="modal-word-heading"><h2 id="modal-title">${esc(w.term)}</h2><button class="icon-button" data-speak="${esc(w.term)}" aria-label="朗读 ${esc(w.term)}">${icon('volume')}</button></div><p class="phonetic">${esc(w.ipa)}</p><p class="word-meaning">${esc(w.meaning)}</p><div class="collocation-card"><span>常用搭配</span><strong>${esc(w.collocation)}</strong></div><blockquote class="word-example">${esc(w.example)}<small>${esc(w.translation)}</small></blockquote><div class="word-detail-footer"><span class="status-pill">${wordStatus(state.words[w.id])}</span><button class="text-button" data-speak="${esc(w.example)}">${icon('volume')} 听例句</button></div>${state.words[w.id]&&!state.words[w.id].known?`<p class="small-note">下次复习：${new Date(state.words[w.id].due).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>`:''}`;}
 if(modal.type==='replace')body=`<h2 id="modal-title">上次的学习还在这里。</h2><p class="muted">可以接着学，或开始新的计划。开始新计划会替换未完成的流程；已经练习过的词仍会保留。</p><div class="button-row"><button class="primary" data-action="resume">接着上次学</button><button class="secondary" data-action="replace-draft">开始新计划</button></div>`;
 if(modal.type==='install')body=`<h2 id="modal-title">把夜航放在手边。</h2><p>电脑：在 Chrome / Edge 地址栏的安装图标中安装。</p><p>Android：浏览器菜单 → 安装应用 / 添加到主屏幕。</p><p>iPhone：Safari 分享按钮 → 添加到主屏幕。</p><p class="small-note">完整安装和离线能力需要 HTTPS 或 localhost。首次加载后，可离线练习已缓存内容；朗读取决于设备语音。</p>`;
 if(modal.type==='reset')body=`<h2 id="modal-title">清空本机进度？</h2><p class="muted">词汇、学习足迹、未完成练习和偏好都会删除。建议先导出备份。</p><div class="button-row"><button class="secondary" data-action="export">先导出备份</button><button class="danger-button" data-action="confirm-reset">确认清空</button></div>`;
 if(modal.type==='import')body=`<h2 id="modal-title">用备份替换本机进度？</h2><p class="muted">已检查备份格式。将导入 ${Object.keys(modal.backup.words).length} 个词的记录、${modal.backup.sessions.length} 次学习足迹。当前记录会被替换。</p><div class="button-row"><button class="secondary" data-action="export">先备份当前记录</button><button class="primary" data-action="confirm-import">确认替换</button></div>`;
 if(modal.type==='reminder')body=`<span class="pill">给自己一点时间</span><h2 id="modal-title">今天的微光，等你点亮。</h2><p class="muted">${esc(lessonNow().title)}<br>可以花 ${modes[state.settings.mode].minutes} 分钟，也可以今天休息。</p><div class="button-row"><button class="primary" data-action="reminder-start">开始学习 ${icon('arrow')}</button><button class="secondary" data-action="close-modal">今天休息</button></div>`;
 return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><button class="icon-button modal-close" data-action="close-modal" aria-label="关闭弹窗">${icon('close')}</button>${body}</section></div>`;
}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportBackup(){const backup={...state,draft:null};download(JSON.stringify(backup,null,2),`nightflight-${dayKey()}.json`,'application/json');toast('备份已导出。请妥善保存下载的 JSON 文件。');}
function exportCalendar(){const [h,m]=state.settings.reminder.split(':');const d=new Date();d.setHours(Number(h),Number(m),0,0);if(d<Date.now())d.setDate(d.getDate()+1);const stamp=`${dayKey(d).replaceAll('-','')}T${h}${m}00`;download(['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nightflight//English//ZH','BEGIN:VEVENT',`UID:nightflight-${Date.now()}@local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,`DTSTART:${stamp}`,'DURATION:PT8M','RRULE:FREQ=DAILY','SUMMARY:给自己一点时间 · 夜航英语','DESCRIPTION:学几个值得记住的词。今天很累也可以休息。','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:夜航英语 · 今晚的轻量计划','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n'),'nightflight-reminder.ics','text/calendar;charset=utf-8');toast('日历文件已导出，导入日历后可开启提醒。');}

document.addEventListener('click',async e=>{
 const el=e.target.closest('button,a,label');if(!el)return;
 if(el.dataset.nav){e.preventDefault();if(session)pause();page=el.dataset.nav;modal=null;render();window.scrollTo({top:0});$('#main')?.focus();return;}
 if(el.dataset.mode){state.settings.mode=el.dataset.mode;save();render();return;}
 if(el.dataset.preview){openModal({type:'preview',id:el.dataset.preview});return;}
 if(el.dataset.word){openModal({type:'word',id:el.dataset.word});return;}
 if(el.dataset.speak){speak(el.dataset.speak);return;}
 if(el.dataset.filter){filter=el.dataset.filter;render();return;}
 if(el.dataset.selectLesson){state.settings.topic=el.dataset.selectLesson;save();modal=null;page='today';render();toast('今晚的内容已更新，准备好时就开始。');window.scrollTo({top:0});return;}
 const action=el.dataset.action;
 if(action==='start')start();
 if(action==='review-only')start(true);
 if(action==='resume'){if(!state.draft){closeModal();return;}session=structuredClone(state.draft);modal=null;render();focusSession();}
 if(action==='replace-draft'){const only=modal.reviewOnly;state.draft=null;startNew(only);}
 if(action==='pause')pause();
 if(action==='hint'){session.answer=$('#answer-input')?.value||'';session.hinted=true;checkpoint();render();focusSession();}
 if(action==='next-question')nextQuestion();
 if(action==='toggle-translation'){session.translationShown=!session.translationShown;checkpoint();render();}
 if(action==='read-next')moveStage(session.fresh.length?'learn':'write');
 if(action==='learn-next')nextWord();
 if(action==='known')nextWord(true);
 if(action==='show-model'){session.modelShown=true;session.writing=$('#writing-input').value;checkpoint();render();}
 if(action==='finish'){session.writing=$('#writing-input')?.value||session.writing;finish();}
 if(action==='back-home'){session=null;page='today';const next=lessons.find(l=>l.words.some(w=>!state.words[w.id]));if(next&&!lessonNow().words.some(w=>!state.words[w.id])){state.settings.topic=next.id;save();}render();window.scrollTo({top:0});}
 if(action==='close-modal')closeModal();
 if(action==='export')exportBackup();
 if(action==='calendar')exportCalendar();
 if(action==='reset')openModal({type:'reset'});
 if(action==='confirm-reset'){state=initialState();session=null;modal=null;save();render();toast('本机学习记录已清空。');}
 if(action==='confirm-import'){state=modal.backup;session=null;modal=null;save();render();toast('备份已导入。');}
 if(action==='reminder-start'){modal=null;start();}
 if(action==='install'){if(installPrompt){try{await installPrompt.prompt();installPrompt=null;}catch{openModal({type:'install'});}}else openModal({type:'install'});}
});
document.addEventListener('submit',e=>{if(e.target.id==='answer-form'){e.preventDefault();checkQuestion($('#answer-input').value);}});
document.addEventListener('input',e=>{
 if(e.target.id==='word-search'){const pos=e.target.selectionStart;search=e.target.value;render();$('#word-search').focus();$('#word-search').setSelectionRange(pos,pos);}
 if(e.target.id==='writing-input'&&session){session.writing=e.target.value;const finishButton=$('[data-action="finish"]');if(finishButton)finishButton.innerHTML=`${session.writing.trim()?'完成今晚的学习':'今天先到这里'} ${icon('check')}`;checkpoint();}
 if(e.target.id==='answer-input'&&session){session.answer=e.target.value;checkpoint();}
});
document.addEventListener('change',async e=>{
 if(e.target.id==='reminder-time'){if(e.target.value)state.settings.reminder=e.target.value;save();toast('提醒时间已保存。');}
 if(e.target.id==='reminder-enabled'){state.settings.remind=e.target.checked;save();toast(e.target.checked?'页面内提醒已开启。':'页面内提醒已关闭。');}
 if(e.target.id==='import-file'&&e.target.files[0]){
  try {if(e.target.files[0].size>2*1024*1024)throw new Error('备份文件过大，请选择 2MB 以内的夜航备份');const data=JSON.parse(await e.target.files[0].text());const backup=validateBackup(data,new Set(allWords.map(w=>w.id)));openModal({type:'import',backup});}
  catch(err){toast(err instanceof SyntaxError?'无法读取这个 JSON 文件，请选择有效备份。':err.message);e.target.value='';}
 }
});
document.addEventListener('keydown',e=>{
 if(!modal)return;
 if(e.key==='Escape'){e.preventDefault();closeModal();}
 if(e.key==='Tab'){const nodes=[...$('.modal').querySelectorAll('button,a,input,textarea,select,[tabindex="0"]')].filter(n=>!n.disabled);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===$('.modal'))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===$('.modal'))){e.preventDefault();first?.focus();}}
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('pagehide',()=>{if(session&&!session.completed)checkpoint();window.speechSynthesis?.cancel();});
setInterval(()=>{
 if(session&&!session.completed&&!document.hidden&&!modal){session.seconds++;const el=$('#session-time');if(el)el.textContent=formatTime(session.seconds);if(session.seconds%10===0)checkpoint();}
 const now=new Date();const time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
 if(state.settings.remind&&!document.hidden&&!session&&!modal&&lastReminderDay!==dayKey()&&time===state.settings.reminder){lastReminderDay=dayKey();try{sessionStorage.setItem('nightflight.reminder',lastReminderDay);}catch{}openModal({type:'reminder'});}
},1000);
if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('./sw.js').catch(()=>toast('离线缓存暂未启用，在线学习不受影响。'));}
render();
if(startupError)toast('本机记录无法读取，已使用空白学习状态。原记录未被自动覆盖。');
