/* ============================================================
   EXITOGRID — SHARED JAVASCRIPT
   Compatible with all static pages
   ============================================================ */

/* --- HEADER SCROLL EFFECT --- */
(function () {
  const header = document.getElementById('site-header');
  if (!header) return;
  const onScroll = () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* --- MOBILE MENU TOGGLE --- */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const toggle = document.getElementById('mobile-toggle');
  if (!menu) return;
  const isOpen = menu.classList.toggle('open');
  if (toggle) toggle.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* --- CLOSE MOBILE MENU ON LINK CLICK --- */
document.addEventListener('DOMContentLoaded', function () {
  const mobileLinks = document.querySelectorAll('#mobile-menu a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      const menu = document.getElementById('mobile-menu');
      const toggle = document.getElementById('mobile-toggle');
      if (menu) menu.classList.remove('open');
      if (toggle) toggle.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
});

/* --- SMOOTH SCROLL (for anchor links on same page) --- */
function scrollToSection(e, selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  e.preventDefault();
  const offset = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* --- REVEAL ANIMATION (IntersectionObserver) --- */
(function () {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

/* --- FAQ ACCORDION --- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', function () {
      const item = this.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      // Open clicked if was closed
      if (!isOpen) item.classList.add('open');
    });
  });

  // Open first FAQ by default
  const firstFaq = document.querySelector('.faq-item');
  if (firstFaq) firstFaq.classList.add('open');
});

/* --- CONTACT FORM (sends to WhatsApp) --- */
function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const nome     = form.querySelector('#nome')?.value || '';
  const telefone = form.querySelector('#telefone')?.value || '';
  const empresa  = form.querySelector('#empresa')?.value || '';
  const servico  = form.querySelector('#servicoEspecifico')?.value ||
                   form.querySelector('#tipoServico')?.value || '';
  const mensagem = form.querySelector('#mensagem')?.value || '';

  const text = encodeURIComponent(
    `Olá, Exitogrid! Sou ${nome} e gostaria de solicitar um orçamento.\n` +
    (empresa ? `Empresa: ${empresa}\n` : '') +
    (servico ? `Serviço: ${servico}\n` : '') +
    `Telefone: ${telefone}\n` +
    `Mensagem: ${mensagem}`
  );
  window.open(`https://wa.me/5581988906429?text=${text}`, '_blank');
  if(typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'WhatsApp_Form' });

  // Show success
  const successEl = document.getElementById('form-success');
  if (successEl) {
    form.style.display = 'none';
    successEl.style.display = 'block';
  }
}

/* --- SERVICE SELECT CASCADING (home page) --- */
const SERVICOS_DATA = {
  'Projetos Elétricos': [
    'Projeto de Entrada de Energia',
    'Projeto de Subestação',
    'Projeto de Rede Aérea',
    'Projeto de Rede Subterrânea',
  ],
  'Instalações': [
    'Instalação de Subestação',
    'Quadro de Distribuição',
    'Sistema de Aterramento',
    'SPDA / Para-Raios',
  ],
  'Melhorias e Extensões': [
    'Aumento de Carga',
    'Deslocamento de Rede',
    'Extensão de Rede',
    'Modernização de Instalações',
  ],
  'Laudos e Vistorias': [
    'Laudo Técnico de Instalação',
    'Laudo de Aterramento',
    'Laudo de SPDA',
    'Vistoria Neoenergia',
    'Credenciamento Neoenergia',
  ],
};

function updateServicoSelect() {
  const cat  = document.getElementById('tipoServico');
  const svc  = document.getElementById('servicoEspecifico');
  if (!cat || !svc) return;
  const opts = SERVICOS_DATA[cat.value] || [];
  svc.innerHTML = '<option value="">Selecione o serviço</option>';
  opts.forEach(o => {
    const el = document.createElement('option');
    el.value = o; el.textContent = o;
    svc.appendChild(el);
  });
  svc.disabled = opts.length === 0;
}

/* Populate category select on load */
document.addEventListener('DOMContentLoaded', function () {
  const cat = document.getElementById('tipoServico');
  if (!cat) return;
  cat.innerHTML = '<option value="">Selecione a categoria</option>';
  Object.keys(SERVICOS_DATA).forEach(k => {
    const el = document.createElement('option');
    el.value = k; el.textContent = k;
    cat.appendChild(el);
  });
});

/* --- SERVICES FILTER (home page) --- */
document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('servicos-grid');
  const filterBar = document.getElementById('servicos-filters');
  if (!grid || !filterBar) return;

  const services = [
    {
      cat: 'Projetos', title: 'Projeto de Entrada de Energia',
      desc: 'Elaboração e aprovação de projetos de entrada de energia junto à Neoenergia em Recife e Pernambuco.',
      summary: 'O projeto de entrada de energia é obrigatório para novas ligações, aumentos de carga e regularizações junto à Neoenergia. A Exitogrid elabora o projeto em conformidade com o Módulo 8 da distribuidora, incluindo memorial descritivo, diagrama unifilar, dimensionamento de cabos e disjuntores, e a ART do engenheiro responsável. Nossa taxa de aprovação na primeira vistoria é de 98%, garantindo agilidade e economia para o cliente.',
      img: 'images/servico-projeto-entrada.jpg', url: '/projeto-entrada-energia/'
    },
    {
      cat: 'Projetos', title: 'Projeto de Subestação',
      desc: 'Projetos de subestações aéreas e abrigadas para média tensão aprovados na Neoenergia.',
      summary: 'Elaboramos projetos completos de subestações aéreas e abrigadas em média tensão (13,8 kV a 138 kV), desde o dimensionamento de transformadores e equipamentos de proteção até os desenhos técnicos exigidos pela Neoenergia. Atuamos em todo o ciclo: projeto, aprovação, execução e energização. Atendemos indústrias, condomínios, shoppings e construtoras em Recife e Pernambuco.',
      img: 'images/servico-subestacao.jpg', url: '/projeto-subestacao/'
    },
    {
      cat: 'Projetos', title: 'Projeto de Rede Aérea',
      desc: 'Projetos elétricos para redes de distribuição aérea, ramais e redes primárias.',
      summary: 'Desenvolvemos projetos de redes de distribuição aérea para loteamentos, condomínios e obras de expansão da rede elétrica. Os projetos incluem dimensionamento de condutores, postes, transformadores e equipamentos de proteção, seguindo os padrões técnicos da Neoenergia Pernambuco. Realizamos também toda a interface junto à concessionária para aprovação e execução das obras.',
      img: 'images/hero-rede-aerea.jpg', url: '/projeto-rede-aerea/'
    },
    {
      cat: 'Projetos', title: 'Projeto de Rede Subterrânea',
      desc: 'Projetos de redes subterrâneas em média tensão com aprovação completa na Neoenergia.',
      summary: 'Projetamos redes de distribuição subterrâneas em baixa e média tensão para empreendimentos que exigem maior segurança e estética, como condomínios fechados, centros comerciais e obras de urbanização. Os projetos contemplam dimensionamento de cabos, dutos, caixas de passagem e equipamentos de proteção, com aprovação garantida na Neoenergia Pernambuco.',
      img: 'images/servico-rede-subterranea.jpg', url: '/projeto-rede-subterranea/'
    },
    {
      cat: 'Instalações', title: 'Instalação de Subestação',
      desc: 'Montagem e energização de subestações aéreas e abrigadas com acompanhamento técnico.',
      summary: 'Além do projeto, a Exitogrid executa a montagem completa de subestações elétricas — desde a fundação e estruturas metálicas até a instalação de transformadores, cubículos de média tensão, sistemas de proteção e aterramento. Todo o processo é acompanhado por engenheiros especializados, e realizamos os testes de comissionamento e a energização junto à Neoenergia.',
      img: 'images/servico-subestacao-aerea.jpg', url: '/instalacao-subestacao/'
    },
    {
      cat: 'Instalações', title: 'Quadro de Distribuição',
      desc: 'Instalação e adequação de quadros de distribuição prediais e industriais.',
      summary: 'Realizamos a instalação, substituição e adequação de quadros de distribuição residenciais, prediais e industriais, em conformidade com as normas NBR 5410 e NBR 61439. O serviço inclui dimensionamento de disjuntores, barramentos e proteções, além da instalação de quadros de medição e proteção. Emitimos laudo técnico e ART ao final de cada serviço.',
      img: 'images/servico-quadro-distribuicao.jpg', url: '/quadro-distribuicao/'
    },
    {
      cat: 'Instalações', title: 'Sistema de Aterramento',
      desc: 'Projeto e instalação de sistemas de aterramento conforme NBR 5410 e NBR 7117.',
      summary: 'O sistema de aterramento é fundamental para a segurança elétrica de qualquer instalação. A Exitogrid projeta e instala sistemas de aterramento para edificações residenciais, comerciais e industriais, seguindo as normas NBR 5410 e NBR 7117. Realizamos medição de resistência de aterramento com equipamento homologado e emitimos laudo técnico com ART para fins de regularização e seguros.',
      img: 'images/servico-aterramento.jpg', url: '/sistema-aterramento/'
    },
    {
      cat: 'Instalações', title: 'SPDA / Para-Raios',
      desc: 'Projeto e instalação de sistemas de proteção contra descargas atmosféricas (SPDA).',
      summary: 'O Sistema de Proteção contra Descargas Atmosféricas (SPDA) é obrigatório por lei para diversas categorias de edificações. A Exitogrid realiza o estudo de risco conforme a NBR 5419, projeta e instala captores, descidas e malha de aterramento, garantindo proteção eficaz contra raios. Emitimos laudo técnico e ART, essenciais para seguros e licenças do Corpo de Bombeiros.',
      img: 'images/servico-spda.jpg', url: '/spda-para-raios/'
    },
    {
      cat: 'Melhorias', title: 'Aumento de Carga',
      desc: 'Ampliação de capacidade elétrica com aprovação na Neoenergia Pernambuco.',
      summary: 'O aumento de carga é necessário quando a demanda elétrica de um imóvel supera a capacidade contratada. A Exitogrid elabora o projeto técnico de aumento de carga, submete à Neoenergia, acompanha todo o processo de aprovação e executa as adequações necessárias na instalação — incluindo ramal de entrada, medição e quadros. Atendemos clientes em Recife e em toda Pernambuco.',
      img: 'images/hero-aumento-carga.jpg', url: '/aumento-carga/'
    },
    {
      cat: 'Melhorias', title: 'Deslocamento de Rede',
      desc: 'Remanejamento de redes elétricas aéreas e subterrâneas para obras e ampliações.',
      summary: 'O deslocamento de rede elétrica é necessário quando postes ou cabos interferem em obras de construção civil, ampliações de vias ou outros empreendimentos. A Exitogrid, como empresa credenciada pela Neoenergia Tipos 1 a 6, realiza todo o processo: projeto, aprovação e execução do remanejamento, garantindo agilidade e conformidade com as normas técnicas da distribuidora.',
      img: 'images/hero-deslocamento-rede.jpg', url: '/deslocamento-rede/'
    },
    {
      cat: 'Melhorias', title: 'Extensão de Rede',
      desc: 'Extensão de redes elétricas para atendimento de novos loteamentos e empreendimentos.',
      summary: 'A extensão de rede é necessária para levar energia elétrica a novas áreas, loteamentos, condomínios e empreendimentos rurais ou urbanos. A Exitogrid elabora o projeto de extensão de rede aérea ou subterrânea, submete à Neoenergia e executa a obra com equipe própria. Todo o processo é acompanhado por engenheiros credenciados, garantindo aprovação ágil e execução segura.',
      img: 'images/hero-extensao-rede.jpg', url: '/extensao-rede/'
    },
    {
      cat: 'Melhorias', title: 'Modernização de Instalações',
      desc: 'Atualização de instalações elétricas antigas para conformidade com normas vigentes.',
      summary: 'Instalações elétricas antigas representam risco de incêndio, choque elétrico e falhas frequentes. A Exitogrid realiza a modernização completa de instalações residenciais, comerciais e industriais, substituindo fiações, disjuntores, aterramentos e quadros por componentes modernos em conformidade com a NBR 5410. O serviço inclui laudo técnico e ART para regularização do imóvel.',
      img: 'images/hero-modernizacao.jpg', url: '/modernizacao-instalacoes/'
    },
    {
      cat: 'Laudos', title: 'Laudo Técnico de Instalação',
      desc: 'Laudos técnicos elétricos para fins de regularização, seguro e licenças.',
      summary: 'O laudo técnico de instalação elétrica é exigido por seguradoras, prefeituras, bombeiros e em processos de locação e venda de imóveis. A Exitogrid realiza a inspeção completa da instalação elétrica, identificando não conformidades, e emite laudo técnico detalhado com ART do engenheiro responsável. O documento tem validade legal e é reconhecido por todos os órgãos competentes em Pernambuco.',
      img: 'images/servico-laudo.jpg', url: '/laudo-tecnico-instalacao/'
    },
    {
      cat: 'Laudos', title: 'Laudo de Aterramento',
      desc: 'Medição e laudo de sistema de aterramento conforme normas ABNT.',
      summary: 'O laudo de aterramento é exigido para fins de seguro, licença do Bombeiros e adequação às normas ABNT. A Exitogrid realiza a medição da resistência de aterramento com equipamento calibrado (Megger), avalia a conformidade do sistema com as normas NBR 5410 e NBR 7117 e emite laudo técnico com ART. O serviço é realizado por engenheiros especializados em Recife e todo Pernambuco.',
      img: 'images/servico-medicao.jpg', url: '/laudo-aterramento/'
    },
    {
      cat: 'Laudos', title: 'Laudo de SPDA',
      desc: 'Inspeção e laudo do sistema de proteção contra descargas atmosféricas.',
      summary: 'O laudo de SPDA é obrigatório para renovação de seguros, licenças do Corpo de Bombeiros e conformidade com a NBR 5419. A Exitogrid realiza a inspeção completa do para-raios — captores, descidas, conexões e malha de aterramento — e emite laudo técnico com ART identificando as condições do sistema e recomendações de adequação quando necessário.',
      img: 'images/servico-spda.jpg', url: '/laudo-spda/'
    },
    {
      cat: 'Laudos', title: 'Vistoria Neoenergia',
      desc: 'Acompanhamento e aprovação em vistorias da Neoenergia para novas ligações.',
      summary: 'A vistoria da Neoenergia é a etapa final para aprovação de novas ligações elétricas, aumento de carga e regularização de instalações. A Exitogrid prepara a instalação para atender a todos os requisitos técnicos da distribuidora e acompanha o vistoriador durante a inspeção. Nossa taxa de aprovação de 98% na primeira vistoria garante economia de tempo e evita custos com readequações.',
      img: 'images/servico-projeto-entrada.jpg', url: '/vistoria-neoenergia/'
    },
  ];

  const categories = ['Todos', ...new Set(services.map(s => s.cat))];
  let current = 'Todos';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === 'Todos' ? ' active' : '');
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      current = cat;
      document.querySelectorAll('#servicos-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderServices();
    });
    filterBar.appendChild(btn);
  });

  function renderServices() {
    const filtered = current === 'Todos' ? services : services.filter(s => s.cat === current);
    grid.innerHTML = '';
    grid.className = 'servicos-grid reveal visible';
    filtered.forEach((s, i) => {
      const card = document.createElement('article');
      card.className = 'servico-card reveal visible';
      card.innerHTML = `
        <div class="servico-img">
          <img src="${s.img}" alt="${s.title} em Recife e Pernambuco" loading="lazy">
          <div class="servico-img-overlay"></div>
          <span class="servico-cat">${s.cat}</span>
        </div>
        <div class="servico-body">
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
          <button class="servico-modal-btn" aria-label="Ver detalhes de ${s.title}">
            Ver detalhes
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>`;
      card.querySelector('.servico-modal-btn').addEventListener('click', () => openServiceModal(s));
      grid.appendChild(card);
    });
  }

  renderServices();

  /* ---- MODAL SYSTEM ---- */
  // Create modal overlay once
  const overlay = document.createElement('div');
  overlay.id = 'service-modal-overlay';
  overlay.className = 'service-modal-overlay';
  overlay.innerHTML = `
    <div class="service-modal" role="dialog" aria-modal="true" id="service-modal">
      <button class="service-modal-close" id="service-modal-close" aria-label="Fechar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <div class="service-modal-img-wrap">
        <img id="service-modal-img" src="" alt="">
        <div class="service-modal-img-overlay"></div>
        <span class="service-modal-cat" id="service-modal-cat"></span>
      </div>
      <div class="service-modal-content">
        <h3 id="service-modal-title"></h3>
        <p id="service-modal-summary"></p>
        <div class="service-modal-actions">
          <a id="service-modal-wa" href="https://wa.me/5581988906429?text=Ol%C3%A1%2C%20Exitogrid!%20Gostaria%20de%20falar%20com%20um%20engenheiro." target="_blank" class="btn btn-whatsapp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.552 4.109 1.516 5.833L.022 23.978l6.284-1.647A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892c-1.99 0-3.85-.538-5.444-1.476l-.39-.232-4.046 1.061 1.08-3.943-.255-.404A9.847 9.847 0 0 1 2.108 12C2.108 6.53 6.53 2.108 12 2.108c5.47 0 9.892 4.422 9.892 9.892 0 5.47-4.422 9.892-9.892 9.892z"/></svg>
            Fale com um Engenheiro
          </a>
          <a href="#contato" id="service-modal-orcamento" class="btn btn-orange">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="m22 2-11 11"/></svg>
            Faça seu Orçamento
          </a>
          <a id="service-modal-saibamais" href="#" class="btn btn-outline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Saiba Mais
          </a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Close handlers
  document.getElementById('service-modal-close').addEventListener('click', closeServiceModal);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeServiceModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeServiceModal();
  });

  // Orcamento button scrolls smoothly
  document.getElementById('service-modal-orcamento').addEventListener('click', function(e) {
    closeServiceModal();
    const el = document.querySelector('#contato');
    if (el) {
      e.preventDefault();
      setTimeout(() => {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 200);
    }
  });

  function openServiceModal(s) {
    document.getElementById('service-modal-img').src = s.img;
    document.getElementById('service-modal-img').alt = s.title;
    document.getElementById('service-modal-cat').textContent = s.cat;
    document.getElementById('service-modal-title').textContent = s.title;
    document.getElementById('service-modal-summary').textContent = s.summary;
    const waText = encodeURIComponent(`Olá, Exitogrid! Gostaria de falar com um engenheiro sobre ${s.title}.`);
    document.getElementById('service-modal-wa').href = `https://wa.me/5581988906429?text=${waText}`;
    document.getElementById('service-modal-saibamais').href = s.url;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeServiceModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* --- FAQ DATA (home page) --- */
