import {BUILD} from './release-build.mjs';
export const VERSION = '2.0.0-rehearsal.1';
export const STORAGE_KEY = 'lexitrek-research-v2';
export const BLOCKS = ['A','B','C','D'];
export const LESSONS = [
  {n:1,week:1,introduce:['A'],review:[],focus:'Meet Block A; build meaning and begin written recall.'},
  {n:2,week:1,introduce:['B'],review:['A'],focus:'Revisit A and meet Block B.'},
  {n:3,week:2,introduce:['C'],review:['A','B'],focus:'Revisit A/B and meet Block C.'},
  {n:4,week:2,introduce:['D'],review:['B','C'],focus:'Revisit B/C and meet Block D.'},
  {n:5,week:3,introduce:[],review:['A','B','C','D'],focus:'Review A/B and selected C/D words.'},
  {n:6,week:3,introduce:[],review:['C','D','A','B'],focus:'Review C/D and selected A/B words.'},
  {n:7,week:4,introduce:[],review:BLOCKS,focus:'Interleave recall and contextual gap practice.'},
  {n:8,week:4,introduce:[],review:BLOCKS,focus:'Final planned cumulative recall practice.'}
];
export const CHECKLIST = [
  ['Attention','Tasks direct attention to target vocabulary without unnecessary distraction'],
  ['Attention','Variation occurs among relevant vocabulary tasks'],
  ['Relevance','Words and situations match approved curriculum themes'],
  ['Relevance','Teacher makes the learning purpose comprehensible'],
  ['Confidence','Difficulty and hints permit meaningful attempts before answers'],
  ['Confidence','Incorrect responses receive helpful corrective information'],
  ['Satisfaction','Completion feedback accurately reflects task performance'],
  ['Satisfaction','Personal progress display or feedback is verified']
];
export function normal(value) { return String(value??'').normalize('NFKC').trim().toLowerCase().replace(/[.!?,;:]+$/u,'').replace(/\s+/g,' '); }
export function uid(){ return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`; }
export function emptyState(){return {schemaVersion:2,mode:'rehearsal',phase:'preparation',release:null,profile:{code:'P001',classCode:'C1',avatar:0,authorised:false},active:null,events:[],sessions:[],observations:[],assessments:{O1:null,O2:null,O3:null},deviations:[],importedEvents:[],extraMinutes:0};}
export function validatePack(p){
  const errors=[];
  if(!p||p.schemaVersion!==1||!Array.isArray(p.words)||!Array.isArray(p.blocks))return ['A schemaVersion 1 word pack is required.'];
  if(p.words.length<4||p.words.length>120)errors.push('Use 4–120 target records; final study N needs independent approval.');
  if(p.blocks.length!==4||new Set(p.blocks.map(b=>b.id)).size!==4||p.blocks.some(b=>!BLOCKS.includes(b.id)))errors.push('Exactly four distinct blocks A–D are required.');
  const ids=new Set(),terms=new Set();
  for(const w of p.words){
    if(!/^[A-Z0-9_-]{3,80}$/.test(w.id||'')||ids.has(w.id))errors.push('Word IDs must be present, unique and contain only capital letters, numbers, underscores or hyphens.');ids.add(w.id);
    if(!/^[a-z]+(?:[-'][a-z]+)*$/i.test(w.term||''))errors.push(`Use a single-word target: ${w.term||'missing'}.`);
    if(terms.has(normal(w.term)))errors.push(`Duplicate target: ${w.term}.`);terms.add(normal(w.term));
    if(!BLOCKS.includes(w.block))errors.push(`Unknown block for ${w.term}.`);
    if(!w.senseEn?.trim()||!w.senseBm?.trim()||!Array.isArray(w.contexts)||w.contexts.length<2||!w.gap?.includes('____'))errors.push(`Missing teaching content for ${w.term}.`);
    if(!Array.isArray(w.formAnswers)||!w.formAnswers.some(a=>normal(a)===normal(w.term))||!Array.isArray(w.meaningAnswers)||!w.meaningAnswers.length)errors.push(`Missing draft answer specifications for ${w.term}.`);
    if(!['original','licensed'].includes(w.rights?.status))errors.push(`Content rights record needed for ${w.term}.`);
    if(w.audio!==null&&w.audio!==undefined&&(!/^\.\/audio\/[a-z0-9_-]+\.(mp3|wav|ogg)$/i.test(w.audio)))errors.push(`Audio must be an explicitly packaged local file for ${w.term}.`);
  }
  for(const b of BLOCKS)if(!p.blocks.some(x=>x.id===b)||!p.words.some(x=>x.block===b))errors.push(`Block ${b} needs a title and at least one word.`);
  return errors;
}
export function canonical(v){if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';return JSON.stringify(v);}
export async function fingerprint(p){const bytes=new TextEncoder().encode(canonical({sourceSha:BUILD.sourceSha,appVersion:VERSION,pack:p,lessons:LESSONS}));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function readiness(p){
  const errors=validatePack(p);if(errors.length)return errors;
  if(p.status!=='approved'||p.review?.status!=='approved')errors.push('The target pack is still a draft.');
  for(const k of ['teacherReference','expertReference','protocolReference','rightsReference','deviceCheckReference'])if(!p.review?.[k]?.trim())errors.push(`Missing ${k}.`);
  for(const w of p.words){
    if(!w.review?.teacher?.trim()||!w.review?.expert?.trim())errors.push(`Teacher/expert review pending: ${w.term}.`);
    if(!['checked','not-applicable-with-reason'].includes(w.review?.evpStatus)||!w.review?.evpReference?.trim())errors.push(`Sense-level reference or documented exception pending: ${w.term}.`);
    if(w.rights?.status==='licensed'&&!w.rights?.reference?.trim())errors.push(`Licence evidence pending: ${w.term}.`);
  }
  return errors;
}
export function checkProfile(profile){return /^P\d{3,6}$/.test(profile?.code||'')&&/^C\d{1,3}$/.test(profile?.classCode||'');}
export function contentLocked(s){return ['assessment_hold','follow_up','completed'].includes(s.phase);}
export function startAllowed(s,p,hash,n){
  if(contentLocked(s))return 'Study-word practice is paused after S8. Record the external assessments and obtain the post-study release before further practice.';
  if(!LESSONS.some(l=>l.n===n))return 'Unknown lesson.';
  if(!checkProfile(s.profile))return 'Use coded identifiers such as P001 and C1.';
  if(s.active)return 'Finish or close the current lesson first.';
  if(s.mode==='research'){
    if(!s.release||s.release.fingerprint!==hash||s.release.version!==VERSION)return 'Import and freeze an approved release before research lessons.';
    if(readiness(p).length)return 'Research target approvals are incomplete.';
    if(!s.assessments.O1)return 'Record the externally administered O1 before S1.';
    if(s.phase!=='intervention')return 'The study is not in its instructional phase.';
  }
  if(s.sessions.some(x=>x.lesson===n&&x.profile===s.profile.code&&x.classCode===s.profile.classCode&&x.completed))return 'This coded learner already completed this lesson. Extra exposure must be recorded rather than silently replayed.';
  if(n>1&&!s.sessions.some(x=>x.lesson===n-1&&x.profile===s.profile.code&&x.classCode===s.profile.classCode&&x.completed))return 'Complete the preceding lesson for this coded learner first, or document an interrupted lesson.';
  return null;
}
export function lessonTasks(p,n){
  const lesson=LESSONS.find(l=>l.n===n);if(!lesson)throw Error('Unknown lesson');
  const tasks=[];const add=(w,kind,context=0)=>tasks.push({id:`S${n}-${tasks.length+1}-${w.id}-${kind}`,wordId:w.id,kind,context});
  const groups=Object.fromEntries(BLOCKS.map(b=>[b,p.words.filter(w=>w.block===b)]));
  if(n<=4){
    for(const b of lesson.review)for(const w of groups[b].filter((_,i)=>i%2===(n%2)))add(w,'form',1);
    for(const b of lesson.introduce)for(const w of groups[b]){add(w,'study');add(w,'recognition');add(w,'form');}
  }else if(n<=6){
    for(const b of lesson.review){const primary=n===5?['A','B'].includes(b):['C','D'].includes(b);for(const w of groups[b].filter((_,i)=>primary||i%2===(n%2))){add(w,'form',1);add(w,'meaning',1);}}
  }else if(n===7){for(let i=0;i<Math.max(...BLOCKS.map(b=>groups[b].length));i++)for(const b of BLOCKS){const w=groups[b][i];if(w)add(w,i%2?'gap':'meaning',1);}}
  else for(let i=0;i<Math.max(...BLOCKS.map(b=>groups[b].length));i++)for(const b of BLOCKS){const w=groups[b][i];if(w){add(w,'form',1);add(w,'meaning',1);}}
  return tasks;
}
export function beginLesson(s,p,hash,n,now=new Date().toISOString()){
  const reason=startAllowed(s,p,hash,n);if(reason)throw Error(reason);
  s.active={id:uid(),lesson:n,profile:s.profile.code,classCode:s.profile.classCode,authorised:!!s.profile.authorised,mode:s.mode,hash,startedAt:now,tasks:lessonTasks(p,n),index:0,result:null,support:[],answer:'',paused:false,taskStartedAt:now,activeMs:0};
  s.phase='intervention';event(s,'lesson_started',{taskCount:s.active.tasks.length},now);return s.active;
}
export function event(s,type,fields={},now=new Date().toISOString()){
  const a=s.active;
  const row={id:uid(),type,at:now,version:VERSION,fingerprint:a?.hash||s.release?.fingerprint||null,purpose:s.mode==='research'?'research':'rehearsal_not_study_data',profile:a?.profile||s.profile.code,classCode:a?.classCode||s.profile.classCode,authorised:a?.authorised??!!s.profile.authorised,sessionId:a?.id||null,lesson:a?.lesson||null,...fields};
  // Non-consenting pupils can learn; no item response ledger is retained in research mode.
  if(row.purpose==='research'&&!row.authorised)return row;
  s.events.push(row);return row;
}
export function options(p,w){const alternatives=p.words.filter(x=>x.id!==w.id&&x.partOfSpeech===w.partOfSpeech);const pool=alternatives.length>=2?alternatives:p.words.filter(x=>x.id!==w.id);const picked=[w,...pool.slice(0,2)];const shift=p.words.findIndex(x=>x.id===w.id)%picked.length;return picked.slice(shift).concat(picked.slice(0,shift));}
export function gradePractice(w,kind,answer,support=[]){
  if(kind==='study')return {status:'displayed',correct:null,assisted:true};
  const value=normal(answer);let status;
  if(kind==='recognition')status=answer===w.id?'correct':'incorrect';
  else if(!value)status='not_recalled';
  else if(kind==='meaning')status=[w.senseEn,w.senseBm,...w.meaningAnswers].some(x=>normal(x)===value)?'correct':'review_pending';
  else status=w.formAnswers.some(x=>normal(x)===value)?'correct':'incorrect';
  return {status,correct:status==='review_pending'?null:status==='correct',assisted:kind==='recognition'||support.length>0,independentPractice:!['study','recognition'].includes(kind)&&support.length===0};
}
export function answerTask(s,p,answer,elapsedMs=0,now=new Date().toISOString()){
  const a=s.active;if(!a||a.paused||a.result)throw Error('No answerable task.');
  if(contentLocked(s))throw Error('Study content is paused.');
  const t=a.tasks[a.index],w=p.words.find(x=>x.id===t.wordId);if(!w)throw Error('Word missing.');
  const g=gradePractice(w,t.kind,answer,a.support);
  const row=event(s,t.kind==='study'?'word_display_acknowledged':'practice_response',{wordId:w.id,taskId:t.id,taskKind:t.kind,answer:String(answer),...g,firstAttempt:!(a.taskAttemptCount>0),attemptNumber:(a.taskAttemptCount||0)+1,support:[...a.support],elapsedMs:Math.max(0,Math.round(elapsedMs))},now);
  a.taskAttemptCount=(a.taskAttemptCount||0)+1;a.result=row;a.activeMs+=Math.max(0,elapsedMs);return row;
}
export function addSupport(s,p,kind,now=new Date().toISOString()){
  const a=s.active;if(!a||a.paused||a.result)throw Error('Support is unavailable.');
  const t=a.tasks[a.index];if(t.kind==='study')return;
  // Before the first attempt, a learner may explicitly choose a supported route.
  // That choice is logged and can never be described as unaided practice.
  if(!['first_letter','bm','example','teacher'].includes(kind))throw Error('Unknown support.');
  if(!a.support.includes(kind))a.support.push(kind);
  event(s,'support_requested',{wordId:t.wordId,taskId:t.id,taskKind:t.kind,supportKind:kind},now);
}
export function advance(s,now=new Date().toISOString()){
  const a=s.active;if(!a?.result)throw Error('An attempt or acknowledgement is required.');
  a.index++;a.result=null;a.support=[];a.answer='';a.taskAttemptCount=0;a.taskStartedAt=now;
  return a.index>=a.tasks.length;
}
export function closeLesson(s,{completed=false,actualMinutes=null,technicalMinutes=0,note=''}={},now=new Date().toISOString()){
  const a=s.active;if(!a)throw Error('No active lesson.');
  if(completed&&a.index<a.tasks.length)throw Error('Cannot mark unfinished tasks complete.');
  if(actualMinutes!==null&&(!Number.isFinite(actualMinutes)||actualMinutes<0||actualMinutes>240))throw Error('Enter observed instructional minutes from 0 to 240.');
  if(!Number.isFinite(technicalMinutes)||technicalMinutes<0||technicalMinutes>240)throw Error('Enter valid interruption minutes.');
  event(s,'lesson_closed',{completed,observedInstructionMinutes:actualMinutes,technicalMinutes,note},now);
  const row={id:a.id,profile:a.profile,classCode:a.classCode,authorised:a.authorised,purpose:a.mode==='research'?'research':'rehearsal_not_study_data',fingerprint:a.hash,lesson:a.lesson,startedAt:a.startedAt,endedAt:now,completed,plannedMinutes:30,observedInstructionMinutes:actualMinutes,technicalMinutes,taskActiveMs:Math.round(a.activeMs),plannedTasks:a.tasks.length,completedTasks:a.index,note};
  s.sessions.push(row);s.active=null;
  // Ending S8 (even incomplete) stops further assigned target-word practice.
  if(row.lesson===8)s.phase='assessment_hold';return row;
}
export function timings(s){
  const last=s.sessions.filter(x=>x.lesson===8).at(-1);const o2=s.assessments.O2;
  return {s8:last?.endedAt||null,o2Earliest:last?new Date(Date.parse(last.endedAt)+86400000).toISOString():null,o2Latest:last?new Date(Date.parse(last.endedAt)+172800000).toISOString():null,o3Target:o2?new Date(Date.parse(o2.at)+28*86400000).toISOString():null,o3Earliest:o2?new Date(Date.parse(o2.at)+26*86400000).toISOString():null,o3Latest:o2?new Date(Date.parse(o2.at)+30*86400000).toISOString():null};
}
export function recordAssessment(s,occasion,at,note=''){
  if(!['O1','O2','O3'].includes(occasion)||!Number.isFinite(Date.parse(at)))throw Error('Supply an assessment occasion and valid actual date/time.');
  if(s.active)throw Error('Close the learning session first.');
  if(s.assessments[occasion])throw Error('An administration record already exists; use the documented amendment process.');
  const t=timings(s);let within=true;
  if(occasion==='O1'&&s.sessions.length)throw Error('O1 must precede the first lesson.');
  if(occasion==='O2'){if(!t.s8)throw Error('Record the end of S8 first.');if(Date.parse(at)<Date.parse(t.s8))throw Error('O2 must follow S8.');within=Date.parse(at)>=Date.parse(t.o2Earliest)&&Date.parse(at)<=Date.parse(t.o2Latest);}
  if(occasion==='O3'){if(!s.assessments.O2)throw Error('Record O2 first.');if(Date.parse(at)<Date.parse(s.assessments.O2.at))throw Error('O3 must follow O2.');within=Date.parse(at)>=Date.parse(t.o3Earliest)&&Date.parse(at)<=Date.parse(t.o3Latest);}
  if(!within&&!note.trim())throw Error('Out-of-window administration needs a deviation note.');
  const row={occasion,at:new Date(at).toISOString(),withinWindow:within,note,recordedAt:new Date().toISOString(),classCode:s.profile.classCode,formBeforeMeaning:'To be verified by external administrator'};
  s.assessments[occasion]=row;s.phase=({O1:'intervention',O2:'follow_up',O3:'completed'})[occasion];event(s,'external_assessment_administration',row);return row;
}
export function freeze(s,p,hash,at=new Date().toISOString()){
  const errors=readiness(p);if(errors.length)throw Error(errors.slice(0,5).join(' '));
  if(s.sessions.length||s.active||s.assessments.O1||s.events.length||s.observations.length||s.deviations.length||(s.conventionalLogs||[]).length)throw Error('Clear and archive rehearsal records before freezing a new run; freeze before O1.');
  s.release={id:'LT-R2-'+hash.slice(0,12),version:VERSION,fingerprint:hash,at,targetCount:p.words.length,externalTestResponses:2*p.words.length,review:structuredClone(p.review)};
  s.mode='research';s.phase='preparation';return s.release;
}
export function csv(rows,headers){const q=v=>{let text=String(v??'');if(typeof v==='string'&&/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};return [headers.map(q).join(','),...rows.map(row=>headers.map(h=>q(typeof row[h]==='object'?JSON.stringify(row[h]):row[h])).join(','))].join('\r\n');}
export function exportLedger(s,hash){const retain=r=>s.mode==='research'?(r.purpose==='research'&&r.authorised):r.purpose==='rehearsal_not_study_data';return {schemaVersion:2,appVersion:VERSION,fingerprint:hash,release:s.release,exportedAt:new Date().toISOString(),purpose:s.mode==='research'?'research_implementation_only':'rehearsal_not_study_data',assessmentBoundary:'No primary test responses or outcomes are collected in this app.',events:s.events.filter(retain),sessions:s.sessions.filter(retain),observations:s.observations,assessments:s.assessments,deviations:s.deviations};}
export function mergeLedgers(ledgers,expectedHash){
  const events=new Map(),sessions=new Map();
  for(const file of ledgers){
    if(file.schemaVersion!==2||file.fingerprint!==expectedHash||file.appVersion!==VERSION)throw Error('Exports from different releases cannot be combined.');
    if(file.purpose==='rehearsal_not_study_data')throw Error('Rehearsal exports must not enter the research dataset.');
    for(const [key,target] of [['events',events],['sessions',sessions]])for(const row of file[key]||[]){
      if(!row.authorised||row.purpose!=='research'||row.fingerprint!==expectedHash)throw Error('Unapproved or mixed-purpose record in research export.');
      if(!row.id)throw Error('Every record needs a unique ID.');
      if(target.has(row.id)&&canonical(target.get(row.id))!==canonical(row))throw Error('Conflicting duplicate record; investigate rather than overwrite.');
      target.set(row.id,row);
    }
  }
  return {schemaVersion:2,appVersion:VERSION,fingerprint:expectedHash,purpose:'research_implementation_only',events:[...events.values()],sessions:[...sessions.values()]};
}
