/* LexiTrek pilot 1.0.0. Buildless JavaScript; all URLs are repository-relative. */
"use strict";
(() => {
  const KEY = "lexitrek-pilot-v1";
  const VERSION = "1.0.0";
  const STATE_VERSION = 1;
  const main = document.querySelector("#main");
  const dialog = document.querySelector("#word-dialog");
  const phases = ["Discover", "Learn", "Practise", "Recall", "Use"];
  const typeNames = {single_word:"Word",multiword_term:"Multiword term",collocation:"Collocation",phrasal_verb:"Phrasal verb",expression:"Expression",affix:"Affix"};
  let bank, quest, targets, readyOffline = false;
  let filter = {query:"",theme:"all",type:"all",limit:12};
  let state = readState();

  function blankState() { return {version:STATE_VERSION,active:null,completed:null,reviews:[],attempts:[]}; }
  function readState() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (!s || s.version !== STATE_VERSION || !Array.isArray(s.attempts) || !Array.isArray(s.reviews)) return blankState();
      if (s.active && (!Number.isInteger(s.active.step) || s.active.step < 0 || s.active.step > 4 || !Number.isInteger(s.active.index) || s.active.index < 0 || s.active.index > 4 || !s.active.id || !["quest","review"].includes(s.active.kind))) s.active = null;
      return s;
    } catch { return blankState(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch {
      const note = document.querySelector("#save-status");
      note.hidden = false;
      note.textContent = "This browser cannot save progress. Keep this page open and download your learning record before leaving.";
    }
  }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
  function id() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  function normal(v) { return String(v).normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\s+/g," "); }
  function date(v) { return new Date(v).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"}); }
  function dateTime(v) { return new Date(v).toLocaleString(); }
  function mark() { return '<span aria-hidden="true">↗</span>'; }
  function setView(html, focus = true) {
    main.innerHTML = html;
    if (focus) { window.scrollTo({top:0,behavior:"instant"}); main.focus({preventScroll:true}); }
  }
  function currentRoute() { return ["words","progress"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "quest"; }
  function route(focus = true) {
    if (!bank) return;
    const page = currentRoute();
    document.querySelectorAll("[data-nav]").forEach(link => {
      if (link.dataset.nav === page) link.setAttribute("aria-current","page"); else link.removeAttribute("aria-current");
    });
    if (page === "words") renderWords(focus);
    else if (page === "progress") renderProgress(focus);
    else if (state.active) renderLesson(focus);
    else renderHome(focus);
  }
  function newSession(kind = "quest") {
    return {id:id(),kind,step:kind === "review" ? 3 : 0,index:0,startedAt:new Date().toISOString(),place:"Classroom",prediction:"",response:"",usedWords:[],reflection:{},hint:false,questionAttempts:0,result:null,reviewDay:kind === "review" ? dueReview()?.day || null : null};
  }
  function start(kind = "quest") {
    if (state.active) return route();
    state.active = newSession(kind); save();
    if (location.hash !== "#quest") location.hash = "quest"; else renderLesson();
  }
  function schedule() {
    if (!state.completed) return [];
    return quest.review_days.map(day => ({day,at:new Date(new Date(state.completed.firstCompletedAt||state.completed.completedAt).getTime()+day*86400000),done:state.reviews.find(r=>r.reviewDay===day)}));
  }
  function dueReview() { return schedule().find(r => !r.done && r.at.getTime() <= Date.now()); }
  function art() {
    return `<svg viewBox="0 0 460 400" aria-hidden="true"><circle cx="237" cy="205" r="158" fill="#24634e"/><circle cx="237" cy="205" r="124" fill="none" stroke="#548266" stroke-width="1" stroke-dasharray="4 9"/><path d="M100 310c-17-75 160-45 132-111s17-96 102-105" fill="none" stroke="#d6e7af" stroke-width="3" stroke-dasharray="7 10"/><path d="M257 302c-4-60 20-111 67-143" fill="none" stroke="#b3d591" stroke-width="5"/><path d="M285 236c-14-47 7-78 64-86-4 50-20 80-64 86Z" fill="#dfeeb9"/><path d="M272 269c-49 3-75-22-78-67 48 0 76 20 78 67Z" fill="#93b67b"/><path d="M281 238c-10-11-11-25-8-40" fill="none" stroke="#164e3f" stroke-width="2"/><g transform="rotate(-12 123 130)"><rect x="73" y="77" width="121" height="119" rx="16" fill="#f6f5ee"/><path d="m105 137 19 18 36-43" fill="none" stroke="#164e3f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M98 173h70" stroke="#b4c3a7" stroke-width="3"/></g><circle cx="103" cy="309" r="20" fill="#dfedb9"/><path d="m97 309 5 5 9-11" fill="none" stroke="#164e3f" stroke-width="3"/><circle cx="335" cy="94" r="18" fill="#e7ad7c"/><path d="M335 86v16m-8-8h16" stroke="#164e3f" stroke-width="2"/><g fill="#dfeeb9"><circle cx="73" cy="218" r="3"/><circle cx="370" cy="285" r="4"/><path d="M250 44v16m-8-8h16" stroke="#dfeeb9" stroke-width="2"/></g><text x="176" y="348" font-family="system-ui,sans-serif" font-size="11" letter-spacing="4" fill="#caddb9">ONE WORD AT A TIME</text></svg>`;
  }
  function renderHome(focus = true) {
    const done = state.completed;
    const due = dueReview();
    setView(`<section class="hero"><div class="hero-copy"><span class="eyebrow">YOUR NEXT WORD ADVENTURE</span><h1>Small words.<br>A <em>greener</em> world.</h1><p class="large-copy">Discover useful English. Try it out.<br>Make a little difference at school.</p><button class="btn light" id="start-quest">${done ? "Practise the quest again" : "Start my first quest"} ${mark()}</button><div class="hero-meta"><span>01 / A greener school</span><span>5 useful words</span><span>Learn at your own pace</span></div></div><div class="hero-art">${art()}</div></section>
      ${done ? `<div class="notice" style="margin-top:22px">You have completed this quest. ${due ? `Your day ${due.day} recall review is ready.` : `Your next scheduled review: ${schedule().find(r=>!r.done) ? date(schedule().find(r=>!r.done).at) : "all four reviews completed"}.`} <a href="#progress">See my progress</a></div>` : ""}
      <div class="section-heading"><h2>A small quest. A useful skill.</h2><p>Learn → remember → use</p></div><div class="quest-grid"><section class="panel"><span class="tag">Nature &amp; sustainability</span><h3>A greener school</h3><p>Can an old jar and used paper become useful again? Discover the difference between reusing and recycling.</p><div class="word-pills">${targets.map(e=>`<span>${esc(e.term)}</span>`).join("")}</div><p class="help">Your goal: explain these five words and use at least two in a helpful school message.</p><a href="#words" class="text-btn">Explore all ${bank.entries.length} learning records ${mark()}</a></section><section class="panel tint"><span class="eyebrow">YOUR LEARNING TRAIL</span><ol class="trail-list">${["Discover a school problem","Learn with examples","Choose the right meaning","Recall with the words hidden","Write your own useful message"].map((t,i)=>`<li><span class="step-number">${i+1}</span>${t}</li>`).join("")}</ol></section></div><p class="pilot-note">Pilot version: one complete quest and a word bank covering ${bank.themes.length} themes. Teaching content is awaiting teacher review. Progress stays in this browser.</p>`,focus);
    document.querySelector("#start-quest").onclick = () => start();
  }
  function renderWords(focus = true) {
    setView(`<header class="page-head"><span class="eyebrow">EXPLORE YOUR WORDS</span><h1>A world of words.</h1><p class="large-copy muted">Find a word, discover its meaning and see it in action.</p></header><div class="toolbar"><label>Search words or meanings<input id="search" type="search" value="${esc(filter.query)}" placeholder="Try ‘recycle’ or ‘school’" autocomplete="off"></label><label>Theme<select id="theme"><option value="all">All ${bank.themes.length} themes</option>${bank.themes.map(t=>`<option value="${esc(t.id)}" ${filter.theme===t.id?"selected":""}>${esc(t.name)}</option>`).join("")}</select></label><label>Learning item<select id="type"><option value="all">All types</option>${Object.entries(typeNames).map(([k,v])=>`<option value="${k}" ${filter.type===k?"selected":""}>${v}</option>`).join("")}</select></label></div><p id="result-count" class="results-note" role="status"></p><div id="word-results" class="word-grid"></div><div class="load-more"><button class="btn secondary" id="more">Show more words</button></div>`,focus);
    document.querySelector("#search").oninput = e => { filter.query=e.target.value;filter.limit=12;updateWords(); };
    document.querySelector("#theme").onchange = e => { filter.theme=e.target.value;filter.limit=12;updateWords(); };
    document.querySelector("#type").onchange = e => { filter.type=e.target.value;filter.limit=12;updateWords(); };
    document.querySelector("#more").onclick = () => {filter.limit+=12;updateWords();};
    updateWords();
  }
  function updateWords() {
    const q=normal(filter.query);
    const found=bank.entries.filter(e=>(filter.theme==="all"||e.theme_id===filter.theme)&&(filter.type==="all"||e.item_type===filter.type)&&normal(`${e.term} ${e.learner_meaning} ${e.example_sentence}`).includes(q));
    const shown=found.slice(0,filter.limit);
    document.querySelector("#result-count").textContent=`Showing ${shown.length} of ${found.length} learning records · ${bank.entries.length} in the full bank`;
    document.querySelector("#word-results").innerHTML=shown.length ? shown.map(e=>`<button class="word-card" data-word="${esc(e.id)}"><span class="word-type">${esc(typeNames[e.item_type]||e.item_type)} · ${esc(e.part_of_speech)}</span><strong>${esc(e.term)}</strong><p>${esc(e.learner_meaning)}</p><span class="small-number">${esc(e.theme)} <span aria-hidden="true">↗</span></span></button>`).join("") : '<p class="empty">No matching words yet. Try another word or choose all themes.</p>';
    document.querySelector("#more").hidden=shown.length>=found.length;
    document.querySelectorAll("[data-word]").forEach(b=>b.onclick=()=>openWord(b.dataset.word));
  }
  function openWord(wordId) {
    const e=bank.entries.find(x=>x.id===wordId);if(!e)return;
    const relations=(e.relations||[]).map(r=>`${String(r.type).replace(/_/g," ")}: ${r.term}`).join("; ");
    dialog.innerHTML=`<div class="dialog-top"><div><span class="eyebrow">${esc(e.theme)}</span><h2 id="dialog-title">${esc(e.term)}</h2></div><button class="close-dialog" aria-label="Close word details">×</button></div><p class="word-type">${esc(typeNames[e.item_type])} · ${esc(e.part_of_speech)}</p><p class="large-copy">${esc(e.learner_meaning)}</p><div class="study-card"><span class="eyebrow">IN A SENTENCE</span><p style="margin:0">${esc(e.example_sentence)}</p></div>${relations?`<p class="help" style="margin-top:20px">Word connections: ${esc(relations)}</p>`:""}<p class="source-note">Source page${e.source_printed_pages.length>1?"s":""}: ${esc(e.source_printed_pages.join(", "))}. Proposed teaching stage: ${esc(bank.stage_labels[e.proposed_stage])}. This is a teaching suggestion, rather than a CEFR rating. Teaching content: ${esc(e.teacher_review_status)}.</p>`;
    dialog.querySelector(".close-dialog").onclick=()=>dialog.close();
    dialog.showModal();
  }
  dialog.addEventListener("click",e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  function lessonFrame(content) {
    const a=state.active;
    return `<a class="back-link" href="#progress">Save my place &amp; see progress</a><div class="lesson-layout"><aside class="lesson-side"><span class="eyebrow">${a.kind==="review"?"RECALL REVIEW":"QUEST 01"}</span><h2>A greener school</h2>${a.kind==="review"?'<p class="help">Try remembering the five words before using a hint.</p>':`<ol class="lesson-steps" aria-label="Quest steps">${phases.map((p,i)=>`<li class="${i===a.step?"current":i<a.step?"done":""}" ${i===a.step?'aria-current="step"':""}><span class="step-number">${i<a.step?"✓":i+1}</span>${p}</li>`).join("")}</ol>`}<p class="help">Take your time. Hints are here to help you learn.</p></aside><section class="lesson-card">${content}</section></div>`;
  }
  function renderLesson(focus = true) {
    if(!state.active)return renderHome(focus);
    const a=state.active;
    if(a.step===0)renderDiscover(focus);
    else if(a.step===1)renderStudy(focus);
    else if(a.step===2||a.step===3)renderQuestion(focus);
    else renderUse(focus);
  }
  function renderDiscover(focus) {
    const a=state.active;
    setView(lessonFrame(`<span class="eyebrow">01 / DISCOVER</span><h1>One jar. A new purpose.</h1><p class="question-prompt">Our class has used paper and an empty jar. Can both be useful again in the same way?</p><div class="goal">I can explain five target words and use at least two in a helpful school message.</div><fieldset><legend>Make a prediction. You will check it as you learn.</legend>${[["same","They can be made useful in the same way."],["different","There may be different ways to use them again."],["unsure","I am not sure yet. I want to find out."]].map(([v,t])=>`<label class="choice-label"><input type="radio" name="prediction" value="${v}" ${a.prediction===v?"checked":""}>${t}</label>`).join("")}</fieldset><label>Where could you help reduce waste at school?<select id="place">${["Classroom","Canteen","School garden","School library"].map(p=>`<option ${a.place===p?"selected":""}>${p}</option>`).join("")}</select></label><div class="button-row"><button class="btn" id="discover-next">Explore my five words ${mark()}</button></div>`),focus);
    document.querySelectorAll('[name="prediction"]').forEach(el=>el.onchange=()=>{a.prediction=el.value;save();});
    document.querySelector("#place").onchange=e=>{a.place=e.target.value;save();};
    document.querySelector("#discover-next").onclick=()=>{a.step=1;a.index=0;save();renderLesson();};
  }
  function renderStudy(focus) {
    const a=state.active,e=targets[a.index];
    setView(lessonFrame(`<span class="eyebrow">02 / LEARN</span><h1>Meet your five words.</h1><p class="muted">Read the meaning and example. Think about your ${esc(a.place.toLowerCase())}.</p><div class="study-card"><p class="card-count">Word ${a.index+1} of ${targets.length} · ${esc(e.part_of_speech)}</p><strong class="term">${esc(e.term)}</strong><p style="margin-top:16px">${esc(e.learner_meaning)}</p><blockquote>${esc(e.example_sentence)}</blockquote></div>${e.term==="reuse"?'<p class="notice" style="margin-top:20px">An empty jar can become a pencil holder. That is reusing. Paper can be processed into new paper. That is recycling.</p>':""}<div class="button-row">${a.index?'<button class="btn secondary" id="study-back">Previous word</button>':""}<button class="btn" id="study-next">${a.index===4?"Try the meaning challenge":"Next word"} ${mark()}</button></div>`),focus);
    const back=document.querySelector("#study-back");if(back)back.onclick=()=>{a.index--;save();renderLesson();};
    document.querySelector("#study-next").onclick=()=>{if(a.index<4)a.index++;else{a.step=2;resetQuestion();}save();renderLesson();};
  }
  function resetQuestion() { Object.assign(state.active,{index:0,hint:false,questionAttempts:0,result:null,draft:""}); }
  function renderQuestion(focus) {
    const a=state.active,isRecall=a.step===3;
    const t=(isRecall?quest.recall_tasks:quest.recognition_tasks)[a.index];
    const pct=(a.index/5)*100;
    const result=a.result;
    const expected=isRecall?t.expected_target:t.correct_answer;
    setView(lessonFrame(`<span class="eyebrow">${a.kind==="review"?"REVIEW":isRecall?"04 / RECALL":"03 / PRACTISE"}</span><div class="card-count">Question ${a.index+1} of 5</div><div class="counter-bar" aria-hidden="true"><span style="width:${pct}%"></span></div><h1>${isRecall?"Can you remember it?":"Find the meaning."}</h1><p class="question-prompt">${esc(t.prompt)}${isRecall?".":""}</p>${isRecall?`<form id="recall-form"><label for="answer">Type the target word</label><input class="recall-input" id="answer" name="answer" value="${esc(a.draft||"")}" autocomplete="off" autocapitalize="none" spellcheck="false" required maxlength="80" ${result?'disabled':""}><div class="button-row">${!result?'<button class="btn" type="submit">Check word</button><button class="btn secondary" type="button" id="hint">First-letter hint</button>':""}</div></form>${a.hint?`<p class="hint">First letter: ${esc(expected[0])} · ${expected.length} letters</p>`:""}`:`<div class="options">${t.options.map((op,i)=>`<button class="option ${result?.answer===op?"selected":""}" data-answer="${esc(op)}" ${result?"disabled":""}><span class="option-mark">${String.fromCharCode(65+i)}</span>${esc(op)}</button>`).join("")}</div>`}${result?`<div class="feedback ${result.correct?"":"retry"}" role="status"><strong>${result.correct?"You found it.":"Keep building your word knowledge."}</strong>${isRecall?`The target word is <strong style="display:inline">${esc(expected)}</strong>. ${result.correct?"":"Read it once, then try remembering it again later."}`:esc(t.feedback)}${result.assisted?'<p class="help" style="margin:8px 0 0">This answer is recorded as supported practice.</p>':""}</div><div class="button-row">${!result.correct?'<button class="btn secondary" id="question-retry">Try this question again</button>':""}<button class="btn" id="question-next">${a.index===4?(a.kind==="review"?"Finish review":isRecall?"Use my words":"Try recalling the words"):"Next question"} ${mark()}</button></div>`:""}`),focus);
    if(!result&&isRecall){
      document.querySelector("#answer").oninput=e=>{a.draft=e.target.value;save();};
      document.querySelector("#recall-form").onsubmit=e=>{e.preventDefault();const v=document.querySelector("#answer").value;if(v.trim())submitAnswer(v,expected,isRecall);};
      document.querySelector("#hint").onclick=()=>{a.hint=true;save();renderLesson(false);document.querySelector("#answer").focus();};
    }
    if(!result&&!isRecall)document.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>submitAnswer(b.dataset.answer,expected,false));
    const retry=document.querySelector("#question-retry");if(retry)retry.onclick=()=>{a.result=null;a.draft="";save();renderLesson();};
    const next=document.querySelector("#question-next");if(next)next.onclick=()=>{
      if(a.index<4){a.index++;a.result=null;a.hint=false;a.questionAttempts=0;a.draft="";}
      else if(a.kind==="review")return finishReview();
      else{a.step++;resetQuestion();}
      save();renderLesson();
    };
  }
  function submitAnswer(answer,expected,isRecall) {
    const a=state.active;if(a.result)return;
    const record={sessionId:a.id,kind:a.kind,phase:isRecall?"recall":"recognition",questionIndex:a.index,entryId:isRecall?quest.recall_tasks[a.index].entry_id:targets.find(e=>e.term===expected)?.id,prompt:(isRecall?quest.recall_tasks:quest.recognition_tasks)[a.index].prompt,answer,expected,correct:normal(answer)===normal(expected),assisted:!!a.hint||a.questionAttempts>0,firstAttempt:a.questionAttempts===0,timestamp:new Date().toISOString()};
    a.questionAttempts++;a.result=record;state.attempts.push(record);save();renderLesson(false);
    document.querySelector("#question-next").focus();
  }
  function renderUse(focus) {
    const a=state.active;
    setView(lessonFrame(`<span class="eyebrow">05 / USE</span><h1>Your words can help.</h1><p class="question-prompt">Write two sentences explaining how pupils can reduce waste in the ${esc(a.place.toLowerCase())}. Use at least two target words.</p><div class="word-pills">${targets.map(e=>`<span>${esc(e.term)}</span>`).join("")}</div><details><summary>Show an example to help me begin</summary><p>${esc(quest.production_task.example_response)}</p></details><form id="use-form"><label for="message">My helpful school message</label><textarea id="message" name="message" placeholder="We can…" required minlength="10" maxlength="2000">${esc(a.response)}</textarea><fieldset><legend>Which target words did you use? Select at least two.</legend><div class="checks">${targets.map(e=>`<label><input type="checkbox" name="used" value="${esc(e.term)}" ${a.usedWords.includes(e.term)?"checked":""}>${esc(e.term)}</label>`).join("")}</div></fieldset><p class="help">Read your message aloud. Did you write two sentences? Ask your teacher to check meaning and form. The app records your writing; it does not grade it.</p><details><summary>Optional: how did the quest feel?</summary><p class="help">Choose 1 (strongly disagree) to 5 (strongly agree), or leave blank.</p><div class="reflection-grid">${Object.entries(quest.arcs_pulse.items).map(([key,label])=>`<label>${esc(label)}<select data-pulse="${key}"><option value="">Leave blank</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${Number(a.reflection[key])===n?"selected":""}>${n}</option>`).join("")}</select></label>`).join("")}</div></details><p id="use-error" class="help" role="status"></p><div class="button-row"><button class="btn" type="submit">Save my message &amp; finish ${mark()}</button></div></form>`),focus);
    document.querySelector("#message").oninput=e=>{a.response=e.target.value;save();};
    document.querySelectorAll('[name="used"]').forEach(c=>c.onchange=()=>{a.usedWords=[...document.querySelectorAll('[name="used"]:checked')].map(x=>x.value);save();});
    document.querySelectorAll("[data-pulse]").forEach(el=>el.onchange=()=>{a.reflection[el.dataset.pulse]=el.value?Number(el.value):null;save();});
    document.querySelector("#use-form").onsubmit=e=>{e.preventDefault();if(a.usedWords.length<2){document.querySelector("#use-error").textContent="Select at least two target words you used, then check that they appear in your message.";return;}finishQuest();};
  }
  function finishQuest() {
    const a=state.active;
    const completedAt=new Date().toISOString();
    state.completed={...a,completedAt,writingAssessment:"Not assessed; teacher review required",firstCompletedAt:state.completed?.firstCompletedAt||state.completed?.completedAt||completedAt};
    // A repeated quest updates the saved message; the original review cycle and attempt logs remain.
    state.active=null;save();location.hash="progress";
  }
  function finishReview() {
    const a=state.active;state.reviews.push({sessionId:a.id,startedAt:a.startedAt,completedAt:new Date().toISOString(),reviewDay:a.reviewDay});state.active=null;save();location.hash="progress";
  }
  function scores(sessionId) {
    const attempts=state.attempts.filter(a=>a.sessionId===sessionId);
    return {recognition:attempts.filter(a=>a.phase==="recognition"&&a.firstAttempt&&a.correct).length,recall:attempts.filter(a=>a.phase==="recall"&&a.firstAttempt&&a.correct&&!a.assisted).length,hints:new Set(attempts.filter(a=>a.phase==="recall"&&a.assisted).map(a=>a.questionIndex)).size};
  }
  function renderProgress(focus = true) {
    const c=state.completed,a=state.active,due=dueReview();
    const s=c?scores(c.id):null;
    const latestReview=state.reviews.at(-1),rs=latestReview?scores(latestReview.sessionId):null;
    setView(`<header class="page-head"><span class="eyebrow">YOUR LEARNING RECORD</span><h1>Every word is a step.</h1><p class="large-copy muted">See what you have practised and what to try next.</p></header>${a?`<div class="notice">Your ${a.kind==="review"?"review":"quest"} is saved at ${a.kind==="review"?`question ${a.index+1} of 5`:phases[a.step]}. <a href="#quest">Continue learning</a></div>`:""}${c?`<section class="summary-banner" style="margin-top:20px"><span class="eyebrow">QUEST COMPLETED</span><h2>A greener school</h2><p style="margin:0">You studied five words, tried recall and created a school message. Your writing is ready to share for teacher feedback.</p></section><div class="stats-grid"><div class="stat"><strong>${s.recognition}/5</strong><span>Meaning: first answers correct</span></div><div class="stat"><strong>${s.recall}/5</strong><span>Recall answers without hints</span></div><div class="stat"><strong>${s.hints}</strong><span>Recall questions with support</span></div></div><div class="progress-grid"><section class="panel"><span class="tag">Your words in action</span><h2>My school message</h2><p class="help">${esc(c.place)} · ${date(c.completedAt)}</p><p class="saved-message">${esc(c.response)}</p><p class="help">Writing: not assessed. A teacher needs to check meaning and form.</p><button class="btn secondary small" id="export">Download my learning record</button></section><section class="panel tint"><span class="eyebrow">KEEP THE WORDS WITH YOU</span><h2>Remember. Then review.</h2><p class="help">Try the words again after a delay. Hints remain available.</p><ol class="schedule">${schedule().map(r=>`<li><span>Day ${r.day}</span><span>${r.done?`Reviewed ${date(r.done.completedAt)}`:`${dateTime(r.at)}${r.at.getTime()<=Date.now()?" · ready":""}`}</span></li>`).join("")}</ol><button class="btn" id="review" ${a?"disabled":""}>${due?`Start day ${due.day} review`:"Try an extra recall practice"} ${mark()}</button>${latestReview?`<p class="help" style="margin-top:16px">Latest recall review: ${rs.recall}/5 without hints, ${date(latestReview.completedAt)}.</p>`:""}<p class="help" style="margin-top:16px">Early extra practice is saved separately from the scheduled reviews.</p></section></div>`:`<section class="panel" style="margin-top:24px"><span class="tag">A fresh start</span><h2>Your first quest is waiting.</h2><p>Meet five words, practise their meanings and write a message that could help your school.</p><a href="#quest" class="btn">${a?"Continue my quest":"Explore my first quest"} ${mark()}</a></section>`}<details><summary>About saving and sharing</summary><p>Progress and writing are saved only in this browser on this device. There is no pupil account or teacher dashboard. On a shared device, the next person may see this record. Download it before clearing browser data. Offline use works after this website has been opened online and shows “Ready offline”.</p><p>This pilot records practice, rather than certifying mastery. The proposed review dates and optional reflection questions are for piloting; the reflection questions are not a validated ARCS questionnaire.</p><div class="button-row">${!c?'<button class="btn secondary small" id="export">Download my learning record</button>':""}<button class="text-btn" id="reset">Clear progress on this device</button></div></details>`,focus);
    const exp=document.querySelector("#export");if(exp)exp.onclick=exportRecord;
    const review=document.querySelector("#review");if(review)review.onclick=()=>start("review");
    document.querySelector("#reset").onclick=()=>{if(!window.confirm("Clear the saved quest, writing and practice results on this browser? Download your learning record first if you want to keep it."))return;state=blankState();save();route();};
  }
  function exportRecord() {
    const payload={application:"LexiTrek",applicationVersion:VERSION,reservoirVersion:bank.reservoir_version,questId:quest.id,exportedAt:new Date().toISOString(),recordScope:"This browser and device only",assessmentNote:"Practice results; writing is unassessed and requires teacher review. Reflection prompts are newly authored pilot prompts, not a validated ARCS questionnaire.",...state};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const link=document.createElement("a");link.href=url;link.download=`LexiTrek-learning-record-${new Date().toISOString().slice(0,10)}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function connectionStatus() {
    const el=document.querySelector("#connection");
    el.classList.toggle("offline",!navigator.onLine);
    el.textContent=!navigator.onLine?(readyOffline?"Offline · ready to learn":"Offline"):readyOffline?"Ready offline":"Online";
  }
  async function prepareOffline() {
    connectionStatus();
    if(!("serviceWorker" in navigator)||!window.isSecureContext)return;
    try {
      await navigator.serviceWorker.register("./service-worker.js",{scope:"./"});
      await navigator.serviceWorker.ready;
      const cacheNames=await caches.keys();
      readyOffline=cacheNames.some(n=>n.startsWith(`lexitrek-pilot:${new URL("./",location.href).href}:`));
      connectionStatus();
    } catch { /* Online learning remains available if browser policy blocks caching. */ }
  }
  async function load() {
    try {
      if(location.protocol==="file:")throw Error("local-file");
      const responses=await Promise.all([fetch("./data/lexitrek-vocabulary.json"),fetch("./data/example-quest.json")]);
      if(responses.some(r=>!r.ok))throw Error("missing-data");
      [bank,quest]=await Promise.all(responses.map(r=>r.json()));
      if(!Array.isArray(bank.entries)||bank.entries.length!==bank.counts.total_records||!Array.isArray(quest.recognition_tasks)||quest.recognition_tasks.length!==5||quest.recall_tasks.length!==5)throw Error("invalid-data");
      targets=quest.target_entry_ids.map(id=>bank.entries.find(e=>e.id===id));
      if(targets.length!==5||targets.some(e=>!e))throw Error("missing-words");
      route(false);prepareOffline();
    } catch {
      bank=null;
      setView(`<div class="loading"><span class="eyebrow">LET’S GET THE WORDS READY</span><h1>The word bank could not open.</h1><p>Check your connection and try again. The published website needs <code>data/lexitrek-vocabulary.json</code> and <code>data/example-quest.json</code> in the same repository.</p><p class="help">Open the GitHub Pages website address. Double-clicking the HTML file on your computer will not load the bank.</p><button class="btn" id="reload">Try again</button></div>`,false);
      document.querySelector("#reload").onclick=()=>location.reload();
    }
  }
  window.addEventListener("hashchange",()=>route());
  window.addEventListener("online",connectionStatus);window.addEventListener("offline",connectionStatus);
  load();
})();