document.addEventListener('DOMContentLoaded', function () {
  const list = document.getElementById('faq-list');
  const filterBar = document.getElementById('faq-filters');
  if (!list) return;

  const faqs = [
    { cat: 'Projetos', q: 'Quanto tempo leva para aprovar um projeto na Neoenergia?', a: 'O prazo varia conforme o tipo de projeto. Projetos simples de entrada de energia levam de 15 a 30 dias úteis. Subestações ou extensões de rede podem levar de 45 a 90 dias. A Exitogrid acompanha todo o processo em Recife e Pernambuco, reduzindo ao máximo os prazos.' },
    { cat: 'Projetos', q: 'Quais documentos são necessários para aprovar um projeto elétrico?', a: 'Em geral são necessários: planta do imóvel, matrícula, dados do proprietário, memorial descritivo e ART do engenheiro responsável. A Exitogrid orienta cada cliente sobre os documentos específicos de cada tipo de projeto junto à Neoenergia.' },
    { cat: 'Carga', q: 'Preciso de projeto para aumentar a carga elétrica em Pernambuco?', a: 'Sim. Para aumentar a carga é obrigatório elaborar projeto técnico e submetê-lo à Neoenergia para análise e aprovação. A Exitogrid realiza todo o processo em Recife e demais cidades de PE, desde o projeto até a aprovação final.' },
    { cat: 'Carga', q: 'O que é o Módulo 8 da Neoenergia?', a: 'O Módulo 8 é o conjunto de normas técnicas da Neoenergia que estabelece os requisitos para acesso de unidades consumidoras ao sistema elétrico. Todo projeto de entrada de energia em Pernambuco deve estar em conformidade com o Módulo 8. A Exitogrid é especialista nessas normas.' },
    { cat: 'Subestação', q: 'Qual o valor médio para instalar uma subestação em Recife?', a: 'Subestações aéreas compactas partem de R$ 15.000, enquanto subestações abrigadas industriais podem ultrapassar R$ 150.000. O valor depende da potência, tipo e local de instalação. A Exitogrid realiza estudo técnico sem custo para projetos em Recife e Pernambuco.' },
    { cat: 'Subestação', q: 'Qual a diferença entre subestação aérea e abrigada?', a: 'A subestação aérea é montada em postes e é mais econômica, indicada para áreas abertas. A abrigada é instalada em ambiente fechado (casa de força), oferece maior proteção e é exigida em algumas situações pela Neoenergia. A escolha depende da demanda, local e normas aplicáveis.' },
    { cat: 'SPDA', q: 'Quando o SPDA (para-raios) é obrigatório?', a: 'O SPDA é obrigatório conforme a NBR 5419 em edificações acima de determinada altura, estruturas com alto risco de descarga, antenas, depósitos de inflamáveis e locais com grande concentração de pessoas. A Exitogrid realiza o estudo de risco para verificar a necessidade.' },
    { cat: 'Credenciamento', q: 'O que significa a Exitogrid ser credenciada Neoenergia Tipos 1 a 6?', a: 'O credenciamento Neoenergia significa que a Exitogrid está habilitada a executar obras na rede da concessionária. Os tipos vão de 1 (serviços em baixa tensão) a 6 (obras de maior complexidade em média tensão). Somos uma das poucas empresas em Pernambuco com credenciamento completo Tipos 1 a 6.' },
  ];

  const categories = ['Todas', ...new Set(faqs.map(f => f.cat))];
  let current = 'Todas';

  if (filterBar) {
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn' + (cat === 'Todas' ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        current = cat;
        document.querySelectorAll('#faq-filters .filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFaqs();
      });
      filterBar.appendChild(btn);
    });
  }

  function renderFaqs() {
    const filtered = current === 'Todas' ? faqs : faqs.filter(f => f.cat === current);
    list.innerHTML = '';
    filtered.forEach((f, i) => {
      list.innerHTML += `
        <div class="faq-item reveal visible${i === 0 ? ' open' : ''}">
          <div class="faq-question" onclick="this.closest('.faq-item').classList.toggle('open')">
            <span>${f.q}</span>
            <div class="faq-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
          </div>
          <div class="faq-answer"><p>${f.a}</p></div>
        </div>`;
    });
  }

  renderFaqs();
});

