export const STORAGE_KEY = 'nightflight.v1';
export const modes = {
  standard:{label:'刚刚好', minutes:8, fresh:8, review:12},
  short:{label:'有点忙', minutes:4, fresh:4, review:6},
  rest:{label:'很累了', minutes:1, fresh:0, review:4}
};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function initialState() {
  return {version:1, words:{}, sessions:[], settings:{mode:'standard', reminder:'21:15', remind:false, topic:'boundaries'}, draft:null};
}
export function dueWords(state, now=Date.now()) {
  return Object.entries(state.words).filter(([,s]) => !s.known && s.due <= now).sort((a,b) => a[1].due-b[1].due).map(([id]) => id);
}
export function makePlan(state, lesson, now=Date.now()) {
  const config = modes[state.settings.mode] || modes.standard;
  const due = dueWords(state, now);
  const review = due.slice(0, config.review);
  // Overdue review consumes the day's new-word budget, so a long absence never creates an enormous task.
  const freshBudget = Math.max(0, config.fresh - Math.max(0, due.length-config.review));
  const fresh = lesson.words.filter(w => !state.words[w.id]).slice(0, freshBudget).map(w => w.id);
  return {review, fresh, pending:Math.max(0,due.length-review.length), minutes:config.minutes};
}
export function schedule(previous, grade, now=Date.now()) {
  const old = previous || {seen:0, successes:0, lapses:0, interval:0};
  if (grade === 'known') return {...old, seen:old.seen+1, known:true, due:null, updated:now};
  if (grade === 'seen') return {...old, known:false, seen:old.seen+1, due:now+10*60*1000, updated:now};
  const successes = grade === 'again' ? 0 : old.successes+1;
  const intervals = [1,3,7,14,30];
  const interval = grade === 'again' ? 0 : intervals[Math.min(successes-1,intervals.length-1)];
  return {...old, known:false, seen:old.seen+1, successes, lapses:old.lapses+(grade === 'again' ? 1 : 0), interval, due:now+(grade === 'again' ? 10*60*1000 : interval*86400000), updated:now};
}
export function normalizeAnswer(value) { return value.trim().toLowerCase().replace(/[’']/g,"'").replace(/[.!?。！？]+$/g,'').replace(/\s+/g,' '); }
export function checkAnswer(value, word) { return [word.term,...(word.answers||[])].some(answer => normalizeAnswer(value) === normalizeAnswer(answer)); }
export function wordStatus(wordState) {
  if (!wordState) return '未学习';
  if (wordState.known) return '已认识';
  if (wordState.successes >= 3) return '较稳定';
  if (wordState.successes > 0) return '能回忆';
  return '待巩固';
}
export function validateDraft(draft, validIds, lessonIds) {
  if (!draft || !lessonIds.has(draft.lesson) || !['review','read','learn','recall','write'].includes(draft.stage)) return null;
  if (!['fresh','review','skipped','errors'].every(key=>Array.isArray(draft[key]) && draft[key].every(id=>validIds.has(id)))) return null;
  if (!Array.isArray(draft.queue) || !draft.queue.every(q=>q && validIds.has(q.id) && ['review','fresh'].includes(q.kind) && typeof q.retry==='boolean')) return null;
  if (!Number.isInteger(draft.index) || draft.index<0 || !['seconds','score','total'].every(key=>Number.isFinite(draft[key]) && draft[key]>=0) || draft.score>draft.total) return null;
  if (['review','recall'].includes(draft.stage) && draft.index>=draft.queue.length || draft.stage==='learn' && draft.index>=draft.fresh.length) return null;
  if (typeof draft.answer!=='string' || typeof draft.writing!=='string' || draft.writing.length>10000 || draft.answer.length>1000) return null;
  return {...draft,completed:false};
}
export function validateBackup(input, validIds) {
  if (!input || input.version !== 1 || !input.words || Array.isArray(input.words) || !Array.isArray(input.sessions) || !input.settings) throw new Error('这不是有效的夜航备份');
  const clean = initialState();
  for (const [id,w] of Object.entries(input.words)) {
    if (!validIds.has(id) || !w || !Number.isFinite(w.seen) || w.seen < 0 || !Number.isFinite(w.successes) || w.successes < 0 || !Number.isFinite(w.lapses) || w.lapses < 0 || !Number.isFinite(w.interval) || w.interval < 0 || (!w.known && !Number.isFinite(w.due))) throw new Error('备份中的词汇记录不完整');
    clean.words[id] = {seen:w.seen, successes:w.successes, lapses:w.lapses, interval:w.interval, due:w.known?null:w.due, known:!!w.known, updated:Number(w.updated)||0};
  }
  for (const s of input.sessions) {
    if (!s || typeof s.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.day) || !Number.isFinite(s.seconds) || s.seconds < 0 || !Number.isFinite(s.correct) || !Number.isFinite(s.total) || s.correct < 0 || s.total < s.correct || !Number.isFinite(s.newCount) || s.newCount < 0 || typeof s.title !== 'string') throw new Error('备份中的学习记录不完整');
    clean.sessions.push({day:s.day,seconds:s.seconds,correct:s.correct,total:s.total,newCount:s.newCount,title:s.title.slice(0,100),...(typeof s.output==='string'?{output:s.output.slice(0,10000)}:{})});
  }
  clean.settings.mode = modes[input.settings.mode] ? input.settings.mode : 'standard';
  clean.settings.reminder = /^([01]\d|2[0-3]):[0-5]\d$/.test(input.settings.reminder) ? input.settings.reminder : '21:15';
  clean.settings.remind = !!input.settings.remind;
  clean.settings.topic = typeof input.settings.topic === 'string' ? input.settings.topic : 'boundaries';
  return clean;
}
