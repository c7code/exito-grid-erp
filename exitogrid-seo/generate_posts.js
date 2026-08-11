const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');

const posts = [
  {
    slug: 'aprovacao-rapida-projetos-neoenergia',
    cat: 'Neoenergia',
    title: 'Dicas para Aprovação Rápida de Projetos na Neoenergia',
    desc: 'Evite reprovações e atrase na sua obra. Conheça as melhores dicas para garantir a aprovação do seu projeto elétrico na Neoenergia.',
    img: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Julho 2026',
    time: '8 min',
    h1: 'Dicas para Aprovação Rápida de Projetos na Neoenergia',
    body: '<h2>Por que os projetos atrasam?</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Dica:</strong> A maioria das reprovações ocorre por falhas simples na documentação ou falta de detalhamento no diagrama unifilar.</p></div>' +
          '<p>Aprovar um projeto elétrico na Neoenergia requer atenção estrita às normas técnicas (NDUs). Qualquer divergência entre o projeto enviado e a realidade da obra resultará em diligências e atrasos.</p>' +
          '<h2>Passo a passo para garantir a aprovação</h2>' +
          '<ul>' +
          '<li><strong>Documentação Completa:</strong> Envie ART, laudos e formulários preenchidos corretamente.</li>' +
          '<li><strong>Adequação às NDUs:</strong> Siga a NDU aplicável (ex: NDU 001 para baixa tensão, NDU 002 para média tensão).</li>' +
          '<li><strong>Estudo de Carga:</strong> O quadro de cargas deve estar perfeitamente balanceado.</li>' +
          '<li><strong>Contrate um Especialista:</strong> Empresas credenciadas como a Exitogrid conhecem os atalhos legais para uma aprovação rápida.</li>' +
          '</ul>' +
          '<h2>Integração com Energia Solar</h2>' +
          '<p>Se o seu projeto inclui energia fotovoltaica, as regras mudam. Certifique-se de apresentar o projeto de micro ou minigeração junto com o projeto de entrada de energia.</p>'
  },
  {
    slug: 'como-escolher-empresa-engenharia-eletrica-pe',
    cat: 'Projetos',
    title: 'Como Escolher a Melhor Empresa de Engenharia Elétrica em PE',
    desc: 'Critérios essenciais na hora de contratar uma empresa para executar ou projetar sua instalação elétrica industrial ou comercial.',
    img: 'https://images.unsplash.com/photo-1581092335397-9583eb92d232?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Julho 2026',
    time: '7 min',
    h1: 'Como Escolher a Melhor Empresa de Engenharia Elétrica em Pernambuco',
    body: '<h2>A importância da escolha certa</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Alerta:</strong> Contratar profissionais não qualificados pode resultar em multas, incêndios e reprovação na concessionária.</p></div>' +
          '<p>Uma instalação elétrica comercial ou industrial exige um nível técnico altíssimo. Uma boa empresa de engenharia não apenas executa o serviço, mas planeja a longo prazo.</p>' +
          '<h2>5 Critérios para Contratação</h2>' +
          '<ul>' +
          '<li><strong>Credenciamento na Concessionária:</strong> Verifique se a empresa é credenciada na Neoenergia (como a Exitogrid).</li>' +
          '<li><strong>Corpo Técnico:</strong> Exija engenheiros eletricistas com registro ativo no CREA.</li>' +
          '<li><strong>Experiência Comprovada:</strong> Peça portfólio de obras similares, especialmente subestações e cabines primárias.</li>' +
          '<li><strong>Seguro e Garantia:</strong> Boas empresas oferecem garantia documentada dos serviços prestados.</li>' +
          '<li><strong>Atendimento a Normas:</strong> A empresa deve seguir a NBR 5410, NBR 14039 e NR-10 estritamente.</li>' +
          '</ul>' +
          '<p>Com a Exitogrid, você tem a segurança de uma empresa experiente e credenciada nos tipos 1 a 6 em todo o estado de PE.</p>'
  },
  {
    slug: 'importancia-manutencao-preditiva-paineis',
    cat: 'Subestações',
    title: 'A Importância da Manutenção Preditiva em Painéis Elétricos',
    desc: 'Descubra como a manutenção preditiva pode evitar paradas inesperadas e economizar dinheiro para sua indústria.',
    img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Julho 2026',
    time: '6 min',
    h1: 'Manutenção Preditiva em Painéis Elétricos: Economia e Segurança',
    body: '<h2>O que é manutenção preditiva?</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Conceito:</strong> A manutenção preditiva monitora as condições reais dos equipamentos elétricos para prever falhas antes que elas aconteçam.</p></div>' +
          '<p>Diferente da manutenção preventiva (que ocorre em datas agendadas) ou da corretiva (quando o equipamento já quebrou), a preditiva atua baseada na "saúde" do painel.</p>' +
          '<h2>Ferramentas Utilizadas</h2>' +
          '<ul>' +
          '<li><strong>Termografia:</strong> Identifica pontos quentes causados por mau contato ou sobrecarga.</li>' +
          '<li><strong>Análise de Qualidade de Energia:</strong> Detecta harmônicos e oscilações de tensão.</li>' +
          '<li><strong>Ultrassom:</strong> Detecta fugas elétricas e descargas parciais (efeito corona).</li>' +
          '</ul>' +
          '<h2>Por que aplicar em sua empresa?</h2>' +
          '<p>Paradas de produção custam muito caro. Além disso, falhas em painéis de média tensão podem causar acidentes graves. Investir em manutenção preditiva com uma empresa especializada garante continuidade operacional.</p>'
  },
  {
    slug: 'qgbt-quadro-geral-baixa-tensao-funcao',
    cat: 'Projetos',
    title: 'O que é QGBT (Quadro Geral de Baixa Tensão) e sua Função',
    desc: 'Entenda o que é o QGBT, seus principais componentes e por que ele é o coração da distribuição elétrica da sua empresa.',
    img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Julho 2026',
    time: '5 min',
    h1: 'QGBT (Quadro Geral de Baixa Tensão): O Coração da Instalação',
    body: '<h2>O papel do QGBT</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Função:</strong> O QGBT recebe a energia da subestação (ou da rua) e distribui para todos os quadros secundários da edificação de forma segura.</p></div>' +
          '<p>O Quadro Geral de Baixa Tensão é, sem dúvida, um dos componentes mais críticos de uma instalação elétrica comercial ou industrial.</p>' +
          '<h2>Componentes Principais</h2>' +
          '<ul>' +
          '<li><strong>Disjuntor Geral:</strong> Proteção principal contra curtos-circuitos e sobrecargas.</li>' +
          '<li><strong>Barramentos:</strong> Barras de cobre que conduzem a corrente para os disjuntores de saída.</li>' +
          '<li><strong>DPS:</strong> Dispositivos de Proteção contra Surtos (raios).</li>' +
          '<li><strong>Multimedidores:</strong> Medem grandezas elétricas (tensão, corrente, fator de potência).</li>' +
          '</ul>' +
          '<h2>Normas Construtivas</h2>' +
          '<p>Os QGBTs modernos devem atender à norma NBR IEC 61439, garantindo proteção contra toques acidentais e suportabilidade a curtos-circuitos (Icc).</p>'
  },
  {
    slug: 'passo-a-passo-regularizar-instalacao-comercio',
    cat: 'Projetos',
    title: 'Passo a Passo para Regularizar a Instalação Elétrica do seu Comércio',
    desc: 'Guia prático para obter aprovação do Corpo de Bombeiros e Neoenergia ao abrir ou reformar seu estabelecimento.',
    img: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Julho 2026',
    time: '9 min',
    h1: 'Passo a Passo para Regularizar a Instalação Elétrica do seu Comércio em PE',
    body: '<h2>Evite multas e interdições</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Importante:</strong> Instalações irregulares são o principal motivo de interdição pelo Corpo de Bombeiros e cortes pela concessionária.</p></div>' +
          '<p>Abrir ou reformar um comércio exige que a rede elétrica esteja de acordo com as normas vigentes, garantindo a segurança de clientes e funcionários.</p>' +
          '<h2>Passo a Passo</h2>' +
          '<ul>' +
          '<li><strong>1. Avaliação Técnica:</strong> Contrate um engenheiro para inspecionar a rede atual (se for reforma).</li>' +
          '<li><strong>2. Projeto Elétrico As-Built:</strong> Tenha as plantas e o diagrama unifilar atualizados.</li>' +
          '<li><strong>3. Laudos Obrigatórios:</strong> Emita o Laudo Técnico de Instalações Elétricas e o Laudo de Aterramento.</li>' +
          '<li><strong>4. Adequação NR-10:</strong> Instale placas de sinalização e proteções contra contatos diretos nos quadros.</li>' +
          '<li><strong>5. Aprovação:</strong> Envie os laudos e ARTs para o Corpo de Bombeiros (AVCB) e Neoenergia (se houver alteração de carga).</li>' +
          '</ul>' +
          '<p>Na Exitogrid, resolvemos toda a burocracia para você.</p>'
  },
  {
    slug: 'diferencas-laudo-spda-aterramento',
    cat: 'Laudos',
    title: 'As Diferenças Entre Laudo SPDA e Laudo de Aterramento',
    desc: 'Entenda as diferenças técnicas e legais entre os dois documentos, e saiba quando sua empresa precisa de cada um.',
    img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Junho 2026',
    time: '7 min',
    h1: 'Laudo SPDA vs Laudo de Aterramento: Quais as Diferenças?',
    body: '<h2>Conceitos Diferentes, Objetivos Complementares</h2>' +
          '<div class="article-highlight"><p><strong>⚡ SPDA:</strong> Protege o prédio contra raios. <strong>Aterramento:</strong> Protege pessoas contra choques e equipamentos contra surtos internos.</p></div>' +
          '<p>É muito comum confundir o Laudo do SPDA (Para-raios) com o Laudo de Aterramento Elétrico, mas eles atestam sistemas distintos.</p>' +
          '<h2>Laudo de SPDA (NBR 5419)</h2>' +
          '<ul>' +
          '<li>Inspeciona captores, descidas, malha de aterramento e DPS.</li>' +
          '<li>Obrigatório anualmente ou trienalmente (dependendo do uso do prédio).</li>' +
          '<li>Focado na proteção estrutural contra descargas atmosféricas.</li>' +
          '</ul>' +
          '<h2>Laudo de Aterramento (NBR 5410 e NBR 15749)</h2>' +
          '<ul>' +
          '<li>Mede a resistência ôhmica do solo e a continuidade das massas.</li>' +
          '<li>Obrigatório para segurança ocupacional (NR-10).</li>' +
          '<li>Focado na proteção contra choques elétricos e perfeito funcionamento de máquinas.</li>' +
          '</ul>'
  },
  {
    slug: 'energia-solar-areas-rurais-viabilidade',
    cat: 'Energia Solar',
    title: 'Energia Solar em Áreas Rurais de PE: Viabilidade e Custos',
    desc: 'Saiba como propriedades rurais e agronegócios em Pernambuco estão zerando a conta de luz com fazendas solares.',
    img: 'https://images.unsplash.com/photo-1509391366360-120953a15866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Junho 2026',
    time: '8 min',
    h1: 'Energia Solar para o Agronegócio e Áreas Rurais em Pernambuco',
    body: '<h2>Uma solução para o campo</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Economia:</strong> O sol intenso no interior de PE aliado a grandes áreas disponíveis tornam o agro o cenário perfeito para a geração solar.</p></div>' +
          '<p>Fazendas, irrigação, avicultura e laticínios sofrem com altos custos de energia. A implantação de painéis solares rurais tem um Retorno de Investimento (Payback) extremamente rápido.</p>' +
          '<h2>Vantagens e Viabilidade</h2>' +
          '<ul>' +
          '<li><strong>Uso de Áreas Inutilizadas:</strong> Instalação em solo, aproveitando terras sem plantio.</li>' +
          '<li><strong>Bombeamento Solar:</strong> Sistemas que não precisam sequer estar conectados à rede elétrica.</li>' +
          '<li><strong>Financiamento Facilitado:</strong> Linhas de crédito como o Pronaf e Banco do Nordeste com juros muito baixos.</li>' +
          '</ul>' +
          '<p>A Exito Sun, braço de energia solar da Exitogrid, elabora o projeto completo de usinas solares rurais, garantindo a aprovação rápida na concessionária.</p>'
  },
  {
    slug: 'demanda-ultrapassada-como-evitar-multas',
    cat: 'Economia',
    title: 'O que é Demanda Ultrapassada e Como Evitar Multas',
    desc: 'Sofrendo com multas na conta de luz? Aprenda a gerenciar a demanda contratada da sua empresa junto à Neoenergia.',
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Junho 2026',
    time: '7 min',
    h1: 'Como Evitar Multas por Demanda de Energia Ultrapassada',
    body: '<h2>O Custo de Ultrapassar a Demanda</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Atenção:</strong> A multa por ultrapassar a demanda contratada pode custar até 3 vezes mais caro do que a tarifa normal.</p></div>' +
          '<p>Para clientes do Grupo A (Média e Alta Tensão), é necessário fechar um contrato de demanda com a Neoenergia. Se a empresa consumir mais do que o estipulado (com tolerância de 5%), é taxada fortemente.</p>' +
          '<h2>Como Evitar e Resolver</h2>' +
          '<ul>' +
          '<li><strong>Monitoramento em Tempo Real:</strong> Instalar multimedidores para acompanhar picos de consumo.</li>' +
          '<li><strong>Gestão de Cargas:</strong> Evitar ligar grandes motores simultaneamente.</li>' +
          '<li><strong>Aumento de Carga (Revisão Contratual):</strong> Se a empresa cresceu, é preciso adequar o contrato e, em muitos casos, o projeto da subestação.</li>' +
          '</ul>' +
          '<p>Nossa equipe técnica pode realizar um estudo de demanda e propor o melhor cenário tarifário para reduzir os custos fixos da sua conta de luz.</p>'
  },
  {
    slug: 'modernizacao-subestacoes-quando-vale-pena',
    cat: 'Subestações',
    title: 'Modernização de Subestações: Quando Vale a Pena?',
    desc: 'Sua cabine primária é muito antiga? Veja os sinais de que é hora de investir em modernização (Retrofit) e aumentar a segurança.',
    img: 'https://images.unsplash.com/photo-1542396601-dca920ea2807?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Junho 2026',
    time: '10 min',
    h1: 'Retrofit e Modernização de Subestações: Vale o Investimento?',
    body: '<h2>Cabines Primárias Antigas são um Risco</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Retrofit:</strong> Atualizar componentes críticos da subestação melhora a segurança e evita paradas inesperadas da indústria.</p></div>' +
          '<p>Subestações com mais de 20 anos costumam utilizar disjuntores a óleo e reles eletromecânicos, que já não atendem as rigorosas normas de segurança atuais (NR-10 e NBR 14039).</p>' +
          '<h2>Sinais que é Hora de Modernizar</h2>' +
          '<ul>' +
          '<li>Frequentes atuações indevidas dos relés de proteção.</li>' +
          '<li>Vazamentos de óleo no transformador ou disjuntor.</li>' +
          '<li>Dificuldade de encontrar peças de reposição (obsolescência).</li>' +
          '<li>Aumento da necessidade de carga, exigindo novos painéis.</li>' +
          '</ul>' +
          '<h2>Vantagens do Retrofit</h2>' +
          '<p>A substituição de disjuntores a óleo por disjuntores a vácuo e relés digitais garante tempos de resposta muito mais rápidos, salvando vidas e protegendo os equipamentos no caso de curtos-circuitos.</p>'
  },
  {
    slug: 'dicas-economia-energia-industrias-verao',
    cat: 'Economia',
    title: 'Dicas de Economia de Energia para Indústrias no Verão',
    desc: 'Com o aumento do calor em PE, o consumo industrial sobe. Veja estratégias para otimizar o uso da energia elétrica.',
    img: 'https://images.unsplash.com/photo-1513828583688-c52646db42da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Junho 2026',
    time: '6 min',
    h1: 'Dicas de Economia de Energia para Indústrias no Verão Pernambucano',
    body: '<h2>O desafio do calor</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Eficiência:</strong> No verão, os sistemas de refrigeração chegam a representar mais de 40% da conta de luz industrial.</p></div>' +
          '<p>Com as altas temperaturas em Recife e no interior, compressores e chillers trabalham no limite, disparando o consumo.</p>' +
          '<h2>Estratégias Práticas</h2>' +
          '<ul>' +
          '<li><strong>Manutenção de Chillers:</strong> Limpeza de serpentinas e filtros melhora a troca térmica.</li>' +
          '<li><strong>Inversores de Frequência:</strong> Instale inversores em motores de ventilação e bombeamento.</li>' +
          '<li><strong>Iluminação LED Inteligente:</strong> Aproveite a luz natural instalando telhas translúcidas e sensores de presença.</li>' +
          '<li><strong>Correção do Fator de Potência:</strong> O calor pode aumentar as perdas; garantir bancos de capacitores operantes é vital.</li>' +
          '<li><strong>Geração Própria:</strong> Instalar energia solar no telhado dos galpões abate consideravelmente a conta.</li>' +
          '</ul>'
  },
  {
    slug: 'nr35-nr10-seguranca-trabalho-eletrica',
    cat: 'Normas',
    title: 'NR-35 e NR-10: Segurança no Trabalho em Altura e Elétrica',
    desc: 'Conheça as normas fundamentais para profissionais do setor elétrico e como garantir um ambiente seguro na sua obra.',
    img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Maio 2026',
    time: '9 min',
    h1: 'NR-10 e NR-35: Pilares da Segurança em Instalações Elétricas',
    body: '<h2>Risco Duplo: Eletricidade e Altura</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Vida:</strong> Trabalhos em redes aéreas, subestações e postes reúnem os dois maiores riscos ocupacionais do país.</p></div>' +
          '<p>As Normas Regulamentadoras NR-10 (Segurança em Eletricidade) e NR-35 (Trabalho em Altura) são mandatórias para qualquer empresa de engenharia elétrica.</p>' +
          '<h2>Garantindo a Conformidade</h2>' +
          '<ul>' +
          '<li><strong>Treinamento:</strong> Profissionais devem ter certificados válidos (reciclagem bienal).</li>' +
          '<li><strong>EPI e EPC:</strong> Uso rigoroso de cintos tipo paraquedista, talabartes, luvas isolantes, capacetes com jugular e vestimenta antichama.</li>' +
          '<li><strong>Análise de Risco (APR):</strong> Nenhuma atividade inicia sem preenchimento e aprovação da APR e PT (Permissão de Trabalho).</li>' +
          '<li><strong>Procedimentos de Desenergização:</strong> A regra de ouro (seccionamento, impedimento, constatação, aterramento, proteção e sinalização) salva vidas.</li>' +
          '</ul>' +
          '<p>Na Exitogrid, segurança não é custo, é valor inegociável.</p>'
  },
  {
    slug: 'processo-extensao-rede-eletrica-neoenergia',
    cat: 'Neoenergia',
    title: 'O Processo de Extensão de Rede Elétrica: Prazos e Custos',
    desc: 'Vai lotear um terreno ou sua fábrica fica longe da rede? Entenda como funciona o pedido de extensão de rede na Neoenergia.',
    img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Maio 2026',
    time: '8 min',
    h1: 'Como Funciona a Extensão de Rede Elétrica em PE',
    body: '<h2>Quando a extensão é necessária?</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Prazos:</strong> OBRAS de extensão de rede são complexas, exigem projeto na concessionária e podem levar meses. Planeje-se!</p></div>' +
          '<p>Loteamentos, galpões logísticos ou indústrias recém-construídas muitas vezes não possuem rede elétrica de média tensão passando em frente ao local. Nesses casos, o projeto de extensão (ou obra com participação financeira) é exigido.</p>' +
          '<h2>Passo a Passo</h2>' +
          '<ul>' +
          '<li><strong>Estudo de Viabilidade Técnica (EVT):</strong> Consulta prévia à Neoenergia sobre a disponibilidade do ponto de conexão.</li>' +
          '<li><strong>Projeto Elétrico:</strong> Criação do projeto de rede aérea de distribuição (MT/BT), seguindo rigorosos padrões da distribuidora.</li>' +
          '<li><strong>Aprovação e Orçamento:</strong> A Neoenergia aprova o projeto e define qual parcela da obra é de responsabilidade da concessionária e qual é do cliente (participação financeira).</li>' +
          '<li><strong>Execução e Doação:</strong> O cliente executa a obra com empresa credenciada (como a Exitogrid) e, em muitos casos, "doa" o trecho para a concessionária administrar.</li>' +
          '</ul>'
  },
  {
    slug: 'fator-potencia-multas-como-corrigir',
    cat: 'Economia',
    title: 'O que é Fator de Potência e Por Que Ele Causa Multas?',
    desc: 'Descubra o que é energia reativa excedente, por que ela gera multas pesadas e como corrigir o fator de potência com capacitores.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Maio 2026',
    time: '10 min',
    h1: 'Multas por Fator de Potência: O que é e Como Resolver',
    body: '<h2>O vilão silencioso da conta de luz</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Normativa:</strong> A ANEEL determina que o Fator de Potência (FP) das instalações industriais e comerciais deve ser no mínimo 0,92.</p></div>' +
          '<p>Muitas empresas recebem cobranças por "Energia Reativa Excedente" (UFER) e não sabem do que se trata. Trata-se de uma penalidade por ineficiência energética no consumo.</p>' +
          '<h2>O que é Energia Reativa?</h2>' +
          '<p>Motores, transformadores, soldas e lâmpadas de descarga criam campos magnéticos. Essa energia gasta para "criar" o magnetismo não realiza trabalho (não gira o motor), apenas ocupa espaço na rede. É a energia reativa.</p>' +
          '<h2>Como Corrigir?</h2>' +
          '<ul>' +
          '<li><strong>Bancos de Capacitores:</strong> A instalação de bancos de capacitores automáticos perto do QGBT compensa essa energia reativa localmente, "limpando" a rede.</li>' +
          '<li><strong>Dimensionamento correto de motores:</strong> Evite motores superdimensionados operando em vazio.</li>' +
          '</ul>' +
          '<p>Investir em um banco de capacitores tem payback incrivelmente rápido, de 3 a 6 meses.</p>'
  },
  {
    slug: 'cuidados-instalacao-eletrica-condominios-antigos',
    cat: 'Projetos',
    title: 'Cuidados com a Instalação Elétrica em Condomínios Antigos',
    desc: 'Aumento de aparelhos de ar-condicionado sobrecarrega a rede. Veja quando o condomínio precisa de retrofit elétrico.',
    img: 'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Maio 2026',
    time: '7 min',
    h1: 'Retrofit Elétrico em Condomínios Residenciais Antigos',
    body: '<h2>O limite da infraestrutura</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Alerta para Síndicos:</strong> Fiações antigas (prédios anos 70/80) não foram projetadas para suportar ar-condicionado split em todos os quartos, cooktops e chuveiros modernos.</p></div>' +
          '<p>O aumento descontrolado da carga em prédios antigos resulta em curtos-circuitos frequentes, quedas de disjuntores no centro de medição (PC) e sério risco de incêndio.</p>' +
          '<h2>Como Resolver?</h2>' +
          '<ul>' +
          '<li><strong>Projeto de Aumento de Carga:</strong> O condomínio precisa contratar um engenheiro para reestudar as cargas e solicitar à Neoenergia um aumento na capacidade fornecida.</li>' +
          '<li><strong>Reforma do PC (Centro de Medição):</strong> Troca de barramentos antigos, disjuntores desatualizados (NEMA para DIN) e quadros metálicos enferrujados.</li>' +
          '<li><strong>Prumadas:</strong> Substituição dos cabos que sobem pelo fosso do elevador (shafts) até os apartamentos.</li>' +
          '</ul>' +
          '<p>Síndico, a responsabilidade civil por acidentes elétricos no prédio é sua. Previna-se com um Laudo Técnico das Instalações.</p>'
  },
  {
    slug: 'vantagens-relatorio-termografico-instalacoes',
    cat: 'Laudos',
    title: 'Vantagens do Relatório Termográfico em Instalações Elétricas',
    desc: 'Entenda como a termografia detecta pontos quentes antes que virem falhas graves e curtos-circuitos no seu painel elétrico.',
    img: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    date: 'Maio 2026',
    time: '6 min',
    h1: 'Relatório Termográfico: Prevenção com Tecnologia de Ponta',
    body: '<h2>Vendo o invisível</h2>' +
          '<div class="article-highlight"><p><strong>⚡ Termografia:</strong> O uso de câmeras térmicas infravermelhas permite identificar pontos de aquecimento excessivo (pontos quentes) sem desligar a energia.</p></div>' +
          '<p>Conexões frouxas, desbalanceamento de fases e componentes desgastados geram calor. A olho nu, tudo parece normal, até que ocorre o incêndio. A termografia previne isso.</p>' +
          '<h2>Principais Vantagens</h2>' +
          '<ul>' +
          '<li><strong>Segurança:</strong> Inspeção feita com o painel energizado, sem contato direto (distância segura).</li>' +
          '<li><strong>Prevenção:</strong> Identificação de falhas incipientes; a correção é agendada para evitar paradas na produção.</li>' +
          '<li><strong>Exigência das Seguradoras:</strong> Muitas apólices de seguro contra incêndio exigem relatórios termográficos anuais.</li>' +
          '<li><strong>Redução de Custos:</strong> Consertos programados custam infinitamente menos que emergências e perdas de maquinário.</li>' +
          '</ul>' +
          '<p>Solicite uma inspeção termográfica com a equipe técnica da Exitogrid e proteja seu patrimônio.</p>'
  }
];

