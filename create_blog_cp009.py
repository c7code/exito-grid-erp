import os

html_content = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- SEO -->
<title>Consulta Pública 009/2026 da ANEEL: O Que Muda para Quem Tem Solar</title>
<meta name="description" content="Entenda as principais mudanças da Consulta Pública 009/2026 da ANEEL. Saiba o que muda para as baterias (BESS), fiscalização de ampliações, curtailment e o impacto em quem já possui energia solar.">
<link rel="canonical" href="https://exitogrid.com.br/blog/consulta-publica-009-2026-aneel-muda-quem-tem-solar/">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="author" content="Exitogrid Engenharia Elétrica">
<meta name="keywords" content="Consulta Pública 009/2026 ANEEL, regras energia solar 2026, GD ANEEL, curtailment energia solar, baterias BESS on grid, fiscalização energia solar neoenergia, via expressa microgeração">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="Consulta Pública 009/2026 da ANEEL: O Que Muda para Quem Tem Solar">
<meta property="og:description" content="A ANEEL lançou a CP 009/2026 mudando as regras da Geração Distribuída. Veja como isso afeta seu sistema atual, a fiscalização de inversores e as novas regras para baterias.">
<meta property="og:url" content="https://exitogrid.com.br/blog/consulta-publica-009-2026-aneel-muda-quem-tem-solar/">
<meta property="og:image" content="https://exitogrid.com.br/images/consulta-publica-009-2026-aneel-muda-quem-tem-solar.jpg">
<meta property="og:site_name" content="Exitogrid Engenharia Elétrica">
<meta property="article:published_time" content="2026-09-02">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Consulta Pública 009/2026 da ANEEL: O Que Muda para Quem Tem Solar">
<meta name="twitter:description" content="A ANEEL lançou a CP 009/2026 mudando as regras da Geração Distribuída. Veja como isso afeta seu sistema atual e as baterias.">

<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap" rel="stylesheet">
<link rel="icon" type="image/png" href="/assets/favicon.png">

<!-- Scripts -->
<script defer src="/script.js"></script>

<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "wjwt1riuq0");
</script>
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- Schema: Article -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Consulta Pública 009/2026 da ANEEL: O Que Muda para Quem Tem Solar",
  "description": "Entenda as principais mudanças da Consulta Pública 009/2026 da ANEEL. Saiba o que muda para as baterias (BESS), fiscalização de ampliações, curtailment e o impacto em quem já possui energia solar.",
  "datePublished": "2026-09-02",
  "dateModified": "2026-09-02",
  "author": {"@type": "Organization", "name": "Exitogrid Engenharia Elétrica", "url": "https://exitogrid.com.br"},
  "publisher": {"@type": "Organization", "name": "Exitogrid Engenharia Elétrica", "logo": {"@type": "ImageObject", "url": "https://exitogrid.com.br/assets/logo.png"}},
  "mainEntityOfPage": {"@type": "WebPage", "@id": "https://exitogrid.com.br/blog/consulta-publica-009-2026-aneel-muda-quem-tem-solar/"}
}
</script>
<!-- Schema: FAQ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question", "name": "O que é a Consulta Pública 009/2026 da ANEEL?", "acceptedAnswer": {"@type": "Answer", "text": "É uma proposta de revisão das regras da Geração Distribuída no Brasil, com foco em combater irregularidades (ampliações não homologadas), regular sistemas de armazenamento (BESS) e tratar a inversão de fluxo na rede elétrica."}},
    {"@type": "Question", "name": "O que acontece se eu aumentei meu sistema solar sem avisar a Neoenergia?", "acceptedAnswer": {"@type": "Answer", "text": "A CP 009/2026 prevê uma fiscalização rigorosa (física ou por telemetria). Sistemas com 'overpaneling' irregular poderão perder os benefícios adquiridos, sofrer interrupção imediata (desconexão) ou até pagar multas. É vital regularizar ampliações através de um projeto técnico oficial."}},
    {"@type": "Question", "name": "Como funciona a nova 'via expressa' para microgeração?", "acceptedAnswer": {"@type": "Answer", "text": "Projetos de até 7,5 kW de potência instalada em áreas sem problemas de infraestrutura poderão ser aprovados sem a necessidade de longos estudos de rede, garantindo maior agilidade e menor burocracia para residências e pequenos comércios."}},
    {"@type": "Question", "name": "O que é curtailment na energia solar?", "acceptedAnswer": {"@type": "Answer", "text": "Curtailment é o corte ou redução forçada da geração solar que é injetada na rede da distribuidora. A ANEEL discute implementar isso via inversores inteligentes em momentos críticos de sobrecarga na rede, para evitar o colapso do sistema elétrico local."}},
    {"@type": "Question", "name": "As baterias on-grid (BESS) finalmente terão regulamentação?", "acceptedAnswer": {"@type": "Answer", "text": "Sim, a CP 009/2026 cria regras claras para a homologação de sistemas BESS conectados à rede. Isso permitirá que consumidores utilizem baterias legalmente para fugir do horário de ponta (Peak Shaving), fazer arbitragem de energia ou usar como backup durante quedas."}},
    {"@type": "Question", "name": "Ainda vale a pena ter energia solar após a CP 009/2026?", "acceptedAnswer": {"@type": "Answer", "text": "Sim, a energia solar continua sendo o investimento mais rentável para redução de custos. As novas regras visam apenas organizar e proteger a rede. Com um projeto assinado por empresa credenciada, o consumidor continua garantindo alta economia e segurança jurídica."}}
  ]
}
</script>

<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:#0a0a0f;color:#e2e8f0;overflow-x:hidden;line-height:1.6}
a{color:inherit;text-decoration:none}
img{max-width:100%;height:auto}
.container{max-width:1200px;margin:0 auto;padding:0 24px}

