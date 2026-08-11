/* ============================================================
   EXITOGRID — QUIZ DATA (Perguntas, opções, lógica condicional)
   ============================================================
   Para editar perguntas/opções, altere os objetos abaixo.
   WHATSAPP: altere o número na variável QUIZ_WHATSAPP.
   ============================================================ */

/* ── NÚMERO DO WHATSAPP ── */
var QUIZ_WHATSAPP = '5581988906429';

/* ── ETAPA 1 — Tipo de imóvel ── */
var QUIZ_STEP1 = {
  id: 'tipo_imovel',
  label: 'ETAPA 1 DE 4',
  title: 'Qual tipo de imóvel ou empreendimento precisa de atendimento?',
  options: [
    { icon: '🏠', text: 'Residência', value: 'Residência' },
    { icon: '🏪', text: 'Comércio ou loja', value: 'Comércio ou loja' },
    { icon: '🏢', text: 'Condomínio residencial', value: 'Condomínio residencial' },
    { icon: '🏬', text: 'Condomínio comercial', value: 'Condomínio comercial' },
    { icon: '🏭', text: 'Indústria', value: 'Indústria' },
    { icon: '📦', text: 'Galpão ou centro logístico', value: 'Galpão ou centro logístico' },
    { icon: '🏗️', text: 'Obra em construção', value: 'Obra em construção' },
    { icon: '🗺️', text: 'Loteamento', value: 'Loteamento' },
    { icon: '🌾', text: 'Área rural / fazenda', value: 'Área rural / fazenda' },
    { icon: '☀️', text: 'Sistema ou usina de energia solar', value: 'Sistema ou usina de energia solar' },
    { icon: '🏛️', text: 'Prédio público / instituição', value: 'Prédio público / instituição' },
    { icon: '❓', text: 'Outro', value: 'Outro' }
  ]
};

/* ── ETAPA 2 — O que precisa resolver ── */
var QUIZ_STEP2 = {
  id: 'servico_principal',
  label: 'ETAPA 2 DE 4',
  title: 'O que você precisa resolver?',
  options: [
    { icon: '🔌', text: 'Ligar energia em imóvel novo', value: 'Ligar energia em imóvel novo', servico: 'Entrada de Energia' },
    { icon: '⚡', text: 'Aumentar carga elétrica', value: 'Aumentar carga elétrica', servico: 'Aumento de Carga' },
    { icon: '🔋', text: 'Instalar subestação elétrica', value: 'Instalar subestação elétrica', servico: 'Subestação Elétrica' },
    { icon: '📋', text: 'Regularizar instalação existente', value: 'Regularizar instalação existente', servico: 'Instalação Elétrica' },
    { icon: '🚫', text: 'Resolver reprovação/notificação da Neoenergia', value: 'Resolver reprovação da Neoenergia', servico: 'Vistoria/Reprovação Neoenergia' },
    { icon: '📄', text: 'Fazer laudo elétrico com ART', value: 'Fazer laudo elétrico com ART', servico: 'Laudos Técnicos' },
    { icon: '⛈️', text: 'Fazer SPDA / para-raios', value: 'Fazer SPDA / para-raios', servico: 'SPDA / Para-raios' },
    { icon: '🔩', text: 'Fazer aterramento ou medição', value: 'Fazer aterramento ou medição', servico: 'Aterramento' },
    { icon: '🛤️', text: 'Criar rede elétrica para loteamento/empreendimento', value: 'Criar rede elétrica para loteamento', servico: 'Rede Aérea' },
    { icon: '🔀', text: 'Deslocar poste, rede ou padrão', value: 'Deslocar poste, rede ou padrão', servico: 'Deslocamento de Rede' },
    { icon: '📡', text: 'Estender rede elétrica até o terreno', value: 'Estender rede elétrica até o terreno', servico: 'Extensão de Rede' },
    { icon: '🔧', text: 'Montar ou adequar quadro de distribuição', value: 'Montar ou adequar quadro de distribuição', servico: 'Quadro de Distribuição' },
    { icon: '🔄', text: 'Modernizar instalação elétrica antiga', value: 'Modernizar instalação elétrica antiga', servico: 'Modernização Elétrica' },
    { icon: '☀️', text: 'Instalar energia solar', value: 'Instalar energia solar', servico: 'Energia Solar' },
    { icon: '🛠️', text: 'Fazer manutenção ou inspeção elétrica', value: 'Fazer manutenção ou inspeção elétrica', servico: 'Instalação Elétrica' },
    { icon: '🤷', text: 'Não sei exatamente o que preciso', value: 'Não sei exatamente o que preciso', servico: 'A definir' }
  ]
};

