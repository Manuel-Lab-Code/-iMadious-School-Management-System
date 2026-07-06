/* ═══════════════════════════════════════════════════════════
   EduPortal — exam-creator.js  (v2 — conflict-free)
   Auto-saving exam builder: Objective + Theory sections.
   All state is namespaced under EC{} to avoid clashing
   with anything in script.js.
   ═══════════════════════════════════════════════════════════ */

/* ── NAMESPACE ───────────────────────────────────────────── */
var EC = {
  DRAFT_KEY      : 'edu_exam_draft',
  AUTOSAVE_DELAY : 800,
  objQuestions   : [],
  theoryQuestions: [],
  autosaveTimer  : null,
  activeTab      : 'objective'
};

/* ══════════════════════════════════════════════════════════
   QUESTION FACTORIES
   ══════════════════════════════════════════════════════════ */
function ecNewObj() {
  return {
    id      : 'obj_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    text    : '',
    options : ['','','',''],
    answer  : -1,
    marks   : 1,
    collapsed: false
  };
}
function ecNewTheory() {
  return {
    id       : 'thy_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    text     : '',
    guide    : '',
    marks    : 5,
    collapsed: false
  };
}

/* ══════════════════════════════════════════════════════════
   INIT  —  called by renderSectionContent in script.js
   ══════════════════════════════════════════════════════════ */
function initCreateExam() {
  ecLoadDraft();
  if (EC.objQuestions.length === 0)    EC.objQuestions.push(ecNewObj());
  if (EC.theoryQuestions.length === 0) EC.theoryQuestions.push(ecNewTheory());
  ecRenderAll();
  ecShowPanel(EC.activeTab);
  ecUpdateSummary();
  ecUpdateCounts();
  ecSetStatus('saved');
}

/* ══════════════════════════════════════════════════════════
   AUTOSAVE
   ══════════════════════════════════════════════════════════ */
function scheduleAutosave() {
  ecSetStatus('saving');
  clearTimeout(EC.autosaveTimer);
  EC.autosaveTimer = setTimeout(ecSaveDraft, EC.AUTOSAVE_DELAY);
}

function ecSaveDraft() {
  ecCollectDOM();
  var draft = {
    title   : ecGetVal('examTitle'),
    subject : ecGetVal('examSubject'),
    cls     : ecGetVal('examClass'),
    duration: ecGetVal('examDuration'),
    session : ecGetVal('examSession'),
    term    : ecGetVal('examTerm'),
    expiry  : ecGetVal('examExpiry'),
    objQuestions   : EC.objQuestions,
    theoryQuestions: EC.theoryQuestions,
    savedAt : new Date().toISOString()
  };
  try {
    localStorage.setItem(EC.DRAFT_KEY, JSON.stringify(draft));
    ecSetStatus('saved', draft.savedAt);
  } catch(e) { ecSetStatus('error'); }
  ecUpdateSummary();
  ecUpdateCounts();
}

function ecLoadDraft() {
  try {
    var raw = localStorage.getItem(EC.DRAFT_KEY);
    if (!raw) return;
    var d = JSON.parse(raw);
    ecSetVal('examTitle',    d.title    || '');
    ecSetVal('examSubject',  d.subject  || '');
    ecSetVal('examClass',    d.cls      || '');
    ecSetVal('examDuration', d.duration || '');
    ecSetVal('examSession',  d.session  || '');
    ecSetVal('examTerm',     d.term     || '');
    ecSetVal('examExpiry',   d.expiry   || '');
    EC.objQuestions    = (d.objQuestions    || []).map(function(q){ return Object.assign(ecNewObj(),    q); });
    EC.theoryQuestions = (d.theoryQuestions || []).map(function(q){ return Object.assign(ecNewTheory(), q); });
    if (d.savedAt) ecSetStatus('saved', d.savedAt);
  } catch(e) { console.warn('Draft restore failed', e); }
}

function ecCollectDOM() {
  EC.objQuestions.forEach(function(q) {
    var t = document.getElementById('qt_' + q.id); if (t) q.text = t.value;
    var m = document.getElementById('qm_' + q.id); if (m) q.marks = parseFloat(m.value)||0;
    for (var oi = 0; oi < 4; oi++) {
      var o = document.getElementById('qo_' + q.id + '_' + oi); if (o) q.options[oi] = o.value;
    }
  });
  EC.theoryQuestions.forEach(function(q) {
    var t = document.getElementById('qt_' + q.id); if (t) q.text  = t.value;
    var g = document.getElementById('qg_' + q.id); if (g) q.guide = g.value;
    var m = document.getElementById('qm_' + q.id); if (m) q.marks = parseFloat(m.value)||0;
  });
}

/* ══════════════════════════════════════════════════════════
   CLEAR DRAFT
   ══════════════════════════════════════════════════════════ */
function clearExamForm() {
  ecConfirm('Clear Draft', 'This will erase your current draft and all questions. Are you sure?', function() {
    localStorage.removeItem(EC.DRAFT_KEY);
    EC.objQuestions    = [ecNewObj()];
    EC.theoryQuestions = [ecNewTheory()];
    ['examTitle','examSubject','examClass','examDuration','examSession','examTerm'].forEach(function(id){ ecSetVal(id,''); });
    ecRenderAll(); ecUpdateSummary(); ecUpdateCounts(); ecSetStatus('saved');
    ecToast('Draft cleared.', 'info');
  });
}

