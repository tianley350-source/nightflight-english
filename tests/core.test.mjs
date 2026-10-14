import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,makePlan,schedule,dueWords,checkAnswer,validateBackup,validateDraft,wordStatus,dayKey} from '../core.js';
import {lessons,allWords} from '../data.js';
const now=1800000000000;
test('energy budgets and long absence reduce new words instead of creating a huge task',()=>{
 const s=initialState();assert.equal(makePlan(s,lessons[0],now).fresh.length,8);
 s.settings.mode='short';assert.equal(makePlan(s,lessons[0],now).fresh.length,4);
 s.settings.mode='rest';assert.equal(makePlan(s,lessons[0],now).fresh.length,0);
 s.settings.mode='standard';allWords.slice(8,28).forEach(w=>s.words[w.id]={known:false,due:now-1});
 const p=makePlan(s,lessons[0],now);assert.equal(p.review.length,12);assert.equal(p.fresh.length,0);assert.equal(p.pending,8);
});
test('exposure is not mastery; correct recall follows 1, 3, 7 day intervals',()=>{
 let w=schedule(undefined,'seen',now);assert.equal(wordStatus(w),'待巩固');assert.equal(w.due,now+600000);
 w=schedule(w,'good',now);assert.equal(w.interval,1);assert.equal(wordStatus(w),'能回忆');
 w=schedule(w,'good',now+86400000);assert.equal(w.interval,3);
 w=schedule(w,'good',now+4*86400000);assert.equal(w.interval,7);assert.equal(wordStatus(w),'较稳定');
});
test('a failed recall resets stability and becomes due in ten minutes',()=>{
 const w=schedule({seen:5,successes:3,lapses:0,interval:7},'again',now);
 assert.equal(w.successes,0);assert.equal(w.lapses,1);assert.equal(w.due,now+600000);assert.equal(wordStatus(w),'待巩固');
});
test('known words never return to the due queue',()=>{
 const s=initialState();s.words.b1=schedule(undefined,'known',now);assert.deepEqual(dueWords(s,now+9999999999),[]);
 assert.equal(makePlan(s,lessons[0],now).fresh.length,7);
});
test('answers normalize case and punctuation without accepting partial or unrelated words',()=>{
 const w=lessons[0].words[0];assert.ok(checkAnswer('  Reluctant! ',w));assert.ok(!checkAnswer('reluct',w));assert.ok(!checkAnswer('considerate',w));
});
test('backup round-trip preserves learned words and rejects malformed records',()=>{
 const s=initialState();s.words.b1=schedule(undefined,'good',now);s.sessions.push({day:'2026-10-14',seconds:90,correct:1,total:1,newCount:1,title:'test'});
 const ids=new Set(allWords.map(w=>w.id));const restored=validateBackup(JSON.parse(JSON.stringify(s)),ids);
 assert.deepEqual(restored,s);assert.throws(()=>validateBackup({...s,words:{b1:{}}},ids));
 assert.throws(()=>validateBackup({...s,words:{invalid:s.words.b1}},ids));
 assert.throws(()=>validateBackup({...s,sessions:[{...s.sessions[0],correct:2}]},ids));
});
test('the content bank has unique IDs and valid exercises for every word',()=>{
 assert.equal(new Set(allWords.map(w=>w.id)).size,allWords.length);
 allWords.forEach(w=>{assert.ok(w.cloze.includes('____'));assert.ok(w.example.toLowerCase().includes(w.term));assert.ok(checkAnswer(w.term,w));});
 lessons.forEach(l=>assert.equal(l.words.length,8));
});
test('local day keys follow the client local calendar',()=>assert.equal(dayKey(new Date(2026,9,14,23,30)),'2026-10-14'));
test('invalid resume drafts never index outside a learning queue',()=>{
 const ids=new Set(allWords.map(w=>w.id)),lessonIds=new Set(lessons.map(l=>l.id));
 const draft={lesson:'boundaries',stage:'learn',fresh:['b1'],review:[],skipped:[],errors:[],queue:[],index:0,seconds:0,score:0,total:0,answer:'',writing:''};
 assert.ok(validateDraft(draft,ids,lessonIds));assert.equal(validateDraft({...draft,index:1},ids,lessonIds),null);
 assert.equal(validateDraft({...draft,stage:'recall',queue:[]},ids,lessonIds),null);
 assert.equal(validateDraft({...draft,score:2,total:1},ids,lessonIds),null);
});