/* ── ETAPA 3 — Perguntas condicionais por serviço ── */
var QUIZ_STEP3_MAP = {
  'Entrada de Energia': [
    { id: 'ee_situacao', q: 'O imóvel é novo ou já possui energia?', opts: ['Imóvel novo (nunca teve energia)','Já possui energia','Precisa regularizar','Não sei'] },
    { id: 'ee_tipo', q: 'Precisa de ligação nova, regularização, troca de padrão ou medição coletiva?', opts: ['Ligação nova','Regularização','Troca de padrão','Medição coletiva','Não sei'] },
    { id: 'ee_fase', q: 'Sabe se a ligação é mono, bi, trifásica ou média tensão?', opts: ['Monofásica','Bifásica','Trifásica','Média tensão','Não sei'] },
    { id: 'ee_docs', q: 'Possui conta de energia, planta, fotos ou notificação?', opts: ['Sim, tenho documentos','Tenho apenas fotos','Não tenho nenhum documento','Não sei'] },
    { id: 'ee_cidade', q: 'Qual a cidade do imóvel?', type: 'text', placeholder: 'Ex: Recife, Olinda, Caruaru...' }
  ],
  'Aumento de Carga': [
    { id: 'ac_motivo', q: 'Qual o motivo do aumento de carga?', opts: ['Ar-condicionado','Câmara fria','Elevador','Maquinário industrial','Expansão do imóvel','Disjuntor desarmando','Outro','Não sei'] },
    { id: 'ac_carga', q: 'Sabe a carga aproximada necessária?', opts: ['Até 20 kW','21 a 50 kW','51 a 75 kW','Acima de 75 kW','Não sei'], alert75: true },
    { id: 'ac_fase', q: 'A ligação atual é mono, bi, trifásica ou média tensão?', opts: ['Monofásica','Bifásica','Trifásica','Média tensão','Não sei'] },
    { id: 'ac_docs', q: 'Tem conta de energia ou lista de equipamentos?', opts: ['Sim, tenho conta de energia','Sim, tenho lista de equipamentos','Tenho ambos','Não tenho nenhum'] }
  ],
  'Subestação Elétrica': [
    { id: 'sub_tipo_emp', q: 'Tipo de empreendimento:', opts: ['Condomínio','Indústria','Comércio/Shopping','Galpão','Hospital','Supermercado','Loteamento','Outro'] },
    { id: 'sub_potencia', q: 'Potência estimada:', opts: ['75 kVA','112,5 kVA','150 kVA','225 kVA','300 kVA','500 kVA','Acima de 500 kVA','Não sei'] },
    { id: 'sub_tipo', q: 'Tipo de subestação:', opts: ['Aérea','Abrigada','Cabine primária','Não sei'] },
    { id: 'sub_fase', q: 'Em que fase está o projeto?', opts: ['Pesquisando','Com projeto elaborado','Obra já iniciada','Concessionária solicitou','Regularização','Não sei'] },
    { id: 'sub_necessidade', q: 'Precisa de:', opts: ['Projeto','Aprovação na Neoenergia','Execução/instalação','Regularização','Projeto + Execução completa','Não sei'] }
  ],
  'Laudos Técnicos': [
    { id: 'lau_tipo', q: 'Qual tipo de laudo precisa?', opts: ['Instalação elétrica','NR-10','AVCB / Bombeiros','Seguradora','SPDA','Aterramento','Termografia','Teste de isolamento','Não sei'] },
    { id: 'lau_objetivo', q: 'Objetivo do laudo:', opts: ['AVCB / Bombeiros','Seguro','Auditoria','Regularização','Vistoria','Segurança preventiva','Outro','Não sei'] },
    { id: 'lau_docs', q: 'Possui documentação técnica do imóvel?', opts: ['Sim','Não','Parcialmente','Não sei'] },
    { id: 'lau_urgencia', q: 'Existe urgência para o laudo?', opts: ['Sim, urgente','Prazo de até 15 dias','Prazo de até 30 dias','Sem urgência','Não sei'] }
  ],
  'SPDA / Para-raios': [
    { id: 'spda_existente', q: 'Já existe SPDA instalado no local?', opts: ['Sim','Não','Não sei'] },
    { id: 'spda_necessidade', q: 'Precisa de:', opts: ['Projeto','Instalação','Laudo','Adequação','Manutenção','Não sei'] },
    { id: 'spda_edificacao', q: 'Tipo de edificação:', opts: ['Residencial','Comercial','Industrial','Condomínio','Hospital/Escola','Outro','Não sei'] },
    { id: 'spda_art', q: 'Precisa de ART?', opts: ['Sim','Não','Não sei'] }
  ],
  'Aterramento': [
    { id: 'at_necessidade', q: 'Precisa de:', opts: ['Projeto','Execução/instalação','Medição','Laudo com ART','Correção de aterramento','Não sei'] },
    { id: 'at_para', q: 'Aterramento para qual finalidade?', opts: ['Instalação elétrica','SPDA','Subestação','Energia solar','Indústria','Condomínio','Outro','Não sei'] },
    { id: 'at_existente', q: 'Já existe aterramento instalado?', opts: ['Sim','Não','Não sei'] }
  ],
  'Rede Aérea': [
    { id: 'rede_tipo', q: 'Precisa de rede aérea, subterrânea ou ainda está avaliando?', opts: ['Rede aérea','Rede subterrânea','Ambas','Ainda estou avaliando','Não sei'] },
    { id: 'rede_emp', q: 'Tipo de empreendimento:', opts: ['Loteamento','Condomínio','Área rural','Indústria','Galpão','Obra pública','Outro'] },
    { id: 'rede_tensao', q: 'Rede em qual tensão?', opts: ['Baixa tensão','Média tensão 13,8 kV','Ambas','Não sei'] },
    { id: 'rede_etapa', q: 'Precisa de:', opts: ['Projeto','Aprovação na Neoenergia','Construção','Postes e transformadores','Iluminação pública','Energização','Tudo (projeto a energização)','Não sei'] }
  ],
  'Deslocamento de Rede': [
    { id: 'desl_tipo', q: 'O que precisa?', opts: ['Deslocar poste','Deslocar rede','Deslocar padrão','Estender rede até o terreno','Não sei'] },
    { id: 'desl_motivo', q: 'Qual o motivo?', opts: ['Construção','Garagem/entrada','Loteamento','Ampliação','Poste em local inadequado','Exigência da concessionária','Outro'] },
    { id: 'desl_rede_proxima', q: 'Existe rede elétrica próxima ao local?', opts: ['Sim','Não','Não sei'] },
    { id: 'desl_fotos', q: 'Tem fotos ou localização do local?', opts: ['Sim, tenho fotos','Sim, tenho localização','Tenho ambos','Não tenho'] }
  ],
  'Extensão de Rede': [
    { id: 'ext_tipo', q: 'O que precisa?', opts: ['Deslocar poste','Deslocar rede','Deslocar padrão','Estender rede até o terreno','Não sei'] },
    { id: 'ext_motivo', q: 'Qual o motivo?', opts: ['Construção','Garagem/entrada','Loteamento','Ampliação','Poste em local inadequado','Exigência da concessionária','Outro'] },
    { id: 'ext_rede_proxima', q: 'Existe rede elétrica próxima ao local?', opts: ['Sim','Não','Não sei'] },
    { id: 'ext_fotos', q: 'Tem fotos ou localização do local?', opts: ['Sim, tenho fotos','Sim, tenho localização','Tenho ambos','Não tenho'] }
  ],
  'Quadro de Distribuição': [
    { id: 'qd_tipo', q: 'Precisa montar quadro novo ou adequar quadro existente?', opts: ['Montar quadro novo','Adequar quadro existente','Não sei'] },
    { id: 'qd_problema', q: 'Existe algum problema atual?', opts: ['Aquecimento','Disjuntor desarmando','Cabos desorganizados','Falta de identificação','Falta de espaço','Nenhum problema, é instalação nova','Outro','Não sei'] },
    { id: 'qd_art', q: 'Precisa de projeto e ART?', opts: ['Sim','Não','Não sei'] }
  ],
  'Modernização Elétrica': [
    { id: 'mod_problema', q: 'Qual o problema atual?', opts: ['Instalação antiga','Queda de energia frequente','Aquecimento nos cabos/quadro','Quadro antigo','Falta de aterramento','Risco de incêndio','Adequação a normas','Outro','Não sei'] },
    { id: 'mod_funcionamento', q: 'O imóvel está em funcionamento?', opts: ['Sim, em uso','Não, está desocupado','Parcialmente em uso'] },
    { id: 'mod_necessidade', q: 'Precisa de:', opts: ['Projeto','Execução','Troca de quadro','Laudo','Aterramento','SPDA','Aumento de carga','Tudo','Não sei'] }
  ],
  'Energia Solar': [
    { id: 'sol_tipo', q: 'Sistema para qual tipo de imóvel?', opts: ['Residência','Comércio','Condomínio','Indústria','Área rural / Agro','Usina solar','Outro'] },
    { id: 'sol_objetivo', q: 'Qual o objetivo?', opts: ['Reduzir conta de luz','Instalar sistema do zero','Ampliar sistema existente','Regularizar sistema','Manutenção','Usina para investimento','Não sei'] },
    { id: 'sol_conta', q: 'Valor médio da conta de luz:', opts: ['Até R$300','R$301 a R$800','R$801 a R$1.500','R$1.501 a R$3.000','Acima de R$3.000','Não sei'], alertSolar: true },
    { id: 'sol_area', q: 'Área disponível para instalação:', opts: ['Telhado','Solo/terreno','Cobertura','Galpão','Não sei'] },
    { id: 'sol_conta_doc', q: 'Já tem conta de energia para análise?', opts: ['Sim','Não','Não sei'] }
  ],
  'Vistoria/Reprovação Neoenergia': [
    { id: 'neo_problema', q: 'O que aconteceu?', opts: ['Projeto reprovado','Vistoria reprovada','Notificação recebida','Padrão irregular','Energia não foi ligada','Exigência de projeto/ART','Não entendi o que aconteceu'] },
    { id: 'neo_doc', q: 'Possui documento da reprovação/notificação?', opts: ['Sim','Não','Não sei'] },
    { id: 'neo_servico', q: 'Qual serviço estava tentando aprovar?', opts: ['Ligação nova','Aumento de carga','Subestação','Extensão de rede','Deslocamento','Outro','Não sei'] },
    { id: 'neo_prazo', q: 'Existe prazo para resolver?', opts: ['Sim, urgente','Sim, até 15 dias','Sim, até 30 dias','Não há prazo definido','Não sei'] }
  ],
  'Instalação Elétrica': [
    { id: 'inst_tipo', q: 'Tipo de instalação:', opts: ['Residencial','Comercial','Industrial','Condomínio','Outro'] },
    { id: 'inst_necessidade', q: 'Precisa de:', opts: ['Instalação completa','Adequação/reforma','Regularização','Manutenção','Não sei'] },
    { id: 'inst_docs', q: 'Possui projeto ou planta?', opts: ['Sim','Não','Não sei'] }
  ],
  'Credenciamento Neoenergia': [
    { id: 'cred_tipo', q: 'O que precisa?', opts: ['Informações sobre credenciamento','Empresa para executar obra credenciada','Projeto com empresa credenciada','Outro','Não sei'] }
  ],
  'A definir': [
    { id: 'ad_desc', q: 'Pode descrever brevemente o que precisa?', type: 'text', placeholder: 'Descreva sua necessidade...' }
  ]
};