/* ══════════════════════════════════════════════════════════
   TAB SWITCHING
   ══════════════════════════════════════════════════════════ */
function switchExamTab(tab, btn) {
  EC.activeTab = tab;
  document.querySelectorAll('.ce-tab').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  ecShowPanel(tab);
}
function ecShowPanel(tab) {
  var obj    = document.getElementById('panel-objective');
  var theory = document.getElementById('panel-theory');
  if (!obj || !theory) return;
  if (tab === 'objective') { obj.classList.remove('hidden'); theory.classList.add('hidden'); }
  else                     { obj.classList.add('hidden');    theory.classList.remove('hidden'); }
}

/* ══════════════════════════════════════════════════════════
   ADD QUESTIONS
   ══════════════════════════════════════════════════════════ */
function addObjectiveQuestion() {
  ecCollectDOM();
  var q = ecNewObj();
  EC.objQuestions.push(q);
  ecRenderAllObj();
  ecUpdateSummary(); ecUpdateCounts(); scheduleAutosave();
  setTimeout(function(){ var el=document.getElementById('qblock_'+q.id); if(el) el.scrollIntoView({behavior:'smooth',block:'nearest'}); },60);
}

/* ══════════════════════════════════════════════════════════
   PASTE & PARSE OBJECTIVE QUESTIONS
   Expects blocks like:
     1. Question text?
     A. Option one
     B. Option two
     C. Option three
     D. Option four
     Answer: B
   Tolerant of "1)", "Q1.", lowercase letters, "A)", "Ans:",
   "Correct Answer:", and a numeric answer (e.g. "Answer: 2").
   ══════════════════════════════════════════════════════════ */
function ecToggleObjPaste() {
  var box = document.getElementById('objPasteBox');
  if (box) box.classList.toggle('hidden');
}

function ecParsePastedObjective() {
  var area = document.getElementById('objPasteArea');
  var raw = area ? area.value : '';
  if (!raw || !raw.trim()) { ecToast('Paste some questions first.', 'error'); return; }

  var qStart = /^\s*(?:Q(?:uestion)?\s*)?\d+[\.\)]\s*/i;
  var optLine = /^\s*\(?([A-Da-d])\)?[\.\):]\s*(.+)$/;
  var ansLine = /^\s*(?:correct\s*)?ans(?:wer)?\s*[:\-]?\s*\(?([A-Da-d0-9])\)?/i;
  var letterIndex = { A:0, B:1, C:2, D:3 };

  var lines = raw.replace(/\r\n/g, '\n').split('\n');
  var blocks = [], current = [];
  lines.forEach(function (line) {
    if (qStart.test(line) && current.length) { blocks.push(current); current = [line]; }
    else { current.push(line); }
  });
  if (current.length) blocks.push(current);

  // Drop blocks that are entirely blank lines (e.g. leading whitespace
  // before the first question) — these aren't real failed questions.
  blocks = blocks.filter(function (blockLines) {
    return blockLines.some(function (l) { return l.trim() !== ''; });
  });

  var parsed = [], failed = 0;
  blocks.forEach(function (blockLines) {
    var text = '', options = [], answerIdx = -1;
    blockLines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      var ansMatch = trimmed.match(ansLine);
      if (ansMatch) {
        var val = ansMatch[1].toUpperCase();
        answerIdx = letterIndex.hasOwnProperty(val) ? letterIndex[val] : (parseInt(val, 10) - 1);
        return;
      }
      var optMatch = trimmed.match(optLine);
      if (optMatch) { options.push(optMatch[2].trim()); return; }
      text += (text ? ' ' : '') + trimmed.replace(qStart, '');
    });

    if (!text || options.length < 2 || answerIdx < 0 || answerIdx > options.length - 1) {
      failed++; return;
    }
    while (options.length < 4) options.push('');
    options = options.slice(0, 4);

    var q = ecNewObj();
    q.text = text; q.options = options; q.answer = answerIdx;
    parsed.push(q);
  });

  if (parsed.length === 0) {
    ecToast('Could not parse any questions — check the format shown above and try again.', 'error');
    return;
  }

  ecCollectDOM();
  EC.objQuestions = EC.objQuestions.filter(function (q) {
    return q.text.trim() !== '' || q.options.some(function (o) { return o.trim() !== ''; });
  });
  EC.objQuestions = EC.objQuestions.concat(parsed);

  ecRenderAllObj();
  ecUpdateSummary(); ecUpdateCounts(); scheduleAutosave();
  area.value = '';
  ecToggleObjPaste();

  var msg = 'Added ' + parsed.length + ' question(s) from paste.';
  if (failed) msg += ' ' + failed + ' block(s) couldn\'t be parsed — check formatting and add those manually.';
  ecToast(msg, failed ? 'info' : 'success');
}

/* ══════════════════════════════════════════════════════════
   RENDER OBJECTIVE
   ══════════════════════════════════════════════════════════ */
function ecRenderAllObj() {
  var c = document.getElementById('objectiveList');
  if (!c) return;
  c.innerHTML = '';
  EC.objQuestions.forEach(function(q,i){ ecBuildObjBlock(q,i,c); });
  ecToggleEmpty('obj');
}