const templatePath = path.join(blogDir, 'cabine-primaria-subestacao-guia', 'index.html');
const templateHtml = fs.readFileSync(templatePath, 'utf8');

posts.forEach(post => {
  const postDir = path.join(blogDir, post.slug);
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }

  let newHtml = templateHtml;
  
  newHtml = newHtml.replace(/<title>.*?<\/title>/g, '<title>' + post.title + ' | Exitogrid</title>');
  newHtml = newHtml.replace(/<meta name="description" content="[^"]*">/g, '<meta name="description" content="' + post.desc + '">');
  newHtml = newHtml.replace(/<link rel="canonical" href="[^"]*">/g, '<link rel="canonical" href="https://exitogrid.com.br/blog/' + post.slug + '/">');
  newHtml = newHtml.replace(/<meta property="og:title" content="[^"]*">/g, '<meta property="og:title" content="' + post.title + '">');
  newHtml = newHtml.replace(/<meta property="og:url" content="[^"]*">/g, '<meta property="og:url" content="https://exitogrid.com.br/blog/' + post.slug + '/">');
  
  newHtml = newHtml.replace(/<span class="breadcrumb-current">.*?<\/span>/g, '<span class="breadcrumb-current">' + post.cat + '</span>');
  newHtml = newHtml.replace(/<div class="hero-badge"[^>]*><span>.*?<\/span><\/div>/g, '<div class="hero-badge" style="display:inline-flex;margin-bottom:16px"><span>' + post.cat + '</span></div>');
  newHtml = newHtml.replace(/<h1[^>]*>.*?<\/h1>/g, '<h1 style="font-size:clamp(1.5rem,3.5vw,2.5rem)">' + post.h1 + '</h1>');
  
  const metaRegex = /<div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap">.*?<\/div><\/div><\/section>/s;
  const newMeta = '<div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap">\\n' +
                  '<span style="font-size:.82rem;color:#94a3b8">📅 ' + post.date + '</span><span style="font-size:.82rem;color:#94a3b8">⏱ ' + post.time + ' leitura</span><span style="font-size:.82rem;color:#94a3b8">✍️ Exitogrid</span>\\n' +
                  '</div></div></section>';
  newHtml = newHtml.replace(metaRegex, newMeta);

  const bodyRegex = /<div class="article-body">.*?<aside class="article-sidebar">/s;
  const newBody = '<div class="article-body">\\n' +
                  '<img src="' + post.img + '" alt="' + post.slug + '" class="article-hero-img" loading="lazy">\\n' +
                  post.body + '\\n' +
                  '<div class="cta-banner" style="margin-top:48px">\\n' +
                  '<h3>Precisa de suporte com instalações elétricas ou aprovação?</h3>\\n' +
                  '<p style="color:#fff">A Exitogrid oferece soluções completas e engenharia credenciada na Neoenergia.</p>\\n' +
                  '<div class="cta-buttons"><a href="/#contato" class="btn btn-outline-white">Solicitar Orçamento</a><a href="https://wa.me/5581988906429" target="_blank" class="btn btn-whatsapp">Falar com Especialista</a></div>\\n' +
                  '</div>\\n</div>\\n<aside class="article-sidebar">';
  
  newHtml = newHtml.replace(bodyRegex, newBody);

  fs.writeFileSync(path.join(postDir, 'index.html'), newHtml);
  console.log('Created: ' + post.slug);
});
console.log('Done creating 15 posts.');
