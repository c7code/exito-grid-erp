/* ============================================================
   EXITOGRID — DIAGNÓSTICO PRÉ-ORÇAMENTO v3
   Usa quiz-data.js para perguntas/opções/classificação.
   Mantém o design glassmorphism existente (styles.css).
   ============================================================ */
(function(){
'use strict';

var answers = {};
var currentMainStep = 0; // 0=tipo, 1=servico, 2=condicional, 3=dados, 4=resultado
var condSubStep = 0;
var condQuestions = [];
var helpTimer = null;
var abandonTimer = null;
var totalSteps = 4;

/* ── Cria o HTML do quiz overlay ── */
function buildQuizHTML(){
  var el = document.createElement('div');
  el.className = 'quiz-overlay';
  el.id = 'quiz-overlay';
  el.innerHTML =
    '<div class="quiz-glass">' +
      '<div class="quiz-glow-1"></div><div class="quiz-glow-2"></div>' +
      '<button class="quiz-close" id="quiz-close" aria-label="Fechar">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      '</button>' +
      '<div class="quiz-progress" id="quiz-progress"></div>' +
      '<div id="quiz-content"></div>' +
      '<div class="quiz-help-toast" id="quiz-help">Não sabe responder? Pode marcar "Não sei". Nossa equipe orienta você.</div>' +
      '<div class="quiz-abandon" id="quiz-abandon">' +
        '<div class="quiz-abandon-inner">' +
          '<h4>Quer continuar depois?</h4>' +
          '<p>Podemos te ajudar pelo WhatsApp.</p>' +
          '<div class="quiz-abandon-btns">' +
            '<a href="https://wa.me/' + QUIZ_WHATSAPP + '?text=' + encodeURIComponent('Olá, vim pelo site da Exitogrid e gostaria de ajuda para identificar qual serviço preciso.') + '" target="_blank" style="background:#25d366;color:#fff;">WhatsApp</a>' +
            '<button onclick="document.getElementById(\'quiz-abandon\').classList.remove(\'visible\')" style="background:rgba(255,255,255,.08);color:#e2e8f0;">Continuar diagnóstico</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);

  document.getElementById('quiz-close').addEventListener('click', function(){
    closeQuiz();
  });
  el.addEventListener('click', function(e){
    if(e.target === el) showAbandon();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && el.classList.contains('active')) showAbandon();
  });
}

/* ── Progresso ── */
function renderProgress(){
  var bar = document.getElementById('quiz-progress');
  var labels = ['Imóvel','Serviço','Detalhes','Dados'];
  var html = '';
  for(var i = 0; i < labels.length; i++){
    var cls = 'quiz-progress-step';
    if(i < currentMainStep) cls += ' done';
    else if(i === currentMainStep) cls += ' active';
    html += '<div class="' + cls + '"></div>';
  }
  html += '<span class="quiz-progress-label">' + labels[Math.min(currentMainStep, 3)] + '</span>';
  bar.innerHTML = html;
}

/* ── Renderiza opções tipo radio ── */
function renderOptions(options, stepId, cols3){
  var cls = 'quiz-options' + (cols3 ? ' cols-3' : '');
  var html = '<div class="' + cls + '">';
  for(var i = 0; i < options.length; i++){
    var o = options[i];
    var icon = o.icon || '';
    var text = o.text || o;
    var value = o.value || o;
    var sel = answers[stepId] === value ? ' selected' : '';
    html += '<button class="quiz-option' + sel + '" data-step="' + stepId + '" data-value="' + escHtml(value) + '">' +
      (icon ? '<span class="quiz-option-icon">' + icon + '</span>' : '') +
      '<span class="quiz-option-text">' + escHtml(text) + '</span>' +
      '<span class="quiz-option-radio"></span>' +
    '</button>';
  }
  html += '</div>';
  return html;
}

/* ── Renderiza opções com seleção múltipla ── */
function renderMultiOptions(options, stepId){
  var selected = answers[stepId] ? answers[stepId].split(', ') : [];
  var html = '<div class="quiz-options">';
  for(var i = 0; i < options.length; i++){
    var o = options[i];
    var sel = selected.indexOf(o) !== -1 ? ' selected' : '';
    html += '<button class="quiz-option' + sel + '" data-step="' + stepId + '" data-value="' + escHtml(o) + '" data-multi="1">' +
      '<span class="quiz-option-text">' + escHtml(o) + '</span>' +
      '<span class="quiz-option-radio"></span>' +
    '</button>';
  }
  html += '</div>';
  return html;
}

/* ── Renderiza campo de texto ── */
function renderTextField(field){
  var val = answers[field.id] || '';
  return '<div class="quiz-form-group">' +
    '<label>' + escHtml(field.q || field.label || '') + '</label>' +
    '<input class="quiz-input" type="' + (field.type || 'text') + '" data-field="' + field.id + '" placeholder="' + escHtml(field.placeholder || '') + '" value="' + escHtml(val) + '">' +
  '</div>';
}

/* ── Step principal ── */
function renderStep(){
  clearTimers();
  renderProgress();
  var box = document.getElementById('quiz-content');
  var html = '';

  if(currentMainStep === 0){
    html = buildStepHTML(QUIZ_STEP1.label, QUIZ_STEP1.title, renderOptions(QUIZ_STEP1.options, QUIZ_STEP1.id), canGoNext());
  } else if(currentMainStep === 1){
    html = buildStepHTML(QUIZ_STEP2.label, QUIZ_STEP2.title, renderOptions(QUIZ_STEP2.options, QUIZ_STEP2.id), canGoNext());
  } else if(currentMainStep === 2){
    renderCondStep();
    startHelpTimer();
    return;
  } else if(currentMainStep === 3){
    renderDadosStep();
    startHelpTimer();
    return;
  } else if(currentMainStep === 4){
    renderResult();
    return;
  }

  box.innerHTML = '<div class="quiz-step active">' + html + '</div>';
  bindOptionClicks();
  startHelpTimer();
}

function buildStepHTML(label, title, body, nextEnabled){
  var backBtn = currentMainStep > 0 ? '<button class="quiz-nav-back" id="quiz-back">← Voltar</button>' : '';
  return '<div class="quiz-header"><div class="quiz-step-num">' + escHtml(label) + '</div><h3>' + escHtml(title) + '</h3></div>' +
    '<div class="quiz-body">' + body + '</div>' +
    '<div class="quiz-nav">' + backBtn +
      '<button class="quiz-nav-next' + (nextEnabled ? ' enabled' : '') + '" id="quiz-next">Continuar →</button>' +
    '</div>';
}

/* ── Step condicional (etapa 3) ── */
function renderCondStep(){
  var servico = answers._servicoProvavel || 'A definir';
  condQuestions = QUIZ_STEP3_MAP[servico] || QUIZ_STEP3_MAP['A definir'] || [];
  if(condSubStep >= condQuestions.length){
    currentMainStep = 3;
    renderStep();
    return;
  }
  var cq = condQuestions[condSubStep];
  var box = document.getElementById('quiz-content');
  var body = '';

  if(cq.type === 'text'){
    body = renderTextField(cq);
  } else {
    body = renderOptions(cq.opts.map(function(o){ return {text:o, value:o}; }), cq.id);
  }

  // Alert for 75kW
  var noteHTML = '';
  if(cq.alert75 && answers[cq.id] === 'Acima de 75 kW'){
    noteHTML = '<div class="quiz-note">⚡ Acima de 75 kW pode ser necessária análise para subestação em média tensão.</div>';
  }
  if(cq.alertSolar && (answers[cq.id] === 'R$1.501 a R$3.000' || answers[cq.id] === 'Acima de R$3.000')){
    noteHTML = '<div class="quiz-note">☀️ Contas acima de R$1.500 indicam grande potencial para energia solar comercial/industrial.</div>';
  }

  var label = 'DETALHES — ' + (condSubStep + 1) + '/' + condQuestions.length;
  var html = buildStepHTML(label, cq.q, body + noteHTML, canGoNextCond());
  box.innerHTML = '<div class="quiz-step active">' + html + '</div>';
  renderProgress();
  bindOptionClicks();
  bindTextInputs();
}

/* ── Step dados do cliente (etapa 4) ── */
function renderDadosStep(){
  var box = document.getElementById('quiz-content');
  var body = '';

  for(var i = 0; i < QUIZ_STEP4_FIELDS.length; i++){
    var f = QUIZ_STEP4_FIELDS[i];
    var val = answers[f.id] || '';
    body += '<div class="quiz-form-group">' +
      '<label>' + escHtml(f.label) + '</label>' +
      '<input class="quiz-input" type="' + f.type + '" data-field="' + f.id + '" placeholder="' + escHtml(f.placeholder) + '" value="' + escHtml(val) + '"' + (f.required ? ' required' : '') + '>' +
    '</div>';
  }

  // Prazo
  body += '<div style="margin-top:16px"><label style="font-size:.78rem;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">' + QUIZ_STEP4_PRAZO.label + '</label>';
  body += renderOptions(QUIZ_STEP4_PRAZO.opts.map(function(o){return{text:o,value:o};}), QUIZ_STEP4_PRAZO.id, true);
  body += '</div>';

  // Docs (multi)
  body += '<div style="margin-top:16px"><label style="font-size:.78rem;color:#64748b;font-weight:500;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:6px">' + QUIZ_STEP4_DOCS.label + ' <small style="color:#94a3b8">(pode marcar mais de uma)</small></label>';
  body += renderMultiOptions(QUIZ_STEP4_DOCS.opts, QUIZ_STEP4_DOCS.id);
  body += '</div>';

  // Observação
  body += '<div class="quiz-form-group" style="margin-top:16px">' +
    '<label>Observações (opcional)</label>' +
    '<textarea class="quiz-textarea" data-field="cli_obs" placeholder="Informações adicionais que considere importantes...">' + escHtml(answers.cli_obs || '') + '</textarea>' +
  '</div>';

  var html = '<div class="quiz-header"><div class="quiz-step-num">ETAPA FINAL</div><h3>Seus dados para contato</h3></div>' +
    '<div class="quiz-body">' + body + '</div>' +
    '<div class="quiz-nav">' +
      '<button class="quiz-nav-back" id="quiz-back">← Voltar</button>' +
      '<button class="quiz-nav-next' + (canSubmit() ? ' enabled' : '') + '" id="quiz-next">Solicitar Orçamento →</button>' +
    '</div>';
  box.innerHTML = '<div class="quiz-step active">' + html + '</div>';
  renderProgress();
  bindOptionClicks();
  bindTextInputs();
}

/* ── Resultado final ── */
function renderResult(){
  quizTrackEvent('diagnostico_concluido', {servico: answers._servicoProvavel});

  var servico = answers._servicoProvavel || 'A definir';
  var lead = classificarLead(answers);
  answers._leadClass = lead;

  // Track specific leads
  var trackMap = {'Subestação Elétrica':'lead_subestacao','Energia Solar':'lead_solar','Aumento de Carga':'lead_aumento_carga','Laudos Técnicos':'lead_laudo','Vistoria/Reprovação Neoenergia':'lead_neoenergia'};
  if(trackMap[servico]) quizTrackEvent(trackMap[servico], {lead: lead});

  var leadLabel = lead === 'quente' ? '🔥 Lead Quente' : lead === 'medio' ? '🟡 Lead Médio' : '🔵 Lead Frio';
  var leadClass = lead === 'quente' ? 'hot' : lead === 'medio' ? 'medium' : 'cold';

  var waMsg = buildWhatsAppMessage();
  var waURL = 'https://wa.me/' + QUIZ_WHATSAPP + '?text=' + encodeURIComponent(waMsg);

  var box = document.getElementById('quiz-content');
  box.innerHTML =
    '<div class="quiz-step active"><div class="quiz-result">' +
      '<div class="quiz-confetti" id="quiz-confetti"></div>' +
      '<div class="quiz-result-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div>' +
      '<div class="quiz-result-label">DIAGNÓSTICO CONCLUÍDO</div>' +
      '<h3>Serviço identificado:</h3>' +
      '<div class="quiz-result-service">⚡ ' + escHtml(servico) + '</div>' +
      '<span class="quiz-lead-badge ' + leadClass + '">' + leadLabel + '</span>' +
      '<p>Clique abaixo para enviar os dados diretamente para nossa equipe técnica via WhatsApp e receber seu orçamento.</p>' +
      '<a href="' + waURL + '" target="_blank" rel="noopener" class="quiz-result-cta" id="quiz-wa-btn">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.552 4.109 1.516 5.833L.022 23.978l6.284-1.647A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892c-1.99 0-3.85-.538-5.444-1.476l-.39-.232-4.046 1.061 1.08-3.943-.255-.404A9.847 9.847 0 0 1 2.108 12C2.108 6.53 6.53 2.108 12 2.108c5.47 0 9.892 4.422 9.892 9.892 0 5.47-4.422 9.892-9.892 9.892z"/></svg>' +
        'Enviar para WhatsApp e Solicitar Orçamento' +
      '</a>' +
      '<button class="quiz-result-restart" id="quiz-restart">Refazer diagnóstico</button>' +
    '</div></div>';

  renderProgress();
  spawnConfetti();

  document.getElementById('quiz-wa-btn').addEventListener('click', function(){
    quizTrackEvent('whatsapp_orcamento_clicado', {servico: servico, lead: lead});
  });
  document.getElementById('quiz-restart').addEventListener('click', function(){
    answers = {};
    currentMainStep = 0;
    condSubStep = 0;
    renderStep();
  });
}

/* ── Mensagem WhatsApp ── */
function buildWhatsAppMessage(){
  var servico = answers._servicoProvavel || 'A definir';
  var lead = answers._leadClass || 'frio';
  var detalhes = [];
  var condQ = QUIZ_STEP3_MAP[servico] || [];
  for(var i = 0; i < condQ.length; i++){
    var cq = condQ[i];
    if(answers[cq.id]){
      detalhes.push(cq.q.replace(/:/g,'').substring(0,40) + ': ' + answers[cq.id]);
    }
  }

  return 'Olá, vim pelo site da Exitogrid e preenchi o pré-orçamento.\n\n' +
    'Nome: ' + (answers.cli_nome || '-') + '\n' +
    'WhatsApp: ' + (answers.cli_whatsapp || '-') + '\n' +
    'Cidade: ' + (answers.cli_cidade || '-') + '\n' +
    'Tipo de imóvel: ' + (answers.tipo_imovel || '-') + '\n' +
    'Serviço provável: ' + servico + '\n' +
    'Situação principal: ' + (answers.servico_principal || '-') + '\n' +
    'Detalhes técnicos:\n' + (detalhes.length ? detalhes.join('\n') : 'Nenhum detalhe adicional') + '\n' +
    'Prazo: ' + (answers.cli_prazo || '-') + '\n' +
    'Documentos disponíveis: ' + (answers.cli_docs || 'Nenhum') + '\n' +
    'Classificação do lead: ' + lead + '\n' +
    'Observação: ' + (answers.cli_obs || 'Nenhuma') + '\n\n' +
    'Gostaria de receber uma orientação/orçamento.';
}

/* ── Bind de cliques nas opções ── */
function bindOptionClicks(){
  var btns = document.querySelectorAll('.quiz-option');
  for(var i = 0; i < btns.length; i++){
    btns[i].addEventListener('click', handleOptionClick);
  }
  var backBtn = document.getElementById('quiz-back');
  if(backBtn) backBtn.addEventListener('click', goBack);
  var nextBtn = document.getElementById('quiz-next');
  if(nextBtn) nextBtn.addEventListener('click', goNext);
}

function bindTextInputs(){
  var inputs = document.querySelectorAll('.quiz-input, .quiz-textarea');
  for(var i = 0; i < inputs.length; i++){
    inputs[i].addEventListener('input', function(){
      var field = this.getAttribute('data-field');
      if(field) answers[field] = this.value;
      updateNextBtn();
    });
  }
}

function handleOptionClick(e){
  var btn = e.currentTarget;
  var step = btn.getAttribute('data-step');
  var value = btn.getAttribute('data-value');
  var isMulti = btn.getAttribute('data-multi');

  if(isMulti){
    var current = answers[step] ? answers[step].split(', ') : [];
    var idx = current.indexOf(value);
    if(idx !== -1) current.splice(idx, 1);
    else current.push(value);
    answers[step] = current.join(', ');
    btn.classList.toggle('selected');
  } else {
    var siblings = btn.parentNode.querySelectorAll('.quiz-option');
    for(var i = 0; i < siblings.length; i++) siblings[i].classList.remove('selected');
    btn.classList.add('selected');
    answers[step] = value;

    // Map servico from step 2
    if(step === 'servico_principal'){
      var opt = null;
      for(var j = 0; j < QUIZ_STEP2.options.length; j++){
        if(QUIZ_STEP2.options[j].value === value){ opt = QUIZ_STEP2.options[j]; break; }
      }
      if(opt && opt.servico) answers._servicoProvavel = opt.servico;
      quizTrackEvent('etapa_servico_escolhido', {servico: opt ? opt.servico : value});
    }
  }

  updateNextBtn();
  resetHelpTimer();

  // Show conditional notes
  if(currentMainStep === 2 && condQuestions[condSubStep]){
    var cq = condQuestions[condSubStep];
    var existingNote = document.querySelector('.quiz-note');
    if(existingNote) existingNote.remove();
    var noteHTML = '';
    if(cq.alert75 && value === 'Acima de 75 kW'){
      noteHTML = '<div class="quiz-note">⚡ Acima de 75 kW pode ser necessária análise para subestação em média tensão.</div>';
    }
    if(cq.alertSolar && (value === 'R$1.501 a R$3.000' || value === 'Acima de R$3.000')){
      noteHTML = '<div class="quiz-note">☀️ Contas acima de R$1.500 indicam grande potencial para energia solar comercial/industrial.</div>';
    }
    if(noteHTML){
      var body = document.querySelector('.quiz-body');
      if(body) body.insertAdjacentHTML('beforeend', noteHTML);
    }
  }
}

/* ── Navegação ── */
function canGoNext(){
  if(currentMainStep === 0) return !!answers[QUIZ_STEP1.id];
  if(currentMainStep === 1) return !!answers[QUIZ_STEP2.id];
  return false;
}

function canGoNextCond(){
  if(!condQuestions[condSubStep]) return false;
  var cq = condQuestions[condSubStep];
  if(cq.type === 'text') return !!(answers[cq.id] && answers[cq.id].trim());
  return !!answers[cq.id];
}

function canSubmit(){
  return !!(answers.cli_nome && answers.cli_whatsapp && answers.cli_cidade);
}

function updateNextBtn(){
  var btn = document.getElementById('quiz-next');
  if(!btn) return;
  var enabled = false;
  if(currentMainStep === 0) enabled = canGoNext();
  else if(currentMainStep === 1) enabled = canGoNext();
  else if(currentMainStep === 2) enabled = canGoNextCond();
  else if(currentMainStep === 3) enabled = canSubmit();
  if(enabled) btn.classList.add('enabled');
  else btn.classList.remove('enabled');
}

function goNext(){
  var btn = document.getElementById('quiz-next');
  if(!btn || !btn.classList.contains('enabled')) return;

  if(currentMainStep === 0){
    currentMainStep = 1;
    condSubStep = 0;
    renderStep();
  } else if(currentMainStep === 1){
    currentMainStep = 2;
    condSubStep = 0;
    var servico = answers._servicoProvavel || 'A definir';
    condQuestions = QUIZ_STEP3_MAP[servico] || QUIZ_STEP3_MAP['A definir'] || [];
    if(condQuestions.length === 0){ currentMainStep = 3; }
    renderStep();
  } else if(currentMainStep === 2){
    condSubStep++;
    if(condSubStep >= condQuestions.length){
      currentMainStep = 3;
      renderStep();
    } else {
      renderCondStep();
      startHelpTimer();
    }
  } else if(currentMainStep === 3){
    if(canSubmit()){
      currentMainStep = 4;
      renderStep();
    }
  }
}

function goBack(){
  if(currentMainStep === 1){
    currentMainStep = 0;
    renderStep();
  } else if(currentMainStep === 2){
    if(condSubStep > 0){
      condSubStep--;
      renderCondStep();
    } else {
      currentMainStep = 1;
      renderStep();
    }
  } else if(currentMainStep === 3){
    currentMainStep = 2;
    var servico = answers._servicoProvavel || 'A definir';
    condQuestions = QUIZ_STEP3_MAP[servico] || QUIZ_STEP3_MAP['A definir'] || [];
    condSubStep = Math.max(0, condQuestions.length - 1);
    if(condQuestions.length === 0){ currentMainStep = 1; }
    renderStep();
  }
}

/* ── Help toast (inatividade) ── */
function startHelpTimer(){
  clearTimers();
  helpTimer = setTimeout(function(){
    var toast = document.getElementById('quiz-help');
    if(toast) toast.classList.add('visible');
    setTimeout(function(){ if(toast) toast.classList.remove('visible'); }, 5000);
  }, 15000);
}

function resetHelpTimer(){
  var toast = document.getElementById('quiz-help');
  if(toast) toast.classList.remove('visible');
  startHelpTimer();
}

function clearTimers(){
  if(helpTimer) clearTimeout(helpTimer);
  if(abandonTimer) clearTimeout(abandonTimer);
}

/* ── Abandon overlay ── */
function showAbandon(){
  var el = document.getElementById('quiz-abandon');
  if(el) el.classList.add('visible');
}

/* ── Confetti ── */
function spawnConfetti(){
  var container = document.getElementById('quiz-confetti');
  if(!container) return;
  var colors = ['#f97316','#fbbf24','#22c55e','#0ea5e9','#a855f7','#ef4444'];
  for(var i = 0; i < 30; i++){
    var span = document.createElement('span');
    span.style.left = Math.random() * 100 + '%';
    span.style.background = colors[Math.floor(Math.random() * colors.length)];
    span.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    span.style.animationDelay = (Math.random() * 0.8) + 's';
    span.style.width = (4 + Math.random() * 6) + 'px';
    span.style.height = (4 + Math.random() * 6) + 'px';
    container.appendChild(span);
  }
}

/* ── Open / Close ── */
function openQuiz(){
  var el = document.getElementById('quiz-overlay');
  if(!el) return;
  el.classList.add('active');
  document.body.style.overflow = 'hidden';
  quizTrackEvent('diagnostico_iniciado');
  renderStep();
}

function closeQuiz(){
  var el = document.getElementById('quiz-overlay');
  if(!el) return;
  el.classList.remove('active');
  document.body.style.overflow = '';
  clearTimers();
}

/* ── Escape HTML ── */
function escHtml(s){
  if(!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Init — runs immediately if DOM ready, or waits ── */
function initQuiz(){
  if(document.getElementById('quiz-overlay')) return; // already built
  buildQuizHTML();
  window._openDiagnostico = openQuiz;
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initQuiz);
} else {
  initQuiz();
}

})();