function ecBuildObjBlock(q, idx, container) {
  var letters  = ['A','B','C','D'];
  var shortTxt = q.text ? q.text.substring(0,60)+(q.text.length>60?'…':'') : 'Expand to edit question';
  var optsHtml = '';
  for (var oi=0; oi<4; oi++) {
    var isC = (q.answer === oi);
    optsHtml +=
      '<div class="option-row '+(isC?'is-correct':'')+'" id="optrow_'+q.id+'_'+oi+'">'+
        '<div class="option-letter">'+letters[oi]+'</div>'+
        '<input type="text" id="qo_'+q.id+'_'+oi+'" value="'+ecEsc(q.options[oi])+'" placeholder="Option '+letters[oi]+'" oninput="ecOptInput(\''+q.id+'\','+oi+',this)"/>'+
        '<input type="radio" class="option-correct-radio" name="correct_'+q.id+'" id="radio_'+q.id+'_'+oi+'" value="'+oi+'"'+(isC?' checked':'')+' onchange="ecSetCorrect(\''+q.id+'\','+oi+')"/>'+
        '<label class="option-correct-label" for="radio_'+q.id+'_'+oi+'">✓ Correct</label>'+
        '<span class="correct-indicator">✓ Correct Answer</span>'+
      '</div>';
  }
  var div = document.createElement('div');
  div.className='qblock'; div.id='qblock_'+q.id;
  div.innerHTML=
    '<div class="qblock-head" onclick="ecToggleBlock(\''+q.id+'\')">'+
      '<div class="qblock-num">'+(idx+1)+'</div>'+
      '<div class="qblock-title" id="qtitle_'+q.id+'">'+ecEsc(shortTxt)+'</div>'+
      '<span class="qblock-marks-badge" id="qbadge_'+q.id+'">'+q.marks+' mark'+(q.marks!==1?'s':'')+'</span>'+
      '<div class="qblock-actions" onclick="event.stopPropagation()">'+
        '<button class="btn-secondary btn-sm" onclick="ecMoveQ(\'obj\',\''+q.id+'\',-1)">↑</button>'+
        '<button class="btn-secondary btn-sm" onclick="ecMoveQ(\'obj\',\''+q.id+'\',1)">↓</button>'+
        '<button class="btn-danger btn-sm"    onclick="ecDeleteQ(\'obj\',\''+q.id+'\')">🗑</button>'+
        '<button class="qblock-toggle '+(q.collapsed?'collapsed':'')+'" id="qtoggle_'+q.id+'" onclick="ecToggleBlock(\''+q.id+'\')">▾</button>'+
      '</div>'+
    '</div>'+
    '<div class="qblock-body '+(q.collapsed?'collapsed':'')+'" id="qbody_'+q.id+'">'+
      '<div><label class="theory-guide-label">Question Text <span class="req">*</span></label>'+
        '<textarea class="q-text-area" id="qt_'+q.id+'" placeholder="Type your question here…" oninput="ecQTextInput(\'obj\',\''+q.id+'\',this)">'+ecEsc(q.text)+'</textarea></div>'+
      '<div class="marks-row"><label>Marks for this question:</label>'+
        '<input type="number" class="marks-input" id="qm_'+q.id+'" value="'+q.marks+'" min="0.5" max="100" step="0.5" oninput="ecMarksInput(\'obj\',\''+q.id+'\',this)"/>'+
        '<span class="marks-note">Each correct answer earns this many marks</span></div>'+
      '<div><div class="theory-guide-label">Answer Options <span class="req">*</span>'+
        '<span style="font-weight:400;color:var(--text-3)"> — tick radio to mark correct answer</span></div>'+
        '<div class="options-grid" id="opts_'+q.id+'">'+optsHtml+'</div></div>'+
    '</div>';
  container.appendChild(div);
}

/* ══════════════════════════════════════════════════════════
   RENDER THEORY
   ══════════════════════════════════════════════════════════ */
function ecRenderAllTheory() {
  var c = document.getElementById('theoryList');
  if (!c) return;
  c.innerHTML = '';
  EC.theoryQuestions.forEach(function(q,i){ ecBuildTheoryBlock(q,i,c); });
  ecToggleEmpty('theory');
}