/* ── ETAPA 4 — Dados do cliente ── */
var QUIZ_STEP4_FIELDS = [
  { id: 'cli_nome', label: 'Nome *', type: 'text', placeholder: 'Seu nome completo', required: true },
  { id: 'cli_whatsapp', label: 'WhatsApp *', type: 'tel', placeholder: '(81) 99999-9999', required: true },
  { id: 'cli_cidade', label: 'Cidade / UF *', type: 'text', placeholder: 'Ex: Recife - PE', required: true },
  { id: 'cli_bairro', label: 'Bairro ou região', type: 'text', placeholder: 'Ex: Boa Viagem' }
];

var QUIZ_STEP4_PRAZO = {
  id: 'cli_prazo', label: 'Prazo:',
  opts: ['Urgente','Esta semana','Este mês','Ainda pesquisando','Obra futura']
};

var QUIZ_STEP4_DOCS = {
  id: 'cli_docs', label: 'Documentos disponíveis:',
  opts: ['Conta de energia','Fotos do local','Projeto / planta','Notificação','Outro','Nenhum'],
  multi: true
};

/* ── CLASSIFICAÇÃO DE LEAD ── */
function classificarLead(answers) {
  var hot = 0, medium = 0, cold = 0;
  var prazo = answers.cli_prazo || '';
  var servico = answers._servicoProvavel || '';
  var carga = answers.ac_carga || '';
  var conta = answers.sol_conta || '';
  var fase = answers.sub_fase || '';
  var neoProblema = answers.neo_problema || '';
  var subNecessidade = answers.sub_necessidade || '';
  var laudoUrg = answers.lau_urgencia || '';
  var docs = answers.cli_docs || '';

  // Hot conditions
  if (prazo === 'Urgente') hot += 3;
  if (neoProblema && neoProblema !== 'Não sei') hot += 2;
  if (servico === 'Vistoria/Reprovação Neoenergia') hot += 2;
  if (servico === 'Subestação Elétrica') hot += 2;
  if (carga === 'Acima de 75 kW') hot += 2;
  if (conta === 'R$1.501 a R$3.000' || conta === 'Acima de R$3.000') hot += 2;
  if (fase === 'Obra já iniciada') hot += 2;
  if (laudoUrg === 'Sim, urgente') hot += 2;
  if (subNecessidade === 'Projeto + Execução completa') hot += 1;

  // Medium conditions
  if (docs && docs !== 'Nenhum') medium += 1;
  if (prazo === 'Este mês' || prazo === 'Esta semana') medium += 1;
  if (servico && servico !== 'A definir') medium += 1;

  // Cold conditions
  if (prazo === 'Ainda pesquisando' || prazo === 'Obra futura') cold += 2;
  if (docs === 'Nenhum') cold += 1;

  // Count "Não sei" answers
  var naoSeiCount = 0;
  for (var k in answers) {
    if (answers[k] === 'Não sei') naoSeiCount++;
  }
  if (naoSeiCount >= 3) cold += 2;

  if (hot >= 2) return 'quente';
  if (medium >= 2 && cold < 3) return 'medio';
  return 'frio';
}

/* ── EVENTOS DE RASTREAMENTO (GA / GTM) ── */
function quizTrackEvent(eventName, data) {
  try {
    if (window.dataLayer) {
      window.dataLayer.push(Object.assign({ event: eventName }, data || {}));
    }
    if (window.gtag) {
      window.gtag('event', eventName, data || {});
    }
  } catch(e) { /* silently fail */ }
}