/* HEADER */
.art-header{position:fixed;top:0;left:0;right:0;z-index:1000;height:70px;display:flex;align-items:center;background:rgba(10,10,15,.96);border-bottom:1px solid rgba(255,255,255,.07);backdrop-filter:blur(12px)}
.art-header .container{display:flex;align-items:center;justify-content:space-between;width:100%}
.art-logo img{height:36px;width:auto;display:block}
.art-nav{display:flex;align-items:center;gap:28px}
.art-nav a{font-size:.88rem;font-weight:500;color:#94a3b8;transition:color .2s;white-space:nowrap}
.art-nav a:hover,.art-nav a.active{color:#f97316}
.art-nav-actions{display:flex;align-items:center}
.art-btn-orcamento{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#f97316,#ea6c0c);color:#fff;font-weight:700;font-size:.82rem;padding:9px 18px;border-radius:8px;white-space:nowrap;transition:all .2s;box-shadow:0 4px 16px rgba(249,115,22,.3)}
.art-btn-orcamento:hover{transform:translateY(-1px)}
.art-hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:6px}
.art-hamburger span{display:block;width:24px;height:2px;background:#e2e8f0;border-radius:2px;transition:all .3s}
.art-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.art-hamburger.open span:nth-child(2){opacity:0}
.art-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.art-drawer{display:none;position:fixed;top:0;right:0;bottom:0;width:280px;max-width:85vw;background:#0d1428;border-left:1px solid rgba(249,115,22,.15);z-index:2000;padding:80px 24px 32px;flex-direction:column;overflow-y:auto}
.art-drawer.open{display:flex}
.art-drawer a{display:block;padding:14px 0;font-size:1rem;font-weight:500;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.06);transition:color .2s}
.art-drawer a:hover{color:#f97316}
.art-drawer .art-btn-orcamento{margin-top:20px;justify-content:center;padding:14px;border-radius:10px;font-size:.95rem}
.art-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1999;backdrop-filter:blur(2px)}
.art-overlay.active{display:block}
@media(max-width:920px){.art-nav,.art-nav-actions{display:none}.art-hamburger{display:flex}}

/* HERO */
.article-hero{background:linear-gradient(135deg,#0a0a0f 0%,#0f0a00 50%,#0a0a0f 100%);padding:110px 0 48px;border-bottom:1px solid rgba(234,179,8,.12);position:relative;overflow:hidden}
.article-hero::before{content:'';position:absolute;top:-100px;right:-100px;width:600px;height:600px;background:radial-gradient(circle,rgba(234,179,8,.05),transparent 65%);pointer-events:none}
@media(max-width:768px){.article-hero{padding-top:90px}}
.article-breadcrumb{display:flex;align-items:center;gap:8px;font-size:.8rem;color:#64748b;margin-bottom:24px;flex-wrap:wrap}
.article-breadcrumb a{color:#94a3b8;transition:color .2s}.article-breadcrumb a:hover{color:#f97316}
.article-category-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(234,179,8,.1);border:1px solid rgba(234,179,8,.25);color:#fbbf24;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 12px;border-radius:20px;margin-bottom:20px}
.article-hero h1{font-family:'Outfit',sans-serif;font-size:clamp(1.75rem,4vw,2.8rem);font-weight:900;color:#f0f4ff;line-height:1.15;margin-bottom:20px;max-width:860px}
.article-hero h1 span{color:#fbbf24}
.article-lead{font-size:1.05rem;color:#94a3b8;line-height:1.8;max-width:740px;margin-bottom:28px}
.article-meta-bar{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding-top:20px;border-top:1px solid rgba(255,255,255,.07)}
.article-meta-item{display:flex;align-items:center;gap:6px;font-size:.82rem;color:#64748b}
.article-hero-img{width:100%;max-height:380px;object-fit:cover;border-radius:16px;margin:40px 0 0;border:1px solid rgba(255,255,255,.07)}

/* SNIPPET */
.snippet-box{background:linear-gradient(135deg,#0f0a00,#0d1428);border:1px solid rgba(234,179,8,.3);border-left:5px solid #fbbf24;border-radius:0 14px 14px 0;padding:24px 28px;margin:0 0 40px;position:relative}
.snippet-box::before{content:'💡 Resumo Estratégico';position:absolute;top:-11px;left:16px;background:#d97706;color:#fff;font-size:.7rem;font-weight:700;padding:2px 10px;border-radius:10px;letter-spacing:.06em;text-transform:uppercase}
.snippet-box p{margin:0;color:#cbd5e1;font-size:.97rem;line-height:1.75}
.snippet-box strong{color:#f0f4ff}

/* LAYOUT */
.article-layout{display:grid;grid-template-columns:1fr 300px;gap:48px;padding:56px 0 80px;align-items:start}
@media(max-width:900px){.article-layout{grid-template-columns:1fr;gap:32px}.article-sidebar{order:2}}

/* CONTENT BODY */
.article-content h2{font-family:'Outfit',sans-serif;font-size:clamp(1.2rem,2.5vw,1.55rem);font-weight:800;color:#f0f4ff;margin:52px 0 18px;padding-top:52px;border-top:1px solid rgba(255,255,255,.06);line-height:1.25}
.article-content h2:first-child{margin-top:0;padding-top:0;border-top:none}
.article-content h3{font-size:1.05rem;font-weight:700;color:#cbd5e1;margin:28px 0 10px}
.article-content p{font-size:1rem;color:#94a3b8;line-height:1.85;margin-bottom:18px}
.article-content strong{color:#e2e8f0;font-weight:600}
/* INLINE LINKS */
.article-content .ilink{color:#fbbf24;border-bottom:1px solid rgba(234,179,8,.4);font-weight:500;transition:all .2s}
.article-content .ilink:hover{color:#fde68a;border-bottom-color:rgba(234,179,8,.7)}
.article-content .ilink-orange{color:#fb923c;border-bottom:1px solid rgba(249,115,22,.35);font-weight:500;transition:all .2s}
.article-content .ilink-orange:hover{color:#fed7aa;border-bottom-color:rgba(249,115,22,.65)}
.article-content ul,
.article-content ol{padding-left:20px;margin-bottom:18px;color:#94a3b8;line-height:1.8}
.article-content li{margin-bottom:6px}

/* COMPARE TABLE */
.compare-table{width:100%;border-collapse:collapse;margin:20px 0;font-size:.87rem;background:#0d1428;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.05)}
.compare-table th{background:rgba(234,179,8,.07);color:#fbbf24;font-weight:700;text-align:left;padding:16px;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em}
.compare-table td{padding:14px 16px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,.05);vertical-align:middle;line-height:1.5}
.compare-table tr:last-child td{border-bottom:none}
.compare-table td:first-child{color:#e2e8f0;font-weight:600}

/* PROCESSO STEPS */
.process-steps{display:flex;flex-direction:column;gap:0;position:relative;margin:24px 0}
.process-steps::before{content:'';position:absolute;left:22px;top:44px;bottom:44px;width:2px;background:linear-gradient(180deg,#fbbf24,rgba(234,179,8,.1));z-index:0}
.process-step{display:flex;gap:20px;position:relative;z-index:1;padding-bottom:28px}
.process-step:last-child{padding-bottom:0}
.ps-marker{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#d97706,#fbbf24);color:#0a0a0f;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 4px rgba(234,179,8,.12);position:relative;z-index:1}
.ps-body{flex:1;padding-top:8px}
.ps-badge{display:inline-flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
.ps-timing{font-size:.72rem;font-weight:700;background:rgba(234,179,8,.08);color:#fbbf24;border:1px solid rgba(234,179,8,.2);padding:2px 9px;border-radius:10px}
.ps-who{font-size:.72rem;font-weight:600;color:#64748b}
.ps-body h3{font-size:1rem;font-weight:800;color:#e2e8f0;margin:0 0 8px;line-height:1.3}
.ps-body p{font-size:.9rem;color:#94a3b8;margin:0 0 10px;line-height:1.7}

/* HIGHLIGHT */
.article-highlight{background:linear-gradient(135deg,rgba(234,179,8,.07),rgba(234,179,8,.02));border:1px solid rgba(234,179,8,.2);border-left:4px solid #fbbf24;border-radius:0 12px 12px 0;padding:20px 24px;margin:28px 0}
.article-highlight p{margin:0;color:#cbd5e1;font-size:.95rem}
.article-highlight strong{color:#fbbf24}
.article-highlight.danger{background:rgba(239,68,68,.05);border-color:rgba(239,68,68,.18);border-left-color:#ef4444}
.article-highlight.danger strong{color:#f87171}
.article-highlight.success{background:rgba(34,197,94,.05);border-color:rgba(34,197,94,.18);border-left-color:#22c55e}
.article-highlight.success strong{color:#4ade80}

/* INTERNAL LINK BOX */
.internal-link-box{display:flex;gap:14px;align-items:center;background:linear-gradient(135deg,rgba(234,179,8,.06),rgba(234,179,8,.01));border:1px solid rgba(234,179,8,.18);border-radius:12px;padding:14px 18px;margin:24px 0;transition:all .25s}
.internal-link-box:hover{border-color:rgba(234,179,8,.35);background:rgba(234,179,8,.08)}
.internal-link-box-icon{font-size:1.3rem;flex-shrink:0}
.internal-link-box-body{flex:1}
.internal-link-box-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:3px}
.internal-link-box-title{font-size:.9rem;font-weight:700;color:#fbbf24;line-height:1.35}
.internal-link-box-desc{font-size:.78rem;color:#64748b;margin-top:2px;line-height:1.4}
.internal-link-box-arrow{color:#64748b;font-size:1rem;flex-shrink:0;transition:transform .2s}
.internal-link-box:hover .internal-link-box-arrow{transform:translateX(4px);color:#fbbf24}

/* CTA */
.article-inline-cta{background:linear-gradient(135deg,rgba(249,115,22,.1),rgba(249,115,22,.04));border:1px solid rgba(249,115,22,.25);border-radius:16px;padding:32px;margin:40px 0;text-align:center}
.article-inline-cta h3{font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:800;color:#f0f4ff;margin:0 0 10px}
.article-inline-cta p{color:#94a3b8;font-size:.93rem;margin:0 0 24px}
.cta-buttons-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn-wa-article{display:inline-flex;align-items:center;gap:8px;background:#25d366;color:#fff;font-weight:700;font-size:.9rem;padding:12px 24px;border-radius:10px;transition:all .25s}
.btn-wa-article:hover{background:#22c55e;transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,.3)}
.btn-outline-article{display:inline-flex;align-items:center;gap:8px;background:transparent;color:#f97316;font-weight:700;font-size:.9rem;padding:12px 24px;border-radius:10px;border:1px solid rgba(249,115,22,.4);transition:all .25s}
.btn-outline-article:hover{background:rgba(249,115,22,.08)}

/* AUTHOR */
.article-author{display:flex;align-items:center;gap:16px;background:#0d1428;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:20px;margin:40px 0}
.author-avatar{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#d97706,#fbbf24);display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:900;color:#0a0a0f;flex-shrink:0}
.author-info p{margin:0;font-size:.83rem;color:#64748b}
.author-info strong{font-size:.9rem;color:#e2e8f0;display:block;margin-bottom:2px}

/* FAQ */
.article-faq{margin:48px 0 0}
.article-faq>h2{font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:800;color:#f0f4ff;margin-bottom:24px}
.faq-item{border:1px solid rgba(255,255,255,.07);border-radius:12px;margin-bottom:12px;overflow:hidden;background:#0d1428}
.faq-question{width:100%;background:transparent;border:none;text-align:left;padding:18px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#e2e8f0;font-size:.95rem;font-weight:600;font-family:'Inter',sans-serif;transition:color .2s}
.faq-question:hover{color:#fbbf24}
.faq-icon{width:20px;height:20px;border-radius:50%;background:rgba(234,179,8,.1);border:1px solid rgba(234,179,8,.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .3s;color:#fbbf24}
.faq-answer{padding:0 20px 18px;color:#94a3b8;font-size:.93rem;line-height:1.75;display:none}
.faq-answer a{color:#fbbf24;border-bottom:1px solid rgba(234,179,8,.3)}
.faq-item.open .faq-answer{display:block}
.faq-item.open .faq-icon{transform:rotate(45deg);background:rgba(234,179,8,.2)}

/* SIDEBAR */
.article-sidebar{position:sticky;top:88px}
.sidebar-card{background:linear-gradient(135deg,#0d1428,#0f0a00);border:1px solid rgba(234,179,8,.18);border-radius:16px;padding:24px;margin-bottom:20px}
.sidebar-card h4{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:800;color:#f0f4ff;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.07)}
.sidebar-toc{list-style:none;padding:0;margin:0}
.sidebar-toc li{margin-bottom:8px}
.sidebar-toc a{font-size:.82rem;color:#64748b;display:flex;align-items:center;gap:8px;padding:4px 0;transition:color .2s}
.sidebar-toc a::before{content:'';width:4px;height:4px;border-radius:50%;background:#334155;flex-shrink:0;transition:background .2s}
.sidebar-toc a:hover{color:#fbbf24}.sidebar-toc a:hover::before{background:#fbbf24}
.sidebar-links-box{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.sidebar-link-item{display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:9px;font-size:.82rem;color:#94a3b8;transition:all .2s}
.sidebar-link-item:hover{border-color:rgba(234,179,8,.25);color:#fbbf24;background:rgba(234,179,8,.04)}
.sidebar-link-item span{flex:1}
.sidebar-cta{background:linear-gradient(135deg,rgba(249,115,22,.12),rgba(249,115,22,.03));border:1px solid rgba(249,115,22,.25);border-radius:16px;padding:24px;text-align:center}
.sidebar-cta p{font-size:.85rem;color:#94a3b8;margin:0 0 16px;line-height:1.6}
.sidebar-cta .btn-wa-article{width:100%;justify-content:center;font-size:.85rem;padding:12px 16px}

/* RELATED */
.article-related{padding:48px 0;border-top:1px solid rgba(255,255,255,.06);background:#0a0a0f}
.article-related h2{font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#f0f4ff;margin-bottom:28px}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.related-card{background:#0d1428;border:1px solid rgba(255,255,255,.07);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:all .3s}
.related-card:hover{border-color:rgba(234,179,8,.3);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.3)}
.related-card-img{height:140px;overflow:hidden;background:#111827}
.related-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.related-card:hover .related-card-img img{transform:scale(1.05)}
.related-card-body{padding:16px;flex:1}
.related-card-cat{font-size:.72rem;font-weight:700;color:#fbbf24;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;display:block}
.related-card-body h3{font-size:.9rem;font-weight:700;color:#e2e8f0;margin:0 0 8px;line-height:1.4}
.related-card-body p{font-size:.8rem;color:#64748b;margin:0;line-height:1.5}

/* FOOTER */
.footer{background:#050810;border-top:1px solid rgba(255,255,255,.06);padding:48px 0 24px}
.footer-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:32px;margin-bottom:40px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.footer-grid{grid-template-columns:1fr}}
.footer-brand h3{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:800;color:#f0f4ff;margin:0 0 10px}
.footer-brand p{font-size:.82rem;color:#64748b;line-height:1.6;margin:0 0 16px}
.footer-col h4{font-size:.78rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px}
.footer-links{display:flex;flex-direction:column;gap:8px}
.footer-links a{font-size:.82rem;color:#64748b;transition:color .2s}.footer-links a:hover{color:#f97316}
.footer-bottom{border-top:1px solid rgba(255,255,255,.06);padding-top:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.footer-bottom p{font-size:.78rem;color:#475569}
.footer-social{display:flex;gap:10px;margin-top:12px}
.social-btn{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .2s}
.social-btn:hover{background:rgba(249,115,22,.1);border-color:rgba(249,115,22,.3);color:#f97316}
.float-wa{position:fixed;bottom:28px;right:28px;width:56px;height:56px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(37,211,102,.4);z-index:999;transition:all .3s}
.float-wa:hover{transform:scale(1.1)}
.float-wa-tooltip{position:absolute;right:64px;background:rgba(0,0,0,.8);color:#fff;font-size:.78rem;font-weight:600;padding:6px 12px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s}
.float-wa:hover .float-wa-tooltip{opacity:1}
@media(max-width:640px){.article-hero h1{font-size:1.55rem}.cta-buttons-row{flex-direction:column}}
/* MOBILE DEEP FIX */
@media(max-width:480px){
  .container{padding:0 16px}
  .article-hero h1{font-size:1.4rem}
  .article-lead{font-size:.93rem}
  .snippet-box{padding:18px 16px;font-size:.88rem}
  .snippet-box::before{font-size:.62rem;top:-10px;left:12px}
  .article-content h2{font-size:1.15rem;margin:36px 0 14px;padding-top:36px}
  .article-content p{font-size:.92rem}
  .article-inline-cta{padding:24px 18px}
  .article-inline-cta h3{font-size:1.1rem}
  .article-author{flex-direction:column;text-align:center;gap:12px}
  .faq-question{font-size:.88rem;padding:14px 16px}
  .faq-answer{padding:0 16px 14px;font-size:.86rem}
  .internal-link-box{padding:12px 14px;gap:10px;flex-wrap:wrap}
  .internal-link-box-title{font-size:.84rem}
  .internal-link-box-arrow{display:none}
  .article-meta-bar{gap:12px}
  .article-meta-item{font-size:.75rem}
  .footer-bottom{flex-direction:column;text-align:center}
  .sidebar-card{padding:18px}
  .related-grid{grid-template-columns:1fr}
  .related-card-img{height:120px}
}
@media(max-width:768px){
  .process-steps::before{left:18px}
  .ps-marker{width:36px;height:36px;font-size:.85rem}
  .compare-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}
}

/* SIDEBAR MOBILE FIX */
@media(max-width:768px){
  .article-sidebar{position:static!important;top:auto!important;width:100%!important;max-height:none!important;order:2}
  .sidebar-card,.sidebar-box{position:static!important}
  .article-layout{display:flex!important;flex-direction:column!important}
}
@media(max-width:480px){
  .article-sidebar{margin-top:24px;padding:0}
  .sidebar-card{padding:16px;border-radius:12px}
}
</style>
</head>
<body>

<!-- HEADER -->
<header class="art-header">
  <div class="container">
    <a href="/" class="art-logo"><img src="/assets/logo.png" alt="Exitogrid Engenharia Elétrica" width="150" height="38" loading="eager"></a>
    <nav class="art-nav">
      <a href="/">Home</a><a href="/#servicos">Serviços</a><a href="/aumento-carga/">Aumento de Carga</a>
      <a href="/credenciamento-neoenergia/">Credenciamento</a>
      <a href="/blog/" class="active">Blog</a><a href="/#contato">Contato</a>
    </nav>
    <div class="art-nav-actions">
      <a href="https://wa.me/5581988906429?text=Ol%C3%A1%2C%20Exitogrid!%20Preciso%20de%20ajuda%20para%20adequar%20meu%20projeto%20solar." target="_blank" class="art-btn-orcamento">Solicitar Orçamento</a>
    </div>
    <button class="art-hamburger" id="art-hamburger" aria-label="Abrir menu"><span></span><span></span><span></span></button>
  </div>
</header>
<div class="art-overlay" id="art-overlay"></div>
<nav class="art-drawer" id="art-drawer">
  <a href="/">Home</a><a href="/#servicos">Serviços</a><a href="/aumento-carga/">Aumento de Carga</a>
  <a href="/credenciamento-neoenergia/">Credenciamento</a>
  <a href="/blog/" class="active">Blog</a><a href="/#contato">Contato</a>
  <a href="https://wa.me/5581988906429?text=Ol%C3%A1%2C%20Exitogrid!%20Preciso%20de%20ajuda%20para%20adequar%20meu%20projeto%20solar." target="_blank" class="art-btn-orcamento">Solicitar Orçamento</a>
</nav>

<main>
  <section class="article-hero">
    <div class="container">
      <nav class="article-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><span>Energia Solar</span>
      </nav>
      <div class="article-category-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        Solar · ANEEL
      </div>
      <h1>Consulta Pública 009/2026 da ANEEL: <span>O Que Muda para Quem Tem Solar</span></h1>
      <p class="article-lead">A ANEEL está preparando o terreno para a próxima fase da Geração Distribuída (GD) no Brasil. Com regras mais duras contra o "overpaneling" não declarado, a criação de uma via expressa para sistemas de até 7,5 kW e, pela primeira vez, uma regulação para baterias (BESS). Descubra o que vai mudar, quais são os riscos para quem fez "gatos solares" e como você deve se preparar.</p>
      <div class="article-meta-bar">
        <div class="article-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Setembro de 2026</div>
        <div class="article-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>15 minutos de leitura</div>
        <div class="article-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Eng. Euller Matheus</div>
      </div>
      <img src="/images/consulta-publica-009-2026-aneel-muda-quem-tem-solar.jpg" alt="Consulta Pública 009/2026 ANEEL, regras de energia solar, baterias e GD" class="article-hero-img" loading="eager" onerror="this.style.display='none'">
    </div>
  </section>

  <section style="background:#0a0a0f">
    <div class="container">
      <div class="article-layout">
        <article class="article-content">

          <div class="snippet-box">
            <p><strong>Resumo da CP 009/2026:</strong> A ANEEL publicou a Consulta Pública 009/2026 para revisar pontos críticos da Lei 14.300 (Marco da GD). O objetivo principal é combater irregularidades nas conexões, estabelecendo punições severas para <strong>ampliações sem homologação</strong> (aumento de painéis acima do projeto original). A norma também propõe o <strong>curtailment</strong> (corte forçado de geração) para proteção da rede, regulamenta oficialmente o uso de <strong>baterias (BESS) on-grid</strong>, e cria uma <strong>via expressa</strong> (isenção de estudos complexos) para microgeração de até 7,5 kW. Quem tem instalação fora do padrão precisa correr para <a href="/blog/aprovacao-rapida-projetos-neoenergia/" class="ilink">regularizar seu projeto</a>.</p>
          </div>

          <p>O mercado de energia solar brasileiro nunca para de evoluir. Se você investiu em painéis solares para sua empresa ou residência nos últimos anos, certamente acompanhou a transição do antigo modelo de compensação para a atual Lei 14.300/2022 (o famoso Marco Legal da GD). Mas as regras do jogo estão prestes a receber uma atualização crítica através da <strong>Consulta Pública (CP) 009/2026 da ANEEL</strong>.</p>
          <p>Desta vez, o foco da Agência Nacional de Energia Elétrica não é apenas a taxação do uso do fio, mas sim a <strong>segurança da infraestrutura elétrica, o fim das irregularidades de expansão e a integração de novas tecnologias</strong>, como os sistemas de armazenamento por baterias (BESS). Neste artigo, detalharemos cada ponto dessa proposta, os impactos diretos na sua fatura e o que você precisa fazer para não ser penalizado.</p>

          <h2 id="fiscalizacao-rigorosa">1. O Fim do "Gato Solar": Fiscalização Implacável de Ampliações</h2>
          <p>Um dos problemas mais graves enfrentados pelas distribuidoras (como a Neoenergia em Pernambuco) é o aumento não declarado da potência instalada. Muitos consumidores, após homologarem um sistema de 5 kW, por exemplo, contratam eletricistas informais para adicionar mais painéis ao telhado (prática muitas vezes combinada com a troca do inversor ou um <a href="/energia-solar/" class="ilink-orange">overpaneling</a> extremo) sem comunicar a distribuidora.</p>
          
          <div class="article-highlight danger">
            <p><strong>Risco Iminente:</strong> A CP 009/2026 define que qualquer instalação que apresente injeção de potência na rede superior ao valor outorgado (aprovado em projeto) estará sujeita a severas punições, que incluem a <strong>perda imediata do direito adquirido (as regras antigas de isenção)</strong>, multas retroativas e o desligamento sumário (desconexão da rede) até a regularização.</p>
          </div>

          <p>Com a modernização da medição, as distribuidoras não precisarão mandar um fiscal à sua porta para descobrir a irregularidade. Através da telemetria e da análise do perfil de curva de injeção, os sistemas das concessionárias identificarão automaticamente quando um medidor registrar picos de devolução incompatíveis com o inversor cadastrado.</p>

          <h3>O que fazer se você ampliou seu sistema?</h3>
          <p>Se você aumentou a quantidade de módulos solares ou trocou o inversor sem passar pelo rito de <a href="/blog/como-funciona-aumento-de-carga-neoenergia/" class="ilink">aumento de carga</a> e atualização do projeto na distribuidora, você deve solicitar imediatamente uma atualização cadastral (nova homologação). Contratar uma engenharia especializada para elaborar o projeto e submeter o <em>As-Built</em> atualizado é a única forma de evitar problemas graves.</p>

          <a href="/blog/aprovacao-rapida-projetos-neoenergia/" class="internal-link-box">
            <span class="internal-link-box-icon">⚡</span>
            <div class="internal-link-box-body">
              <div class="internal-link-box-label">Conteúdo Recomendado</div>
              <div class="internal-link-box-title">Dicas para Aprovação Rápida de Projetos na Neoenergia</div>
              <div class="internal-link-box-desc">Descubra como aprovar a regularização do seu sistema solar na Neoenergia sem atrasos ou dores de cabeça burocráticas.</div>
            </div>
            <span class="internal-link-box-arrow">→</span>
          </a>

          <h2 id="regras-baterias">2. Finalmente: A Regulamentação das Baterias (BESS)</h2>
          <p>Até o momento, o uso de baterias de lítio em sistemas conectados à rede (on-grid híbridos) vivia em um limbo regulatório. A ANEEL não tinha clareza sobre como tratar a injeção de energia proveniente de baterias — afinal, a energia armazenada poderia ter sido gerada pelos painéis durante o dia ou sugada da rede durante a madrugada (horário de tarifa barata).</p>
          
          <p>A <strong>Consulta Pública 009/2026</strong> traz, pela primeira vez, diretrizes técnicas para os BESS (<em>Battery Energy Storage Systems</em>). Isso abre um leque gigantesco de oportunidades, especialmente para indústrias e grandes comércios:</p>
          
          <ul>
            <li><strong>Peak Shaving (Corte de Ponta):</strong> Consumidores do Grupo A (Alta Tensão) poderão homologar legalmente sistemas de baterias para suprir o consumo durante o Horário de Ponta (período onde a energia é até 5 vezes mais cara).</li>
            <li><strong>Arbitragem de Energia:</strong> A possibilidade de armazenar energia quando a rede está farta (ou quando seus painéis produzem mais do que você consome) e despachar essa energia de forma programada.</li>
            <li><strong>Aprovação de Inversores Híbridos:</strong> A regra estabelece critérios para a certificação do INMETRO em inversores que gerenciam carga de bateria e injeção na rede de forma simultânea.</li>
          </ul>

          <p>Isso é particularmente útil se o seu projeto de <a href="/projeto-subestacao/" class="ilink">subestação</a> estiver atingindo o limite de demanda contratada. As baterias podem evitar que você pague pesadas multas por ultrapassagem de demanda, absorvendo os picos de consumo de motores e compressores.</p>

          <h2 id="curtailment">3. Curtailment: O Corte Forçado de Geração</h2>
          <p>Em algumas regiões do Nordeste, a concentração de usinas solares e sistemas de GD em telhados é tão grande que, ao meio-dia, há um excesso brutal de energia sendo empurrada para os transformadores da Neoenergia. Isso causa a famosa "inversão de fluxo", sobrecarregando subestações e elevando perigosamente a tensão da rede (fazendo inversores desligarem por sobretensão).</p>
          
          <p>A ANEEL introduz na CP 009 o conceito de <strong>Curtailment</strong> para sistemas de micro e minigeração. Isso significa que, em situações emergenciais de risco para a rede elétrica, a distribuidora terá o poder técnico (via comandos remotos aos inversores inteligentes) de reduzir ou cortar temporariamente a injeção da sua energia na rede.</p>

          <div class="article-highlight">
            <p><strong>Isso é ruim para o meu bolso?</strong> Inicialmente, pode parecer assustador. No entanto, o curtailment é preferível ao cenário atual, onde pedidos de acesso estão sendo totalmente <strong>negados</strong> por falta de infraestrutura. A regra permite que você conecte sua usina em áreas de restrição, desde que aceite que, esporadicamente, a concessionária reduza sua injeção em horários críticos para evitar um colapso local.</p>
          </div>

          <h2 id="via-expressa">4. A "Via Expressa" para Sistemas de até 7,5 kW</h2>
          <p>Para equilibrar o rigor com as usinas maiores, a ANEEL propõe uma facilitação enorme para o cidadão comum. Projetos de Microgeração de até 7,5 kW (que engloba a esmagadora maioria das residências e pequenos negócios) ganharão um "fast-track" ou via expressa de aprovação.</p>
          <p>Nesses casos, a distribuidora não poderá exigir complexos Estudos de Viabilidade Técnica ou análises de inversão de fluxo que demoram meses, desde que o sistema atenda aos requisitos básicos de segurança da entrada de energia. Essa medida deve impulsionar ainda mais a instalação de <a href="/blog/como-funciona-energia-solar-para-empresas-recife/" class="ilink">energia solar em comércios de pequeno porte</a>.</p>

          <div class="article-inline-cta">
            <h3>Seu sistema solar está operando fora das regras?</h3>
            <p>Evite multas pesadas e a perda dos seus benefícios da Lei 14.300. A Exitogrid regulariza seu sistema junto à Neoenergia, garantindo segurança jurídica e técnica para o seu investimento.</p>
            <div class="cta-buttons-row">
              <a href="https://wa.me/5581988906429?text=Ol%C3%A1%2C%20gostaria%20de%20regularizar%20meu%20projeto%20solar%20na%20Neoenergia." class="btn-wa-article" target="_blank">
                Falar com Engenheiro no WhatsApp
              </a>
            </div>
          </div>

          <h2 id="tabela-comparativa">5. Resumo das Mudanças: Regra Atual vs Proposta (CP 009)</h2>
          
          <table class="compare-table">
            <thead>
              <tr>
                <th>Critério</th>
                <th>Regra Atual (Até 2025)</th>
                <th>Proposta (CP 009/2026)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Ampliação Irregular</strong></td>
                <td>Baixa fiscalização. Cliente muitas vezes não é notificado rapidamente.</td>
                <td>Telemetria rigorosa. Multa pesada e perda imediata de direito adquirido.</td>
              </tr>
              <tr>
                <td><strong>Baterias (BESS)</strong></td>
                <td>Falta de regulamentação clara para injeção na rede (zona cinzenta).</td>
                <td>Regras definidas para peak shaving e injeção, exigindo certificação específica.</td>
              </tr>
              <tr>
                <td><strong>Microgeração Pequena (<7,5kW)</strong></td>
                <td>Pode cair na malha fina de estudos de rede, atrasando meses.</td>
                <td>Via Expressa: aprovação rápida sem estudos de inversão de fluxo complexos.</td>
              </tr>
              <tr>
                <td><strong>Injeção de Energia</strong></td>
                <td>O consumidor injeta tudo o que gera incondicionalmente.</td>
                <td><strong>Curtailment:</strong> a distribuidora pode limitar a injeção via inversor em horários críticos.</td>
              </tr>
              <tr>
                <td><strong>Inversores</strong></td>
                <td>Configurações padrão brasileiras sem comunicação bidirecional com a rede.</td>
                <td>Exigência gradativa de inversores inteligentes (smart inverters) com suporte à rede.</td>
              </tr>
            </tbody>
          </table>

          <h2 id="processo-adequacao">6. Passo a Passo: Como Regularizar sua Instalação</h2>
          <p>Se você tem um sistema de energia solar e fez alterações não avisadas (como instalar mais placas ou trocar o inversor por um mais potente), siga este fluxo para evitar a intervenção da Neoenergia:</p>

          <div class="process-steps">
            <div class="process-step">
              <div class="ps-marker">1</div>
              <div class="ps-body">
                <div class="ps-badge"><span class="ps-timing">Ação Imediata</span></div>
                <h3>Levantamento Técnico (As-Built)</h3>
                <p>Contrate um engenheiro eletricista para ir ao local e documentar exatamente o que está instalado hoje (quantidade e potência dos painéis, modelo do inversor, bitola dos cabos e disjuntores da <a href="/blog/neoenergia-investe-9-7-bi-pe-muda-obra/" class="ilink">entrada de energia</a>).</p>
              </div>
            </div>
            <div class="process-step">
              <div class="ps-marker">2</div>
              <div class="ps-body">
                <div class="ps-badge"><span class="ps-timing">Engenharia</span></div>
                <h3>Elaboração de Novo Projeto e ART</h3>
                <p>O engenheiro elaborará o diagrama unifilar atualizado e emitirá uma nova Anotação de Responsabilidade Técnica (ART) detalhando o aumento de potência real.</p>
              </div>
            </div>
            <div class="process-step">
              <div class="ps-marker">3</div>
              <div class="ps-body">
                <div class="ps-badge"><span class="ps-timing">Concessionária</span></div>
                <h3>Submissão à Neoenergia</h3>
                <p>O processo é submetido no portal de projetos da Neoenergia como uma "Alteração de Dados / Aumento de Geração". A distribuidora fará a análise do novo cenário de carga e aprovará as modificações.</p>
              </div>
            </div>
            <div class="process-step">
              <div class="ps-marker">4</div>
              <div class="ps-body">
                <div class="ps-badge"><span class="ps-timing">Conclusão</span></div>
                <h3>Vistoria e Atualização Contratual</h3>
                <p>Se necessário, uma vistoria é feita. A Neoenergia emitirá o aditivo ao contrato de relacionamento ou o novo CUSD (para média tensão), consolidando a legalidade da sua usina sob as regras vigentes.</p>
              </div>
            </div>
          </div>

          <div class="article-highlight success">
            <p><strong>Você Sabia?</strong> Contratar uma empresa <strong>credenciada pela Neoenergia</strong> como a Exitogrid reduz drasticamente o tempo desse processo burocrático, pois dominamos os canais diretos e as exigências (NDUs) da distribuidora.</p>
          </div>

          <h2 id="conclusao">7. O Futuro da Geração Distribuída: Mais Inteligência, Menos Burocracia?</h2>
          <p>A CP 009/2026 marca um amadurecimento inevitável do setor solar no Brasil. A rede elétrica é um organismo vivo e possui limites físicos. A implementação do curtailment e o rigor contra as ligações clandestinas visam proteger os equipamentos não só da distribuidora, mas da vizinhança inteira (que sofre com queimas de eletrodomésticos devido a sobretensões causadas por usinas solares irregulares).</p>
          
          <p>Ao mesmo tempo, as regras para <strong>Baterias (BESS)</strong> abrem as portas para a próxima revolução do mercado. A capacidade de armazenar a própria energia e gerenciar o consumo nos horários mais caros será o grande diferencial competitivo para indústrias nos próximos anos.</p>

          <div class="article-author">
            <div class="author-avatar">EM</div>
            <div class="author-info">
              <strong>Eng. Euller Matheus</strong>
              <p>Engenheiro Eletricista com ampla experiência em aprovações de projetos de média e alta complexidade, especialista no Marco da GD e consultor técnico credenciado junto à Neoenergia PE pela Exitogrid.</p>
            </div>
          </div>

          <section class="article-faq">
            <h2>Perguntas Frequentes (FAQ) sobre a CP 009 e Regras ANEEL</h2>
            <div class="faq-item">
              <button class="faq-question" aria-expanded="false">O que é a Consulta Pública 009/2026 da ANEEL? <span class="faq-icon">+</span></button>
              <div class="faq-answer">É uma proposta oficial da agência reguladora para revisar as normas técnicas e comerciais da Geração Distribuída. Ela aborda desde punições para ampliações irregulares de sistemas solares até a regulamentação inédita do uso de baterias interligadas à rede pública.</div>
            </div>
            <div class="faq-item">
              <button class="faq-question" aria-expanded="false">Aumentei o número de placas solares sem avisar a Neoenergia. O que me acontece? <span class="faq-icon">+</span></button>
              <div class="faq-answer">Pelas novas diretrizes da CP 009, você cometeu uma infração grave. Se flagrado via telemetria (monitoramento do medidor bidirecional), você pode sofrer o desligamento imediato, multas pesadas e a perda de direitos adquiridos da lei antiga. Você deve procurar uma engenharia elétrica para regularizar o aumento de carga (projeto As-Built).</div>
            </div>
            <div class="faq-item">
              <button class="faq-question" aria-expanded="false">As baterias solares (BESS) agora são permitidas? <span class="faq-icon">+</span></button>
              <div class="faq-answer">Sim! A consulta traz regras claras de como homologar um inversor híbrido com banco de baterias de lítio na rede da distribuidora. Isso permitirá usar baterias para fugir do caro horário de ponta ou para atuar como nobreak seguro sem esbarrar em proibições burocráticas.</div>
            </div>
            <div class="faq-item">
              <button class="faq-question" aria-expanded="false">Como funciona a Via Expressa para pequenos sistemas? <span class="faq-icon">+</span></button>
              <div class="faq-answer">Projetos de até 7,5 kW de potência instalada (normalmente residenciais e comércios bem pequenos) terão dispensa de estudos complexos de inversão de fluxo de potência. Isso tornará a aprovação desses projetos quase automática em áreas sem problemas graves de rede.</div>
            </div>
            <div class="faq-item">
              <button class="faq-question" aria-expanded="false">O que é Curtailment e isso afeta meu rendimento? <span class="faq-icon">+</span></button>
              <div class="faq-answer">Curtailment é o direito técnico que a distribuidora passa a ter de limitar a geração do seu inversor em horários em que a rede local está à beira do colapso (como picos de sol forte e baixo consumo). Pode reduzir pontualmente o rendimento da usina, mas garante a estabilidade e impede negativas totais de conexão.</div>
            </div>
          </section>

        </article>

        <!-- SIDEBAR -->
        <aside class="article-sidebar">
          <div class="sidebar-card">
            <h4>Neste Artigo</h4>
            <ul class="sidebar-toc">
              <li><a href="#fiscalizacao-rigorosa">1. Fim do Gato Solar e Fiscalização</a></li>
              <li><a href="#regras-baterias">2. A Regulamentação das Baterias (BESS)</a></li>
              <li><a href="#curtailment">3. O que é Curtailment</a></li>
              <li><a href="#via-expressa">4. Via Expressa para Sistemas <7,5kW</a></li>
              <li><a href="#tabela-comparativa">5. Regra Atual vs Nova (Tabela)</a></li>
              <li><a href="#processo-adequacao">6. Passo a Passo de Regularização</a></li>
            </ul>
          </div>
          
          <div class="sidebar-card">
            <h4>Serviços Exitogrid</h4>
            <div class="sidebar-links-box">
              <a href="/projeto-subestacao/" class="sidebar-link-item"><span>Projetos de Subestação</span></a>
              <a href="/energia-solar/" class="sidebar-link-item"><span>Engenharia para Solar</span></a>
              <a href="/aumento-carga/" class="sidebar-link-item"><span>Aumento de Carga</span></a>
              <a href="/sistema-aterramento/" class="sidebar-link-item"><span>Aterramento e SPDA</span></a>
              <a href="/laudo-tecnico-instalacao/" class="sidebar-link-item"><span>Laudos Técnicos (LTI)</span></a>
              <a href="/instalacao-subestacao/" class="sidebar-link-item"><span>Instalação Elétrica</span></a>
            </div>
          </div>
          
          <div class="sidebar-cta">
            <p>Seu projeto de Geração Distribuída travou na Neoenergia?</p>
            <a href="https://wa.me/5581988906429" class="btn-wa-article" target="_blank">Falar com Especialista</a>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- RELATED ARTICLES -->
  <section class="article-related">
    <div class="container">
      <h2>Continue Lendo</h2>
      <div class="related-grid">
        <a href="/blog/como-funciona-energia-solar-para-empresas-recife/" class="related-card">
          <div class="related-card-img">
            <img src="/images/energia-solar-para-empresas-recife.jpg" alt="Energia Solar para Empresas" loading="lazy">
          </div>
          <div class="related-card-body">
            <span class="related-card-cat">Energia Solar</span>
            <h3>Como Funciona a Energia Solar para Empresas no Recife</h3>
            <p>Descubra os benefícios, o modelo ideal de negócios e o retorno sobre o investimento em energia solar corporativa.</p>
          </div>
        </a>
        <a href="/blog/aprovacao-rapida-projetos-neoenergia/" class="related-card">
          <div class="related-card-img">
            <img src="/images/aprovacao-rapida-projetos-neoenergia.jpg" alt="Aprovação de Projetos Neoenergia" loading="lazy">
          </div>
          <div class="related-card-body">
            <span class="related-card-cat">Gestão de Projetos</span>
            <h3>Dicas para Aprovação Rápida de Projetos na Neoenergia</h3>
            <p>Evite atrasos: conheça o checklist completo de documentação para aprovar seu projeto de primeira.</p>
          </div>
        </a>
        <a href="/blog/como-funciona-aumento-de-carga-neoenergia/" class="related-card">
          <div class="related-card-img">
            <img src="/images/aumento-de-carga-neoenergia-pernambuco.jpg" alt="Aumento de Carga Neoenergia" loading="lazy">
          </div>
          <div class="related-card-body">
            <span class="related-card-cat">Neoenergia</span>
            <h3>Aumento de Carga Neoenergia PE: O Guia Completo</h3>
            <p>Entenda quando é obrigatório e como solicitar a ampliação da capacidade elétrica do seu negócio.</p>
          </div>
        </a>
      </div>
    </div>
  </section>
</main>

<!-- FOOTER -->
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <h3>Exitogrid Engenharia Elétrica</h3>
        <p>Soluções completas em engenharia elétrica industrial e comercial. Credenciada Neoenergia PE, garantimos segurança, eficiência e aprovação rápida para o seu projeto elétrico e solar.</p>
        <p><strong>Cidades Atendidas:</strong> Recife, Olinda, Camaragibe, Jaboatão dos Guararapes, Cabo de Santo Agostinho, Ipojuca, Caruaru, Petrolina e Região.</p>
      </div>
      <div class="footer-col">
        <h4>Serviços Principais</h4>
        <div class="footer-links">
          <a href="/projeto-subestacao/">Projetos de Subestação</a>
          <a href="/projeto-entrada-energia/">Entrada de Energia</a>
          <a href="/aumento-carga/">Aumento de Carga</a>
          <a href="/sistema-aterramento/">Malha de Aterramento</a>
          <a href="/spda-para-raios/">Projeto de SPDA</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Laudos & Execução</h4>
        <div class="footer-links">
          <a href="/laudo-tecnico-instalacao/">Laudo Técnico (LTI)</a>
          <a href="/laudo-spda/">Laudo de SPDA</a>
          <a href="/instalacao-subestacao/">Montagem de Subestação</a>
          <a href="/credenciamento-neoenergia/">Despachante Neoenergia</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Contato</h4>
        <div class="footer-links">
          <a href="https://wa.me/5581988906429" target="_blank">WhatsApp: (81) 98890-6429</a>
          <a href="mailto:contato@exitogrid.com.br">contato@exitogrid.com.br</a>
          <a href="/#contato">Solicitar Orçamento</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Exitogrid Engenharia Elétrica. Todos os direitos reservados.</p>
      <div class="footer-social">
        <a href="#" class="social-btn" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
        <a href="#" class="social-btn" aria-label="LinkedIn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>
      </div>
    </div>
  </div>
</footer>

<a href="https://wa.me/5581988906429?text=Ol%C3%A1%2C%20Exitogrid!%20Gostaria%20de%20ajuda%20para%20regularizar%20meu%20projeto%20solar." target="_blank" class="float-wa" aria-label="Falar no WhatsApp">
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
  <span class="float-wa-tooltip">Falar com Engenheiro</span>
</a>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('art-hamburger');
    const drawer = document.getElementById('art-drawer');
    const overlay = document.getElementById('art-overlay');
    const faqQuestions = document.querySelectorAll('.faq-question');

    function toggleMenu() {
      hamburger.classList.toggle('open');
      drawer.classList.toggle('open');
      overlay.classList.toggle('active');
      document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
    }

    if(hamburger) hamburger.addEventListener('click', toggleMenu);
    if(overlay) overlay.addEventListener('click', toggleMenu);

    faqQuestions.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !isExpanded);
        item.classList.toggle('open');
      });
    });
  });
</script>
</body>
</html>
"""

os.makedirs(r"C:\Users\Euller Matheus\Downloads\blog\consulta-publica-009-2026-aneel-muda-quem-tem-solar", exist_ok=True)
with open(r"C:\Users\Euller Matheus\Downloads\blog\consulta-publica-009-2026-aneel-muda-quem-tem-solar\index.html", "w", encoding="utf-8") as f:
    f.write(html_content)