function ecBuildTheoryBlock(q, idx, container) {
  var shortTxt = q.text ? q.text.substring(0,60)+(q.text.length>60?'…':'') : 'Expand to edit question';
  var div = document.createElement('div');
  div.className='qblock'; div.id='qblock_'+q.id;
  div.innerHTML=
    '<div class="qblock-head" onclick="ecToggleBlock(\''+q.id+'\')">'+
      '<div class="qblock-num">'+(idx+1)+'</div>'+
      '<div class="qblock-title" id="qtitle_'+q.id+'">'+ecEsc(shortTxt)+'</div>'+
      '<span class="qblock-marks-badge" id="qbadge_'+q.id+'">'+q.marks+' mark'+(q.marks!==1?'s':'')+'</span>'+
      '<div class="qblock-actions" onclick="event.stopPropagation()">'+
        '<button class="btn-secondary btn-sm" onclick="ecMoveQ(\'theory\',\''+q.id+'\',-1)">↑</button>'+
        '<button class="btn-secondary btn-sm" onclick="ecMoveQ(\'theory\',\''+q.id+'\',1)">↓</button>'+
        '<button class="btn-danger btn-sm"    onclick="ecDeleteQ(\'theory\',\''+q.id+'\')">🗑</button>'+
        '<button class="qblock-toggle '+(q.collapsed?'collapsed':'')+'" id="qtoggle_'+q.id+'" onclick="ecToggleBlock(\''+q.id+'\')">▾</button>'+
      '</div>'+
    '</div>'+
    '<div class="qblock-body '+(q.collapsed?'collapsed':'')+'" id="qbody_'+q.id+'">'+
      '<div><label class="theory-guide-label">Question Text <span class="req">*</span></label>'+
        '<textarea class="q-text-area" id="qt_'+q.id+'" placeholder="Type your theory / essay question here…" oninput="ecQTextInput(\'theory\',\''+q.id+'\',this)">'+ecEsc(q.text)+'</textarea></div>'+
      '<div class="marks-row"><label>Marks allocated:</label>'+
        '<input type="number" class="marks-input" id="qm_'+q.id+'" value="'+q.marks+'" min="1" max="200" step="1" oninput="ecMarksInput(\'theory\',\''+q.id+'\',this)"/>'+
        '<span class="marks-note">Total marks a student can earn for this answer</span></div>'+
      '<div><div class="theory-guide-label">Marking Guide / Model Answer '+
        '<span style="font-weight:400;color:var(--text-3)">(optional — students will NOT see this)</span></div>'+
        '<div class="theory-guide-note">List key points or expected answer to help with marking.</div>'+
        '<textarea class="q-text-area" id="qg_'+q.id+'" placeholder="e.g. Expected points: (1) … (2) … (3) …" style="min-height:80px" oninput="ecGuideInput(\''+q.id+'\',this)">'+ecEsc(q.guide)+'</textarea></div>'+
    '</div>';
  container.appendChild(div);
}

/* ══════════════════════════════════════════════════════════
   EVENT HANDLERS
   ══════════════════════════════════════════════════════════ */
function ecQTextInput(type,id,el){
  var q=ecFindQ(type,id);
  if(q){ q.text=el.value; var t=document.getElementById('qtitle_'+id); if(t) t.textContent=q.text.substring(0,60)+(q.text.length>60?'…':'')||'Expand to edit question'; }
  scheduleAutosave();
}
function ecOptInput(qId,oi,el){ var q=ecFindQ('obj',qId); if(q) q.options[oi]=el.value; scheduleAutosave(); }
function ecSetCorrect(qId,oi){
  var q=ecFindQ('obj',qId); if(!q) return; q.answer=oi;
  for(var i=0;i<4;i++){ var r=document.getElementById('optrow_'+qId+'_'+i); if(r) r.classList.toggle('is-correct',i===oi); }
  scheduleAutosave();
}
function ecMarksInput(type,id,el){
  var q=ecFindQ(type,id);
  if(q){ q.marks=parseFloat(el.value)||0; var b=document.getElementById('qbadge_'+id); if(b) b.textContent=q.marks+' mark'+(q.marks!==1?'s':''); }
  ecUpdateSummary(); scheduleAutosave();
}
function ecGuideInput(qId,el){ var q=ecFindQ('theory',qId); if(q) q.guide=el.value; scheduleAutosave(); }

/* ══════════════════════════════════════════════════════════
   BLOCK CONTROLS
   ══════════════════════════════════════════════════════════ */
function ecToggleBlock(id){
  var body=document.getElementById('qbody_'+id);
  var tog =document.getElementById('qtoggle_'+id);
  if(!body) return;
  var c=body.classList.toggle('collapsed');
  if(tog) tog.classList.toggle('collapsed',c);
  var q=ecFindQ('obj',id)||ecFindQ('theory',id); if(q) q.collapsed=c;
}
function ecMoveQ(type,id,dir){
  ecCollectDOM();
  var arr=(type==='obj')?EC.objQuestions:EC.theoryQuestions;
  var idx=arr.findIndex(function(q){return q.id===id;}); if(idx<0) return;
  var ni=idx+dir; if(ni<0||ni>=arr.length) return;
  var tmp=arr[idx]; arr[idx]=arr[ni]; arr[ni]=tmp;
  if(type==='obj') ecRenderAllObj(); else ecRenderAllTheory();
  scheduleAutosave();
}
function ecDeleteQ(type,id){
  ecConfirm('Delete Question','Remove this question from the exam?',function(){
    if(type==='obj'){ EC.objQuestions=EC.objQuestions.filter(function(q){return q.id!==id;}); ecRenderAllObj(); }
    else { EC.theoryQuestions=EC.theoryQuestions.filter(function(q){return q.id!==id;}); ecRenderAllTheory(); }
    ecUpdateSummary(); ecUpdateCounts(); scheduleAutosave(); ecToast('Question removed.','info');
  });
}

/* ══════════════════════════════════════════════════════════
   RENDER ALL + EMPTY STATES
   ══════════════════════════════════════════════════════════ */