/* ============================================================
   GLASSMORPHISM POPUP SYSTEM
   Triggers: time-based, exit-intent, page-specific
   ============================================================ */
(function () {
  'use strict';

  const WHATSAPP = '5581988906429';

  /* --- SVG icons --- */
  const ICONS = {
    question: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    exit: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    bolt: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    file: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    shield: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9,12 11,14 15,10"/></svg>',
    whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.552 4.109 1.516 5.833L.022 23.978l6.284-1.647A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.892c-1.99 0-3.85-.538-5.444-1.476l-.39-.232-4.046 1.061 1.08-3.943-.255-.404A9.847 9.847 0 0 1 2.108 12C2.108 6.53 6.53 2.108 12 2.108c5.47 0 9.892 4.422 9.892 9.892 0 5.47-4.422 9.892-9.892 9.892z"/></svg>'
  };

  /* --- Popup definitions --- */
  const POPUPS = {
    /* Popup 1 — Time-based (25-35s) for Home + service pages */
    specialist: {
      id: 'popup-specialist',
      icon: ICONS.question,
      title: 'Não sabe qual projeto elétrico precisa?',
      text: 'Fale com um especialista da Exitogrid e descubra o caminho correto para ligação, aumento de carga, subestação ou regularização junto à Neoenergia.',
      cta: 'Falar com especialista no WhatsApp',
      ctaClass: '',
      waText: 'Olá, Exitogrid! Não tenho certeza qual projeto elétrico preciso. Podem me orientar?',
      dismiss: 'Agora não, obrigado',
      trigger: 'time',
      delay: 28000,
      pages: ['/', '/index.html', '/projeto-entrada-energia/', '/projeto-subestacao/', '/aumento-carga/']
    },

    /* Popup 2 — Exit intent (all pages) */
    exitIntent: {
      id: 'popup-exit',
      icon: ICONS.exit,
      title: 'Antes de sair: sua obra pode precisar de aprovação na Neoenergia',
      text: 'Evite reprovação, retrabalho e atraso na energização. Envie sua dúvida e receba uma orientação inicial.',
      cta: 'Enviar minha dúvida',
      ctaClass: 'popup-cta--orange',
      waText: 'Olá, Exitogrid! Tenho uma dúvida sobre aprovação de projeto na Neoenergia. Podem me ajudar?',
      dismiss: 'Vou explorar mais o site',
      trigger: 'exit',
      pages: ['*']
    },

    /* Popup 3 — Subestação (5s) */
    subestacao: {
      id: 'popup-subestacao',
      icon: ICONS.bolt,
      title: 'Sua demanda passa de 75 kW?',
      text: 'Sua empresa, condomínio ou indústria pode precisar de subestação em média tensão. Solicite uma análise antes de comprar equipamentos ou iniciar a obra.',
      cta: 'Analisar minha demanda',
      ctaClass: '',
      waText: 'Olá, Exitogrid! Minha demanda pode passar de 75 kW. Gostaria de uma análise para subestação em média tensão.',
      dismiss: 'Continuar lendo',
      trigger: 'time',
      delay: 5000,
      pages: ['/projeto-subestacao/', '/instalacao-subestacao/']
    },

    /* Popup 4 — Entrada de Energia (5s) */
    entrada: {
      id: 'popup-entrada',
      icon: ICONS.file,
      title: 'Vai pedir ligação nova ou regularizar energia?',
      text: 'A Exitogrid prepara o projeto de entrada de energia com ART e acompanha o processo até aprovação.',
      cta: 'Solicitar projeto com ART',
      ctaClass: '',
      waText: 'Olá, Exitogrid! Preciso de um projeto de entrada de energia com ART. Podem me ajudar?',
      dismiss: 'Continuar lendo',
      trigger: 'time',
      delay: 5000,
      pages: ['/projeto-entrada-energia/']
    },

    /* Popup 5 — Laudos (5s) */
    laudos: {
      id: 'popup-laudos',
      icon: ICONS.shield,
      title: 'Sua empresa precisa de laudo com ART?',
      text: 'Evite problemas com AVCB, seguro, NR-10 e auditorias. Solicite um laudo técnico elétrico com inspeção profissional.',
      cta: 'Solicitar laudo elétrico',
      ctaClass: '',
      waText: 'Olá, Exitogrid! Preciso de um laudo técnico elétrico com ART. Podem me ajudar?',
      dismiss: 'Continuar lendo',
      trigger: 'time',
      delay: 5000,
      pages: ['/laudo-tecnico-instalacao/', '/laudo-aterramento/', '/laudo-spda/']
    }
  };

  /* --- Utility: build popup HTML --- */
  function buildPopupHTML(cfg) {
    return `
      <div class="popup-overlay" id="${cfg.id}" role="dialog" aria-modal="true" aria-label="${cfg.title}">
        <div class="popup-glass">
          <div class="popup-particles">
            <div class="popup-particle"></div>
            <div class="popup-particle"></div>
            <div class="popup-particle"></div>
            <div class="popup-particle"></div>
            <div class="popup-particle"></div>
          </div>
          <button class="popup-close" aria-label="Fechar popup" data-popup-close="${cfg.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
          <div class="popup-icon-wrap">
            <div class="popup-icon">${cfg.icon}</div>
          </div>
          <div class="popup-content">
            <h3>${cfg.title}</h3>
            <p>${cfg.text}</p>
            <a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(cfg.waText)}"
               target="_blank" rel="noopener"
               class="popup-cta ${cfg.ctaClass}">
              ${ICONS.whatsapp}
              ${cfg.cta}
            </a>
            <button class="popup-dismiss" data-popup-close="${cfg.id}">${cfg.dismiss}</button>
          </div>
        </div>
      </div>`;
  }

  /* --- Utility: show popup --- */
  function showPopup(id) {
    const el = document.getElementById(id);
    if (!el || sessionStorage.getItem('popup_' + id)) return false;
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
    sessionStorage.setItem('popup_' + id, '1');
    return true;
  }

  /* --- Utility: close popup --- */
  function closePopup(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* --- Check if current page matches --- */
  function matchesPage(pages) {
    const path = window.location.pathname.replace(/index\.html$/, '');
    if (pages.includes('*')) return true;
    return pages.some(p => {
      const normalized = p.replace(/index\.html$/, '');
      return path === normalized || path === normalized.slice(0, -1) || path + '/' === normalized;
    });
  }

  /* --- Initialize on DOM ready --- */
  document.addEventListener('DOMContentLoaded', function () {
    /* Determine which popups apply to this page */
    const applicable = [];
    Object.keys(POPUPS).forEach(key => {
      const cfg = POPUPS[key];
      if (matchesPage(cfg.pages)) {
        applicable.push(cfg);
      }
    });

    if (applicable.length === 0) return;

    /* Inject popup HTML */
    const container = document.createElement('div');
    container.id = 'popup-system';
    applicable.forEach(cfg => {
      container.insertAdjacentHTML('beforeend', buildPopupHTML(cfg));
    });
    document.body.appendChild(container);

    /* Close handlers */
    container.addEventListener('click', function (e) {
      /* Close button or dismiss */
      const closeBtn = e.target.closest('[data-popup-close]');
      if (closeBtn) {
        closePopup(closeBtn.dataset.popupClose);
        return;
      }
      /* Click on overlay background */
      if (e.target.classList.contains('popup-overlay')) {
        closePopup(e.target.id);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const openPopup = container.querySelector('.popup-overlay.active');
        if (openPopup) closePopup(openPopup.id);
      }
    });

    /* --- Set up triggers --- */
    let popupShownThisSession = false;

    /* Time-based triggers (pick the most specific one first) */
    const timePopups = applicable
      .filter(c => c.trigger === 'time')
      .sort((a, b) => (a.delay || 0) - (b.delay || 0));

    /* Page-specific (5s) popups have priority over generic (28s) */
    const specificTime = timePopups.filter(c => !c.pages.includes('*') && c.pages.length <= 3);
    const genericTime = timePopups.filter(c => c.pages.includes('*') || c.pages.length > 3);

    /* Show the most specific time popup first */
    const primaryTimePopup = specificTime[0] || genericTime[0];
    if (primaryTimePopup && !sessionStorage.getItem('popup_' + primaryTimePopup.id)) {
      setTimeout(() => {
        if (!popupShownThisSession) {
          if (showPopup(primaryTimePopup.id)) {
            popupShownThisSession = true;
          }
        }
      }, primaryTimePopup.delay || 5000);
    }

    /* If no specific popup, try the generic one after its delay */
    if (!specificTime[0] && genericTime[0] && !sessionStorage.getItem('popup_' + genericTime[0].id)) {
      setTimeout(() => {
        if (!popupShownThisSession) {
          if (showPopup(genericTime[0].id)) {
            popupShownThisSession = true;
          }
        }
      }, genericTime[0].delay || 28000);
    }

    /* Exit-intent triggers */
    const exitPopups = applicable.filter(c => c.trigger === 'exit');
    if (exitPopups.length > 0) {
      const exitCfg = exitPopups[0];

      if (!sessionStorage.getItem('popup_' + exitCfg.id)) {
        /* Desktop: mouse leaves viewport via top */
        let exitEnabled = false;
        setTimeout(() => { exitEnabled = true; }, 8000); /* Wait 8s before enabling */

        document.addEventListener('mouseout', function (e) {
          if (!exitEnabled || popupShownThisSession) return;
          if (e.clientY <= 5 && !e.relatedTarget && !e.toElement) {
            if (showPopup(exitCfg.id)) {
              popupShownThisSession = true;
            }
          }
        });

        /* Mobile: detect back button intent via history */
        if ('ontouchstart' in window) {
          let touchTimeout;
          setTimeout(() => {
            /* After 15s on mobile, show exit popup if user hasn't interacted much */
            window.addEventListener('pagehide', function () {
              if (!popupShownThisSession) {
                showPopup(exitCfg.id);
              }
            });
          }, 15000);
        }
      }
    }
  });
})();


/* Quiz v2 loaded from quiz.js */


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
    el.addEventListener('click', () => {
      if(typeof gtag === 'function') gtag('event', 'contact', { method: 'WhatsApp_Click' });
    });
  });
});