function ecRenderAll(){ ecRenderAllObj(); ecRenderAllTheory(); }
function ecToggleEmpty(type){
  if(type==='obj'){    var e=document.getElementById('objEmpty');    if(e) e.classList.toggle('hidden',EC.objQuestions.length>0); }
  else {               var e2=document.getElementById('theoryEmpty'); if(e2) e2.classList.toggle('hidden',EC.theoryQuestions.length>0); }
}

/* ══════════════════════════════════════════════════════════
   SCORE SUMMARY + TAB COUNTS
   ══════════════════════════════════════════════════════════ */
function ecUpdateSummary(){
  var oT=EC.objQuestions.reduce(function(s,q){return s+(parseFloat(q.marks)||0);},0);
  var tT=EC.theoryQuestions.reduce(function(s,q){return s+(parseFloat(q.marks)||0);},0);
  var fmt=function(v){return Number.isInteger(v)?v:v.toFixed(1);};
  var ot=document.getElementById('objTotal');    if(ot) ot.textContent=fmt(oT)+' marks';
  var tt=document.getElementById('theoryTotal'); if(tt) tt.textContent=fmt(tT)+' marks';
  var gt=document.getElementById('grandTotal');  if(gt) gt.textContent=fmt(oT+tT)+' marks';
}
function ecUpdateCounts(){
  var oc=document.getElementById('objCount');    if(oc) oc.textContent=EC.objQuestions.length+' Q'+(EC.objQuestions.length!==1?'s':'');
  var tc=document.getElementById('theoryCount'); if(tc) tc.textContent=EC.theoryQuestions.length+' Q'+(EC.theoryQuestions.length!==1?'s':'');
}

/* ══════════════════════════════════════════════════════════
   AUTOSAVE STATUS DOT
   ══════════════════════════════════════════════════════════ */
function ecSetStatus(state,isoDate){
  var dot=document.getElementById('autosaveDot');
  var txt=document.getElementById('autosaveText');
  var lst=document.getElementById('lastSavedTime');
  if(!dot||!txt) return;
  if(state==='saving'){ dot.className='autosave-dot saving'; txt.textContent='Saving…'; }
  else if(state==='saved'){ dot.className='autosave-dot'; txt.textContent='All changes saved'; if(lst&&isoDate) lst.textContent=new Date(isoDate).toLocaleTimeString(); }
  else { dot.className='autosave-dot error'; txt.textContent='Save failed'; }
}

/* ══════════════════════════════════════════════════════════
   PREVIEW
   ══════════════════════════════════════════════════════════ */
function previewExamDraft(){
  ecCollectDOM();
  var oT=EC.objQuestions.reduce(function(s,q){return s+(parseFloat(q.marks)||0);},0);
  var tT=EC.theoryQuestions.reduce(function(s,q){return s+(parseFloat(q.marks)||0);},0);
  var mi=function(l,v){return '<div class="preview-meta-item"><label>'+l+'</label><span>'+ecEsc(String(v))+'</span></div>';};
  var html=
    '<div class="preview-exam-meta">'+
      mi('Title',    ecGetVal('examTitle')||'—')+mi('Subject', ecGetVal('examSubject')||'—')+
      mi('Class',    ecGetVal('examClass') ||'—')+mi('Duration',ecGetVal('examDuration')+' mins')+
      mi('Session',  ecGetVal('examSession')||'—')+mi('Term',  ecGetVal('examTerm')||'—')+
      mi('Obj Total',oT+' marks')+mi('Theory Total',tT+' marks')+mi('Grand Total',(oT+tT)+' marks')+
    '</div>';
  var L=['A','B','C','D'];
  if(EC.objQuestions.length>0){
    html+='<div class="preview-section-title">SECTION A — OBJECTIVE ('+oT+' marks)</div>';
    EC.objQuestions.forEach(function(q,i){
      html+='<div class="preview-q-block"><div class="preview-q-meta"><span class="preview-q-num">Q'+(i+1)+'</span><span class="preview-marks-tag">'+q.marks+' mark'+(q.marks!==1?'s':'')+'</span></div>'+
        '<div class="preview-q-text">'+(ecEsc(q.text)||'<em style="color:var(--text-3)">No text</em>')+'</div>';
      q.options.forEach(function(o,oi){
        html+='<div class="preview-opt-row '+(oi===q.answer?'correct-opt':'')+'"><span>'+L[oi]+'.</span><span>'+(ecEsc(o)||'<em style="color:var(--text-3)">Empty</em>')+(oi===q.answer?' &nbsp;✓':'')+'</span></div>';
      });
      html+='</div>';
    });
  }
  if(EC.theoryQuestions.length>0){
    html+='<div class="preview-section-title">SECTION B — THEORY ('+tT+' marks)</div>';
    EC.theoryQuestions.forEach(function(q,i){
      html+='<div class="preview-q-block"><div class="preview-q-meta"><span class="preview-q-num">Q'+(i+1)+'</span><span class="preview-marks-tag">'+q.marks+' mark'+(q.marks!==1?'s':'')+'</span></div>'+
        '<div class="preview-q-text">'+(ecEsc(q.text)||'<em style="color:var(--text-3)">No text</em>')+'</div>'+
        (q.guide?'<div class="preview-theory-guide">📋 <strong>Marking Guide:</strong> '+ecEsc(q.guide)+'</div>':'')+
      '</div>';
    });
  }
  var cont=document.getElementById('draftPreviewContent'); if(cont) cont.innerHTML=html;
  var ov=document.getElementById('draftPreviewOverlay');   if(ov)   ov.classList.remove('hidden');
}
function closeDraftPreview(){
  var ov=document.getElementById('draftPreviewOverlay'); if(ov) ov.classList.add('hidden');
}

/* ══════════════════════════════════════════════════════════
   SUBMIT TO ADMIN
   ══════════════════════════════════════════════════════════ */
async function submitExamToAdmin(){
  ecCollectDOM();
  var title    = ecGetVal('examTitle').trim();
  var subject  = ecGetVal('examSubject');
  var cls      = ecGetVal('examClass');
  var duration = parseInt(ecGetVal('examDuration'));
  var session  = ecGetVal('examSession');
  var term     = ecGetVal('examTerm');
  var expiryRaw= ecGetVal('examExpiry');
  var expiresAt= expiryRaw ? new Date(expiryRaw).toISOString() : null;
  var errEl    = document.getElementById('examCreateError');
  if(errEl){errEl.textContent='';errEl.style.display='none';}

  if(!title)                    return ecShowErr(errEl,'Please enter an exam title.');
  if(!subject)                  return ecShowErr(errEl,'Please select a subject.');
  if(!cls)                      return ecShowErr(errEl,'Please select a target class.');
  if(!duration||duration<5)     return ecShowErr(errEl,'Please set a valid duration (min 5 minutes).');
  if(expiresAt && new Date(expiresAt) <= new Date())
                                 return ecShowErr(errEl,'Deadline must be in the future.');
  if(EC.objQuestions.length===0&&EC.theoryQuestions.length===0)
                                return ecShowErr(errEl,'Please add at least one question.');

  for(var i=0;i<EC.objQuestions.length;i++){
    var q=EC.objQuestions[i];
    if(!q.text.trim())          return ecShowErr(errEl,'Objective Q'+(i+1)+': Question text is empty.');
    for(var oi=0;oi<4;oi++) if(!q.options[oi].trim()) return ecShowErr(errEl,'Objective Q'+(i+1)+': Option '+['A','B','C','D'][oi]+' is empty.');
    if(q.answer===-1)           return ecShowErr(errEl,'Objective Q'+(i+1)+': Please select the correct answer.');
    if(!q.marks||q.marks<=0)   return ecShowErr(errEl,'Objective Q'+(i+1)+': Marks must be greater than 0.');
  }
  for(var j=0;j<EC.theoryQuestions.length;j++){
    var tq=EC.theoryQuestions[j];
    if(!tq.text.trim())         return ecShowErr(errEl,'Theory Q'+(j+1)+': Question text is empty.');
    if(!tq.marks||tq.marks<=0) return ecShowErr(errEl,'Theory Q'+(j+1)+': Marks must be greater than 0.');
  }

  var oT=EC.objQuestions.reduce(function(s,q){return s+(parseFloat(q.marks)||0);},0);
  var tT=EC.theoryQuestions.reduce(function(s,q){return s+(parseFloat(q.marks)||0);},0);

  var auth=null;
  try{auth=JSON.parse(localStorage.getItem('edu_session'));}catch(e){}
  var tName=auth?(auth.name||auth.username||'Teacher'):'Teacher';
  var tUser=auth?(auth.username||''):'';

  /* Get schoolId from session, or decode JWT as fallback */
  var schoolId=auth?(auth.schoolId||''):'';
  if(!schoolId){
    try{
      var rawToken=localStorage.getItem('edu_token')||'';
      if(rawToken){
        var payload=rawToken.split('.')[1];
        var decoded=JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
        schoolId=decoded.schoolId||'';
      }
    }catch(e){}
  }

  var payload={
    id:'ex_'+Date.now(), title:title, subject:subject, targetClass:cls, duration:duration,
    session:session, term:term, totalMarks:oT+tT, objMarks:oT, theoryMarks:tT,
    questions:EC.objQuestions.map(function(q){return{type:'objective',text:q.text,options:q.options,answer:q.answer,marks:q.marks};}),
    theoryQuestions:EC.theoryQuestions.map(function(q){return{type:'theory',text:q.text,guide:q.guide,marks:q.marks};}),
    createdBy:tUser, createdByName:tName, status:'pending',
    createdAt:new Date().toISOString().split('T')[0]
  };

  /* Submit to MongoDB via API */
  if(!schoolId) return ecShowErr(errEl,'School ID not found. Please log out and log in again.');
  var submitPayload = {
    schoolId:schoolId,
    title:title, subject:subject, targetClass:cls, duration:duration,
    session:session, term:term, expiresAt:expiresAt, totalMarks:oT+tT, objMarks:oT, theoryMarks:tT,
    questions:EC.objQuestions.map(function(q){return{type:'objective',text:q.text,options:q.options,answer:q.answer,marks:q.marks};}),
    theoryQuestions:EC.theoryQuestions.map(function(q){return{type:'theory',text:q.text,guide:q.guide,marks:q.marks};}),
    createdBy:tUser, createdByName:tName, status:'pending'
  };
  try{
    if(typeof Api!=='undefined'){
      /* The server auto-creates the admin "new exam pending" notification
         inside POST /exams — no second client call needed. */
      await Api.post('/exams', submitPayload);
    } else {
      ecShowErr(errEl,'API not available. Make sure server is running.');return;
    }
  }catch(e){ return ecShowErr(errEl,'Submission failed: '+e.message); }

  ecToast('✅ Exam submitted to Admin for approval!','success');
  localStorage.removeItem(EC.DRAFT_KEY);
  EC.objQuestions=[ecNewObj()]; EC.theoryQuestions=[ecNewTheory()];
  ['examTitle','examSubject','examClass','examDuration','examSession','examTerm','examExpiry'].forEach(function(id){ecSetVal(id,'');});
  ecRenderAll(); ecUpdateSummary(); ecUpdateCounts(); ecSetStatus('saved');
  if(typeof showSection==='function') showSection('my-exams');
}

/* ══════════════════════════════════════════════════════════
   TINY HELPERS
   ══════════════════════════════════════════════════════════ */
function ecFindQ(type,id){
  var a=(type==='obj')?EC.objQuestions:EC.theoryQuestions;
  for(var i=0;i<a.length;i++){if(a[i].id===id) return a[i];} return null;
}
function ecEsc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function ecGetVal(id){ var e=document.getElementById(id); return e?e.value:''; }
function ecSetVal(id,v){ var e=document.getElementById(id); if(e) e.value=v; }
function ecShowErr(el,msg){ if(el){el.textContent=msg;el.style.display='block';} }
function ecToast(msg,type){ if(typeof showToast==='function') showToast(msg,type); else console.log('[Toast]',msg); }
function ecConfirm(title,msg,cb){ if(typeof confirm2==='function') confirm2(title,msg,cb); else if(window.confirm(msg)) cb(); }

/* ══════════════════════════════════════════════════════════
   AI EXAM QUESTION GENERATOR
   Calls POST /api/ai/generate-exam and lets the teacher
   review/select generated questions before inserting them
   into the current draft (EC.objQuestions / EC.theoryQuestions).
   Namespaced under AIGen{} — does not touch EC state until
   the teacher explicitly clicks "Insert Selected Questions".
   ══════════════════════════════════════════════════════════ */
var AIGen = {
  objective : [],   // last generated objective questions
  theory    : [],   // last generated theory questions
  exObj     : {},   // excluded objective indices { idx: true }
  exTheory  : {},   // excluded theory indices { idx: true }
  insertMode: 'append'
};

function aiOpenModal(){
  ecCollectDOM();
  var subject = ecGetVal('examSubject');
  var cls     = ecGetVal('examClass');
  var errEl   = document.getElementById('aiGenError');
  if(errEl){ errEl.textContent=''; errEl.style.display='none'; }
  if(!subject || !cls){
    ecToast('Please select Subject and Target Class above before generating with AI.','error');
    return;
  }
  aiSetStage('form');
  var ov = document.getElementById('aiGenOverlay');
  if(ov) ov.classList.remove('hidden');
}

function aiCloseModal(){
  var ov = document.getElementById('aiGenOverlay');
  if(ov) ov.classList.add('hidden');
}

function aiSetStage(stage){
  var form    = document.getElementById('aiGenForm');
  var loading = document.getElementById('aiGenLoading');
  var preview = document.getElementById('aiGenPreview');
  var footer  = document.getElementById('aiGenFooter');
  if(!form||!loading||!preview||!footer) return;

  form.classList.toggle('hidden',    stage!=='form');
  loading.classList.toggle('hidden', stage!=='loading');
  preview.classList.toggle('hidden', stage!=='preview');

  if(stage==='form'){
    footer.innerHTML =
      '<button class="btn-secondary" onclick="aiCloseModal()">Cancel</button>'+
      '<button class="btn-primary" id="aiGenerateBtn" onclick="aiGenerate()">✨ Generate Questions</button>';
  } else if(stage==='loading'){
    footer.innerHTML = '<button class="btn-secondary" disabled>Please wait…</button>';
  } else if(stage==='preview'){
    footer.innerHTML =
      '<button class="btn-secondary" onclick="aiSetStage(\'form\')">↩ Back</button>'+
      '<button class="btn-primary" onclick="aiInsertSelected()">✅ Insert Selected Questions</button>';
  }
}

async function aiGenerate(){
  var errEl = document.getElementById('aiGenError');
  if(errEl){ errEl.textContent=''; errEl.style.display='none'; }

  var payload = {
    subject     : ecGetVal('examSubject'),
    targetClass : ecGetVal('examClass'),
    session     : ecGetVal('examSession'),
    term        : ecGetVal('examTerm'),
    topic       : (document.getElementById('aiTopic')||{}).value || '',
    difficulty  : (document.getElementById('aiDifficulty')||{}).value || 'medium',
    numObjective: parseInt((document.getElementById('aiNumObjective')||{}).value,10) || 0,
    numTheory   : parseInt((document.getElementById('aiNumTheory')||{}).value,10) || 0
  };
  AIGen.insertMode = (document.getElementById('aiInsertMode')||{}).value || 'append';

  if(payload.numObjective<=0 && payload.numTheory<=0){
    return ecShowErr(errEl,'Please request at least one objective or theory question.');
  }

  aiSetStage('loading');
  try{
    if(typeof Api==='undefined') throw new Error('API not available. Make sure server is running.');
    var res = await Api.post('/ai/generate-exam', payload);
    AIGen.objective = res.objective || [];
    AIGen.theory    = res.theory    || [];
    AIGen.exObj     = {};
    AIGen.exTheory  = {};
    if(AIGen.objective.length===0 && AIGen.theory.length===0){
      aiSetStage('form');
      return ecShowErr(errEl,'The AI did not return any usable questions. Try again or adjust the topic.');
    }
    aiRenderPreview();
    aiSetStage('preview');
  }catch(e){
    aiSetStage('form');
    ecShowErr(errEl, e.message || 'Generation failed. Please try again.');
  }
}

function aiRenderPreview(){
  var cont = document.getElementById('aiGenPreview');
  if(!cont) return;
  var L = ['A','B','C','D'];
  var html = '<div class="ai-preview-summary">✨ Generated '+AIGen.objective.length+' objective and '+
    AIGen.theory.length+' theory question(s). Untick any you don\'t want, then insert.</div>';

  if(AIGen.objective.length>0){
    html += '<div class="preview-section-title">SECTION A — OBJECTIVE</div>';
    AIGen.objective.forEach(function(q,i){
      var excluded = !!AIGen.exObj[i];
      html += '<div class="ai-q-block '+(excluded?'excluded':'')+'" id="aiqobj_'+i+'">'+
        '<input type="checkbox" '+(excluded?'':'checked')+' onchange="aiToggleQ(\'obj\','+i+')"/>'+
        '<div class="ai-q-body">'+
          '<div class="preview-q-meta"><span class="preview-q-num">Q'+(i+1)+'</span><span class="preview-marks-tag">'+q.marks+' mark'+(q.marks!==1?'s':'')+'</span></div>'+
          '<div class="preview-q-text">'+ecEsc(q.text)+'</div>';
      q.options.forEach(function(o,oi){
        html += '<div class="preview-opt-row '+(oi===q.answer?'correct-opt':'')+'"><span>'+L[oi]+'.</span><span>'+ecEsc(o)+(oi===q.answer?' &nbsp;✓':'')+'</span></div>';
      });
      html += '</div></div>';
    });
  }
  if(AIGen.theory.length>0){
    html += '<div class="preview-section-title">SECTION B — THEORY</div>';
    AIGen.theory.forEach(function(q,i){
      var excluded = !!AIGen.exTheory[i];
      html += '<div class="ai-q-block '+(excluded?'excluded':'')+'" id="aiqtheory_'+i+'">'+
        '<input type="checkbox" '+(excluded?'':'checked')+' onchange="aiToggleQ(\'theory\','+i+')"/>'+
        '<div class="ai-q-body">'+
          '<div class="preview-q-meta"><span class="preview-q-num">Q'+(i+1)+'</span><span class="preview-marks-tag">'+q.marks+' mark'+(q.marks!==1?'s':'')+'</span></div>'+
          '<div class="preview-q-text">'+ecEsc(q.text)+'</div>'+
          (q.guide?'<div class="preview-theory-guide">📋 <strong>Marking Guide:</strong> '+ecEsc(q.guide)+'</div>':'')+
        '</div></div>';
    });
  }
  cont.innerHTML = html;
}

function aiToggleQ(type, idx){
  var map = (type==='obj') ? AIGen.exObj : AIGen.exTheory;
  map[idx] = !map[idx];
  var block = document.getElementById((type==='obj'?'aiqobj_':'aiqtheory_')+idx);
  if(block) block.classList.toggle('excluded', !!map[idx]);
}

function aiInsertSelected(){
  ecCollectDOM();
  var addedObj = 0, addedTheory = 0;

  if(AIGen.insertMode==='replace'){
    EC.objQuestions    = [];
    EC.theoryQuestions = [];
  }

  AIGen.objective.forEach(function(q,i){
    if(AIGen.exObj[i]) return;
    var nq = ecNewObj();
    nq.text    = q.text;
    nq.options = q.options.slice(0,4);
    nq.answer  = q.answer;
    nq.marks   = q.marks;
    EC.objQuestions.push(nq);
    addedObj++;
  });
  AIGen.theory.forEach(function(q,i){
    if(AIGen.exTheory[i]) return;
    var nq = ecNewTheory();
    nq.text  = q.text;
    nq.guide = q.guide || '';
    nq.marks = q.marks;
    EC.theoryQuestions.push(nq);
    addedTheory++;
  });

  /* Remove the single blank placeholder question if it's still empty
     and we just inserted real AI questions alongside it. */
  if(addedObj>0){
    EC.objQuestions = EC.objQuestions.filter(function(q,i,arr){
      return q.text.trim()!=='' || arr.length===1;
    });
  }
  if(addedTheory>0){
    EC.theoryQuestions = EC.theoryQuestions.filter(function(q,i,arr){
      return q.text.trim()!=='' || arr.length===1;
    });
  }

  ecRenderAll();
  ecUpdateSummary(); ecUpdateCounts(); scheduleAutosave();
  aiCloseModal();
  ecToast('✨ Inserted '+addedObj+' objective and '+addedTheory+' theory question(s).','success');
}