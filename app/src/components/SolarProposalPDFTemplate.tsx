import React from "react";

interface SolarProposalPDFTemplateProps {
  proposal: any;
  client?: any;
  solarProject?: any;
  company?: any;
}

// ─── PALETA ────────────────────────────────────────────────────────────────
const C = {
  navy: "#0A1628",
  navyMid: "#0F2040",
  navyLight: "#1A3055",
  green: "#16A34A",
  greenDark: "#0F7A35",
  greenLight: "#22C55E",
  gold: "#E8920A",
  goldLight: "#F5A623",
  red: "#DC2626",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray800: "#1F2937",
};

// ─── MAPPER: ERP props → template data ──────────────────────────────────────
function buildData(proposal: any, solarProject: any, company: any) {
  const p = solarProject || {};
  const cl = proposal?.client || {};
  const co = company || {};
  const today = new Date();
  const validade = new Date(today); validade.setDate(validade.getDate() + 7);
  const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const N = (v: any) => Number(v || 0);

  const monthlyGen = N(p.monthlyGenerationKwh);
  const annualGen = N(p.annualGenerationKwh) || monthlyGen * 12;
  const consumo = N(p.consumptionKwh);
  const tariff = N(p.tariff);
  const monthlySav = N(p.monthlySavings);
  const annualSav = N(p.annualSavings) || monthlySav * 12;
  const paybackM = N(p.paybackMonths);
  const compPct = N(p.compensationPercent) || (consumo > 0 ? Math.min(100, Math.round((monthlyGen / consumo) * 100)) : 95);
  const connLabel = p.connectionType === 'monophasic' ? 'Monofásico 127V' : p.connectionType === 'triphasic' ? 'Trifásico 380V' : 'Bifásico 220V';
  const installLabel = p.installationType === 'ground' ? 'Solo' : 'Telhado';
  const concessionaria = p.concessionaria || 'Neoenergia';
  const monthlyData: any[] = p.monthlyConsumptions || [];
  const geracaoMeses = monthlyData.length === 12
    ? monthlyData.map(() => monthlyGen)
    : Array(12).fill(monthlyGen);
  const consumoMeses = monthlyData.length === 12
    ? monthlyData.map((m: any) => N(m.kwh))
    : Array(12).fill(consumo);

  // Map kits from ERP format
  const erpKits: any[] = p.commercialKits || [];
  const kits = erpKits.map((kit: any) => {
    const modules = (kit.equipment || []).filter((e: any) => e.type === 'module');
    const inverters = (kit.equipment || []).filter((e: any) => e.type === 'inverter');
    const structures = (kit.equipment || []).filter((e: any) => e.type === 'structure');
    const mod = modules[0] || {};
    const inv = inverters[0] || {};
    const str = structures[0] || {};
    const eqTotal = (kit.equipment || []).reduce((s: number, e: any) => s + N(e.total), 0);
    const guarTotal = (kit.guarantees || []).filter((g: any) => g.included).reduce((s: number, g: any) => s + N(g.value), 0);
    const realValue = eqTotal + guarTotal + N(kit.laborCost) + N(kit.installationCost) + N(kit.otherCosts);
    const kitPrice = N(kit.totalPrice);
    const discount = realValue > kitPrice && realValue > 0 ? Math.round((realValue - kitPrice) / realValue * 100) : 0;
    // Build garantias object from guarantees array
    const gArr: any[] = kit.guarantees || [];
    const hasG = (keyword: string) => gArr.some((g: any) => g.included && (g.text || '').toLowerCase().includes(keyword));
    return {
      nome: kit.name || `Kit ${kit.name}`,
      badge: kit.isRecommended ? "★ RECOMENDADO" : null,
      modulo: { marca: mod.brand || '—', modelo: mod.model || '—', qtd: N(mod.quantity) || N(p.moduleCount) },
      inversor: { marca: inv.brand || '—', modelo: inv.model || '—', qtd: N(inv.quantity) || 1 },
      estrutura: { fabricante: str.brand || '—', modelo: str.model || '—' },
      precoOriginal: realValue || kitPrice,
      desconto: discount,
      precoFinal: kitPrice,
      garantias: {
        engenharia: gArr.length === 0 || hasG('engenharia') || hasG('projeto'),
        equipamentos: gArr.length === 0 || hasG('equipamento') || hasG('fornecimento'),
        homologacao: gArr.length === 0 || hasG('homologa') || hasG('concession') || hasG('registro'),
        monitoramento: hasG('monitoramento') || hasG('acompanhamento'),
        seguro: hasG('seguro') || hasG('proteção'),
        suporte24h: hasG('suporte') || hasG('24h') || hasG('técnico'),
      },
      // Keep raw guarantees for display
      rawGuarantees: gArr,
      showValues: kit.showGuaranteeValues || false,
    };
  });

  // Dynamic timelines based on project size
  const powerKwp = N(p.systemPowerKwp);
  const isSmall = powerKwp <= 5;
  const isMedium = powerKwp > 5 && powerKwp <= 15;
  const installDays = isSmall ? '1–2 dias' : isMedium ? '2–3 dias' : '3–5 dias';
  const engDays = isSmall ? '2–3 dias' : isMedium ? '3–5 dias' : '5–7 dias';
  const homologDays = concessionaria.toLowerCase().includes('neoenergia') ? '30–60 dias' : '30–90 dias';

  // Extract warranty from equipment
  const moduleEq = (p.equipment || []).find((e: any) => e.type === 'module');
  const inverterEq = (p.equipment || []).find((e: any) => e.type === 'inverter');
  const moduleWarranty = moduleEq?.warranty || '25 anos';
  const inverterWarranty = inverterEq?.warranty || '5–12 anos';

  return {
    empresa: {
      nome: co.tradeName || co.name || 'Êxito Grid Eficiência Elétrica & Solar',
      cnpj: co.cnpj || '',
      fone: co.phone || '',
      email: co.email || '',
      site: co.website || 'www.exitogrid.com.br',
      endereco: co.address ? `${co.address}, ${co.city || ''}/${co.state || ''}` : '',
    },
    cliente: {
      nome: cl.name || '—',
      cpfCnpj: cl.document || '',
      endereco: p.propertyAddress || cl.address || '—',
      cidade: cl.city || p.propertyCity || 'Recife',
      uf: cl.state || p.propertyState || 'PE',
    },
    proposta: {
      numero: proposal?.proposalNumber || p.code || '',
      data: fmtDate(today),
      validade: fmtDate(validade),
      validadeDias: 7,
    },
    sistema: {
      potenciaKwp: N(p.systemPowerKwp),
      modulosQtd: N(p.moduleCount),
      geracaoMensal: monthlyGen,
      geracaoAnual: annualGen,
      consumoMensal: consumo,
      compensacaoPerc: compPct,
      tarifa: tariff,
      economiaMensal: monthlySav,
      economiaAnual: annualSav,
      paybackAnos: paybackM > 0 ? +(paybackM / 12).toFixed(1) : 0,
      roi: N(p.roiPercent),
      reducaoPerc: compPct,
      localInstalacao: installLabel,
      tipoFornecimento: connLabel,
      concessionaria,
      hspValue: N(p.hspValue) || 5.2,
    },
    timeline: {
      installDays,
      engDays,
      homologDays,
    },
    warranties: {
      module: moduleWarranty,
      inverter: inverterWarranty,
    },
    geracaoMeses,
    consumoMeses,
    kits,
    equipment: p.equipment || [],
  };
}

// ─── UTILITÁRIOS ───────────────────────────────────────────────────────────
const fmt = (n: number) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN = (n: number) => Math.round(Number(n || 0)).toLocaleString("pt-BR");
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_FULL = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ─── COMPONENTES BASE ──────────────────────────────────────────────────────

const Page = ({ children, bg = C.navy, style = {} }: { children: React.ReactNode; bg?: string; style?: React.CSSProperties }) => (
  <div style={{
    width: 794, height: 1123, backgroundColor: bg,
    position: "relative", overflow: "hidden",
    fontFamily: "'Segoe UI', 'Arial', 'Helvetica Neue', sans-serif",
    boxSizing: "border-box",
    fontSize: 13,
    lineHeight: 1.5,
    ...style,
  }}>
    {/* Gold border - all 4 sides */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.white}, ${C.gold})`, zIndex: 20 }} />
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.white}, ${C.gold})`, zIndex: 20 }} />
    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${C.gold}, ${C.white}, ${C.gold})`, zIndex: 20 }} />
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${C.gold}, ${C.white}, ${C.gold})`, zIndex: 20 }} />
    {children}
  </div>
);

const SectionHeader = ({ num, title, subtitle, style = {} }: { num: string; title: string; subtitle?: string; style?: React.CSSProperties }) => (
  <div style={{ backgroundColor: C.green, padding: "14px 40px", marginBottom: 24, ...style }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", lineHeight: 1 }}>
        {num}
      </span>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.white, letterSpacing: 0.5 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  </div>
);



const KPICard = ({ label, value, unit, color = C.green, bg = C.navy }: { label: string; value: any; unit: string; color?: string; bg?: string }) => (
  <div style={{
    backgroundColor: bg, borderRadius: 10, padding: "20px 16px",
    textAlign: "center", flex: 1, border: `1px solid rgba(255,255,255,0.1)`,
  }}>
    <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{unit}</div>
    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", marginTop: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
  </div>
);

const PageFooter = ({ empresa, pageNum }: { empresa: any; pageNum: string }) => (
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTop: `2px solid ${C.green}`,
    backgroundColor: C.navy,
    padding: "10px 40px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  }}>
    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{empresa.nome} · CNPJ {empresa.cnpj}</span>
    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{empresa.fone} · {empresa.email}</span>
    <span style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>{pageNum} / 09</span>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 1 — CAPA
// ══════════════════════════════════════════════════════════════════════════
const Page1 = ({ data }: { data: any }) => {
  const { cliente, proposta, sistema } = data;
  return (
    <Page bg={C.navy} style={{ color: C.white }}>
      {/* Decoração de fundo */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 400, height: 400,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(22,163,74,0.18) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 100, left: -60,
        width: 300, height: 300,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(232,146,10,0.12) 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ padding: "48px 48px 0" }}>
        {/* Logo simulado */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 56 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 20px rgba(22,163,74,0.4)`,
          }}>
            <span style={{ fontSize: 28 }}>⚡</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.white, letterSpacing: 0.5 }}>ÊXITO GRID</div>
            <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, textTransform: "uppercase" }}>Eficiência Elétrica & Solar</div>
          </div>
        </div>

        {/* Título principal */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: "inline-block",
            backgroundColor: C.green,
            color: C.white, fontSize: 10, fontWeight: 700,
            padding: "4px 14px", borderRadius: 20, letterSpacing: 2,
            textTransform: "uppercase", marginBottom: 16,
          }}>
            Proposta Técnico-Comercial
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.2, color: C.white, maxWidth: 580 }}>
            Orçamento para Sistema
            <br />
            <span style={{ color: C.gold }}>Fotovoltaico</span> Conectado à Rede
          </div>
          <div style={{
            marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.6)",
            borderLeft: `3px solid ${C.gold}`, paddingLeft: 14,
          }}>
            Proposta Nº {proposta.numero} · Emitida em {proposta.data}
            <br />
            <span style={{ color: C.gold, fontWeight: 700 }}>⚠ Válida por {proposta.validadeDias} dias — até {proposta.validade}</span>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: `linear-gradient(90deg, ${C.gold}, transparent)`, margin: "28px 0" }} />

        {/* KPIs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <KPICard label="Potência do Sistema" value={sistema.potenciaKwp.toFixed(2)} unit="kWp" color={C.greenLight} />
          <KPICard label="Geração Estimada" value={fmtN(sistema.geracaoMensal)} unit="kWh / mês" color={C.greenLight} />
          <KPICard label="Economia Mensal" value={`R$ ${fmt(sistema.economiaMensal)}`} unit="por mês" color={C.gold} />
          <KPICard label="Retorno do Investimento" value={sistema.paybackAnos} unit="anos de payback" color={C.gold} />
        </div>

        {/* Divisor */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`, margin: "0 0 28px" }} />

        {/* Seção visual central */}
        <div style={{
          background: `linear-gradient(135deg, rgba(22,163,74,0.1), rgba(232,146,10,0.08))`,
          border: `1px solid rgba(22,163,74,0.3)`,
          borderRadius: 12, padding: "24px 32px",
          display: "flex", alignItems: "center", gap: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 52 }}>☀️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.greenLight, marginBottom: 6 }}>
              Sistema de {sistema.potenciaKwp} kWp · {sistema.modulosQtd} Módulos Fotovoltaicos
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              Geração estimada de <strong style={{ color: C.white }}>{fmtN(sistema.geracaoAnual)} kWh/ano</strong>,
              com economia anual de <strong style={{ color: C.gold }}>R$ {fmt(sistema.economiaAnual)}</strong>.
              Redução de até <strong style={{ color: C.greenLight }}>{sistema.reducaoPerc}%</strong> na sua conta de energia.
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>ROI em</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.gold, lineHeight: 1 }}>{sistema.roi}%</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>retorno acumulado</div>
          </div>
        </div>

        {/* Credenciais */}
        <div style={{ display: "flex", gap: 8 }}>
          {["✅ NR-10 Certificado", "✅ NR-35 Certificado", "✅ ART/CREA", "✅ Neoenergia Pernambuco", "✅ +8.000 projetos"].map(b => (
            <div key={b} style={{
              fontSize: 9, color: C.greenLight, fontWeight: 700,
              border: `1px solid rgba(22,163,74,0.4)`,
              borderRadius: 4, padding: "4px 8px",
            }}>{b}</div>
          ))}
        </div>
      </div>

      {/* Rodapé com cliente */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: `linear-gradient(90deg, ${C.green}, ${C.greenDark})`,
        padding: "16px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>Proposta preparada para</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.white }}>{cliente.nome}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>{cliente.endereco}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>CPF/CNPJ</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{cliente.cpfCnpj}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>01 / 09</div>
        </div>
      </div>
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 2 — SUMÁRIO + COMPROMISSO
// ══════════════════════════════════════════════════════════════════════════
const Page2 = ({ data }: { data: any }) => {
  const { empresa } = data;
  const sumario = [
    { num: "01", titulo: "Nosso Compromisso", desc: "Quem somos e por que confiar em nós" },
    { num: "02", titulo: "Como Funciona a Energia Solar", desc: "O processo de geração e economia" },
    { num: "03", titulo: "Escopo do Projeto", desc: "Localização e potencial de geração" },
    { num: "04", titulo: "Especificações do Sistema", desc: "Equipamentos e dimensionamento técnico" },
    { num: "05", titulo: "Análise Financeira", desc: "Economia mês a mês e retorno" },
    { num: "06", titulo: "Geração vs. Consumo", desc: "Comparativo detalhado anual" },
    { num: "07", titulo: "Serviços Ofertados", desc: "O que está incluído na proposta" },
    { num: "08", titulo: "Kits Comerciais", desc: "Opções de sistema e investimento" },
    { num: "09", titulo: "Garantias & Cronograma", desc: "Prazos, proteções e assinaturas" },
  ];
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "36px 48px 80px" }}>
        {/* Título */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.gold, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Proposta Técnico-Comercial</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.navy }}>Sumário da Proposta</div>
        </div>

        {/* Itens do sumário */}
        <div style={{ marginBottom: 36 }}>
          {sumario.map((item, i) => (
            <div key={item.num} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "11px 16px",
              backgroundColor: i % 2 === 0 ? C.gray50 : C.white,
              borderLeft: `4px solid ${i % 2 === 0 ? C.green : C.gray200}`,
              marginBottom: 2,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: i % 2 === 0 ? C.green : C.navy,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, color: C.white, flexShrink: 0,
              }}>{item.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{item.titulo}</div>
                <div style={{ fontSize: 10, color: C.gray600 }}>{item.desc}</div>
              </div>
              <div style={{ width: 80, height: 1, background: C.gray200 }} />
              <div style={{ fontSize: 10, color: C.gray400 }}>pág. 0{i + 1}</div>
            </div>
          ))}
        </div>

        {/* Seção compromisso */}
        <div style={{
          backgroundColor: C.navy, borderRadius: 12, padding: "24px 28px",
          border: `2px solid ${C.green}`,
        }}>
          <div style={{
            display: "inline-block", backgroundColor: C.green,
            color: C.white, fontSize: 10, fontWeight: 700, padding: "4px 14px",
            borderRadius: 20, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16,
          }}>01 — Nosso Compromisso</div>

          <div style={{ display: "flex", gap: 20 }}>
            {/* Bloco 1 */}
            <div style={{
              flex: 1, backgroundColor: "rgba(22,163,74,0.12)",
              border: `1px solid rgba(22,163,74,0.3)`, borderRadius: 10, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🏆</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 10 }}>Confiança e Conquista</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { v: "+10", l: "anos de experiência no setor elétrico" },
                  { v: "+8.000", l: "residências e empresas energizadas" },
                  { v: "100%", l: "das obras homologadas com sucesso" },
                ].map(s => (
                  <div key={s.v} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.gold, minWidth: 52 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 2 */}
            <div style={{
              flex: 1, backgroundColor: "rgba(232,146,10,0.1)",
              border: `1px solid rgba(232,146,10,0.3)`, borderRadius: 10, padding: "18px 20px",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💡</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.white, marginBottom: 10 }}>Bom Negócio</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { v: "95%", l: "de redução na conta de energia" },
                  { v: "3–6%", l: "de valorização no imóvel" },
                  { v: "25 anos", l: "de vida útil dos módulos" },
                ].map(s => (
                  <div key={s.v} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.greenLight, minWidth: 52 }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {["⚡ NR-10", "⚡ NR-35", "📋 ART/CREA", "🏢 Credenciada Neoenergia", "🌿 Empresa Sustentável"].map(b => (
              <div key={b} style={{
                fontSize: 10, fontWeight: 600, color: C.navy,
                backgroundColor: C.gold, borderRadius: 6, padding: "5px 12px",
              }}>{b}</div>
            ))}
          </div>
        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="02" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 3 — COMO FUNCIONA (diagrama detalhado)
// ══════════════════════════════════════════════════════════════════════════

// Sub-componente: nó do diagrama
const FlowNode = ({ icon, title, subtitle, detail, color, accentColor, width = 110 }: { icon: string; title: string; subtitle: string; detail?: string; color: string; accentColor?: string; width?: number }) => (
  <div style={{
    width, display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
  }}>
    {/* Ícone principal */}
    <div style={{
      width: 64, height: 64, borderRadius: 16,
      background: `linear-gradient(135deg, ${color}, ${accentColor || color})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 28,
      boxShadow: `0 0 0 4px rgba(255,255,255,0.06), 0 6px 20px rgba(0,0,0,0.35)`,
      marginBottom: 8,
    }}>{icon}</div>
    {/* Título */}
    <div style={{ fontSize: 11, fontWeight: 800, color: C.white, textAlign: "center", lineHeight: 1.3 }}>{title}</div>
    {/* Subtítulo técnico */}
    <div style={{
      fontSize: 9, color: accentColor || C.gold, fontWeight: 700,
      textAlign: "center", marginTop: 2, lineHeight: 1.3,
    }}>{subtitle}</div>
    {/* Detalhe */}
    {detail && (
      <div style={{
        marginTop: 6,
        backgroundColor: "rgba(255,255,255,0.07)",
        border: `1px solid rgba(255,255,255,0.12)`,
        borderRadius: 6, padding: "5px 8px",
        fontSize: 9, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.45,
        width: "100%",
      }}>{detail}</div>
    )}
  </div>
);

// Sub-componente: seta com rótulo
const FlowArrow = ({ label, sublabel, color = C.gold, vertical = false }: { label?: string; sublabel?: string; color?: string; vertical?: boolean }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 2, paddingBottom: vertical ? 0 : 28,
    flexShrink: 0,
  }}>
    {/* Linha */}
    <div style={{
      width: vertical ? 2 : 36, height: vertical ? 28 : 2,
      background: `linear-gradient(${vertical ? "180deg" : "90deg"}, ${color}, rgba(232,146,10,0.4))`,
      position: "relative",
    }}>
      {/* Ponta da seta */}
      <div style={{
        position: "absolute",
        [vertical ? "bottom" : "right"]: -5,
        [vertical ? "left" : "top"]: vertical ? "50%" : "50%",
        transform: vertical ? "translateX(-50%)" : "translateY(-50%)",
        width: 0, height: 0,
        // arrow right
        ...((!vertical) ? {
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: `8px solid ${color}`,
          borderRight: "none",
          top: "50%", right: -8,
          transform: "translateY(-50%)",
        } : {}),
      }} />
    </div>
    {label && (
      <div style={{ fontSize: 8, color, fontWeight: 700, textAlign: "center", lineHeight: 1.3, maxWidth: 48 }}>{label}</div>
    )}
    {sublabel && (
      <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{sublabel}</div>
    )}
  </div>
);

const Page3 = ({ data }: { data: any }) => {
  const { empresa } = data;
  return (
    <Page bg={C.navy} style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="02" title="Como Funciona a Energia Solar?" subtitle="Diagrama completo do fluxo de geração, consumo e compensação de créditos" />

        <div style={{ padding: "0 36px" }}>

          {/* ── DIAGRAMA PRINCIPAL ─────────────────────────────────── */}
          <div style={{
            background: "linear-gradient(160deg, #0d1e38 0%, #0A1628 60%, #071220 100%)",
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 14, padding: "22px 20px 18px",
            marginBottom: 16,
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow de fundo decorativo */}
            <div style={{
              position: "absolute", top: -40, left: "20%",
              width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(232,146,10,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: -20, right: "10%",
              width: 160, height: 160, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{
              fontSize: 10, color: C.gold, fontWeight: 800,
              letterSpacing: 2, textTransform: "uppercase", marginBottom: 18,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ width: 16, height: 2, backgroundColor: C.gold }} />
              Fluxo Técnico de Energia — Sistema On-Grid
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(232,146,10,0.4), transparent)" }} />
            </div>

            {/* ── LINHA 1: fluxo principal ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0, marginBottom: 16 }}>

              {/* NÓ 1 — Sol */}
              <FlowNode
                icon="☀️"
                title="Radiação Solar"
                subtitle="Fonte primária"
                detail={"5,2 kWh/m²/dia\nRecife/PE"}
                color="#B45309"
                accentColor={C.gold}
                width={100}
              />

              <FlowArrow label="Fótons" sublabel="luz visível + IV" color={C.gold} />

              {/* NÓ 2 — Módulos */}
              <FlowNode
                icon="🔆"
                title="Módulos FV"
                subtitle="Efeito Fotovoltaico"
                detail={"Geram CC\n400–600 Wp/módulo\nSi monocristalino"}
                color="#1a5c38"
                accentColor={C.greenLight}
                width={108}
              />

              <FlowArrow label="CC 30–50V" sublabel="corrente contínua" color={C.greenLight} />

              {/* NÓ 3 — String Box */}
              <FlowNode
                icon="🗳️"
                title="String Box CC"
                subtitle="Proteção + fusíveis"
                detail={"DPS, fusíveis\nchave seccionadora\nmonitoramento"}
                color="#1e3a5f"
                accentColor="#60A5FA"
                width={108}
              />

              <FlowArrow label="CC filtrada" sublabel="protegida" color="#60A5FA" />

              {/* NÓ 4 — Inversor */}
              <FlowNode
                icon="⚡"
                title="Inversor Solar"
                subtitle="CC → CA · MPPT"
                detail={"220V / 60 Hz\neficiência 97–98%\nmonitoramento Wi-Fi"}
                color="#1e3a5f"
                accentColor={C.greenLight}
                width={108}
              />

              <FlowArrow label="CA 220V" sublabel="60 Hz" color={C.greenLight} />

              {/* NÓ 5 — Quadro elétrico */}
              <FlowNode
                icon="🔌"
                title="Quadro Geral"
                subtitle="Distribuição CA"
                detail={"disjuntores\nbidirecional\nString Box CA"}
                color="#2d1f4e"
                accentColor="#A78BFA"
                width={105}
              />

            </div>

            {/* ── LINHA DIVISÓRIA com bifurcação ── */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 0, marginBottom: 0,
            }}>
              {/* espaço alinhado com Quadro Geral */}
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 105 }}>
                {/* bifurcação visual */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 0, width: "100%" }}>
                  {/* seta esquerda → casa */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 2, height: 20, background: `linear-gradient(180deg, #A78BFA, ${C.greenLight})` }} />
                    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `8px solid ${C.greenLight}` }} />
                    <div style={{ fontSize: 8, color: C.greenLight, fontWeight: 700, marginTop: 4 }}>consumo</div>
                  </div>
                  {/* seta direita → rede */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 2, height: 20, background: `linear-gradient(180deg, #A78BFA, ${C.gold})` }} />
                    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `8px solid ${C.gold}` }} />
                    <div style={{ fontSize: 8, color: C.gold, fontWeight: 700, marginTop: 4 }}>excedente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── LINHA 2: destinos ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, paddingRight: 8 }}>

              {/* Casa / consumo */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 120 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 16,
                  background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32,
                  boxShadow: `0 0 0 4px rgba(22,163,74,0.2), 0 6px 20px rgba(0,0,0,0.35)`,
                  marginBottom: 8,
                }}>🏠</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.white }}>Sua Residência</div>
                <div style={{ fontSize: 9, color: C.greenLight, fontWeight: 700, marginBottom: 6 }}>Consumo direto</div>
                <div style={{
                  backgroundColor: "rgba(22,163,74,0.15)", border: `1px solid rgba(22,163,74,0.35)`,
                  borderRadius: 6, padding: "6px 10px", fontSize: 9,
                  color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1.5,
                }}>
                  Energia usada em tempo real<br />
                  <strong style={{ color: C.greenLight }}>≈ 95% da conta zerada</strong>
                </div>
              </div>

              {/* Rede / concessionária */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 130 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 16,
                  background: `linear-gradient(135deg, #B45309, ${C.gold})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32,
                  boxShadow: `0 0 0 4px rgba(232,146,10,0.2), 0 6px 20px rgba(0,0,0,0.35)`,
                  marginBottom: 8,
                }}>🏢</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.white }}>Neoenergia</div>
                <div style={{ fontSize: 9, color: C.gold, fontWeight: 700, marginBottom: 6 }}>Rede distribuidora</div>
                <div style={{
                  backgroundColor: "rgba(232,146,10,0.12)", border: `1px solid rgba(232,146,10,0.3)`,
                  borderRadius: 6, padding: "6px 10px", fontSize: 9,
                  color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1.5,
                }}>
                  Excedente vira crédito kWh<br />
                  <strong style={{ color: C.gold }}>SCEE — Lei 14.300/2022</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── LEGENDA DO FLUXO ─────────────────────────────────── */}
          <div style={{
            display: "flex", gap: 10, marginBottom: 14,
          }}>
            {[
              { cor: C.gold, label: "Corrente Contínua (CC)", desc: "Painéis → Inversor" },
              { cor: C.greenLight, label: "Corrente Alternada (CA)", desc: "Inversor → Consumo" },
              { cor: "#60A5FA", label: "Sinal de proteção/controle", desc: "String Box / DPS" },
              { cor: "#A78BFA", label: "Bifurcação (consumo × excedente)", desc: "Quadro Geral" },
            ].map(l => (
              <div key={l.label} style={{
                flex: 1, display: "flex", alignItems: "flex-start", gap: 8,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 6, padding: "8px 10px",
              }}>
                <div style={{ width: 24, height: 3, backgroundColor: l.cor, borderRadius: 2, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: l.cor }}>{l.label}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.45)" }}>{l.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── 4 BENEFÍCIOS ─────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { icon: "💰", title: "Economia até 95%", desc: "Energia solar gratuita reduz a conta desde o 1º mês.", color: C.green },
              { icon: "🏡", title: "Valorização 3–6%", desc: "Imóvel solar vale mais no mercado imobiliário.", color: C.gold },
              { icon: "🛡️", title: "Proteção Tarifária", desc: "Blindagem real contra reajustes anuais da energia.", color: "#60A5FA" },
              { icon: "🌱", title: "Sustentabilidade", desc: "Zero emissões de CO₂ — energia 100% limpa.", color: C.greenLight },
            ].map(b => (
              <div key={b.title} style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 8, padding: "12px 12px",
                borderTop: `3px solid ${b.color}`,
              }}>
                <div style={{ fontSize: 20, marginBottom: 5 }}>{b.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.white, marginBottom: 3 }}>{b.title}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{b.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="03" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 4 — ESCOPO DO PROJETO
// ══════════════════════════════════════════════════════════════════════════
const Page4 = ({ data }: { data: any }) => {
  const { empresa, cliente, sistema, geracaoMeses } = data;
  const maxGer = Math.max(...geracaoMeses);
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="03" title="Escopo do Projeto" subtitle={`Potencial de Geração Solar — ${cliente.cidade}/${cliente.uf}`} />

        <div style={{ padding: "0 40px" }}>
          {/* Info localização */}
          <div style={{
            backgroundColor: C.navy, borderRadius: 10, padding: "16px 24px",
            display: "flex", gap: 32, marginBottom: 28, alignItems: "center",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>📍</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Localização</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{cliente.cidade}/{cliente.uf}</div>
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
            {[
              { l: "Irradiação Média", v: "5,2 kWh/m²/dia", c: C.gold },
              { l: "Horas de Sol Pleno", v: "5,2 h/dia", c: C.greenLight },
              { l: "Tipo de Instalação", v: sistema.localInstalacao, c: C.white },
              { l: "Fornecimento", v: sistema.tipoFornecimento, c: C.white },
            ].map(item => (
              <div key={item.l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.c }}>{item.v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{item.l}</div>
              </div>
            ))}
          </div>

          {/* Gráfico de barras - geração */}
          <div style={{
            backgroundColor: C.white, border: `1px solid ${C.gray200}`,
            borderRadius: 10, padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>
              Estimativa de Geração Mensal (kWh)
            </div>
            <div style={{ fontSize: 10, color: C.gray600, marginBottom: 16 }}>
              Variação natural por sazonalidade e insolação regional · Ano base 2025
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140 }}>
              {geracaoMeses.map((v: number, i: number) => {
                const pct = (v / maxGer) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 700, marginBottom: 4 }}>{v}</div>
                    <div style={{
                      width: "100%", height: `${pct}%`,
                      background: `linear-gradient(180deg, ${C.greenLight}, ${C.green})`,
                      borderRadius: "4px 4px 0 0",
                      minHeight: 8,
                    }} />
                    <div style={{ fontSize: 9, color: C.gray600, marginTop: 6 }}>{MESES[i]}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: C.gray400, marginTop: 12, fontStyle: "italic" }}>
              * Valores estimados com base na irradiação histórica local. Geração real pode variar ±5% conforme condições climáticas.
            </div>
          </div>

          {/* Tabela resumo */}
          <div style={{
            border: `1px solid ${C.gray200}`, borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{
              backgroundColor: C.navy, padding: "12px 20px",
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>Resumo do Potencial Energético</span>
            </div>
            <div style={{ display: "flex" }}>
              {[
                { l: "Tarifa de Energia", v: `R$ ${data.sistema.tarifa.toFixed(2)}/kWh`, color: C.navy, highlight: false },
                { l: "Geração Anual", v: `${fmtN(sistema.geracaoAnual)} kWh`, color: C.navy, highlight: false },
                { l: "Geração Mensal", v: `${fmtN(sistema.geracaoMensal)} kWh/mês`, color: C.green, highlight: true },
                { l: "Economia Mensal", v: `R$ ${fmt(sistema.economiaMensal)}`, color: C.gold, highlight: true },
              ].map((col, i) => (
                <div key={col.l} style={{
                  flex: 1, padding: "18px 16px", textAlign: "center",
                  backgroundColor: col.highlight ? (i === 3 ? "rgba(232,146,10,0.08)" : "rgba(22,163,74,0.08)") : C.white,
                  borderRight: i < 3 ? `1px solid ${C.gray200}` : "none",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: col.color }}>{col.v}</div>
                  <div style={{ fontSize: 10, color: C.gray600, marginTop: 4 }}>{col.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="04" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 5 — ESPECIFICAÇÕES DO SISTEMA
// ══════════════════════════════════════════════════════════════════════════
const Page5 = ({ data }: { data: any }) => {
  const { empresa, sistema, equipment: rawEq } = data;
  const typeLabels: Record<string, string> = { module: 'Módulo Fotovoltaico', inverter: 'Inversor Solar', structure: 'Estrutura de Fixação', stringbox: 'String Box CC/CA', cable: 'Cabos e Conectores', protection: 'Proteção', other: 'Outros' };
  const equip = (rawEq && rawEq.length > 0 ? rawEq : [
    { type: 'module', description: 'Painel Monocristalino', brand: '—', model: '—', quantity: sistema.modulosQtd },
    { type: 'inverter', description: 'Inversor On-Grid', brand: '—', model: '—', quantity: 1 },
    { type: 'structure', description: 'Estrutura de Fixação', brand: '—', model: '—', quantity: 1 },
  ]).map((eq: any) => ({
    tipo: typeLabels[eq.type] || eq.type || '—',
    desc: eq.description || '—',
    marca: eq.brand || '—',
    modelo: eq.model || '—',
    qtd: eq.quantity || 1,
  }));
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="04" title="Especificações do Sistema" subtitle="Dimensionamento técnico e lista de equipamentos" />

        <div style={{ padding: "0 40px" }}>
          {/* 6 métricas */}
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            {[
              { l: "Potência do Sistema", v: `${sistema.potenciaKwp} kWp`, c: C.green },
              { l: "Módulos Fotovoltaicos", v: `${sistema.modulosQtd} un.`, c: C.navy },
              { l: "Geração Mensal", v: `${fmtN(sistema.geracaoMensal)} kWh`, c: C.green },
              { l: "Geração Anual", v: `${fmtN(sistema.geracaoAnual)} kWh`, c: C.navy },
              { l: "Consumo Mensal", v: `${fmtN(sistema.consumoMensal)} kWh`, c: C.navy },
              { l: "Compensação", v: `${sistema.compensacaoPerc}%`, c: C.gold },
            ].map(m => (
              <div key={m.l} style={{
                flex: 1, backgroundColor: C.white,
                border: `1px solid ${C.gray200}`, borderRadius: 8,
                padding: "14px 10px", textAlign: "center",
                borderTop: `3px solid ${m.c}`,
              }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 9, color: C.gray600, marginTop: 4, lineHeight: 1.4 }}>{m.l}</div>
              </div>
            ))}
          </div>

          {/* Tabela equipamentos */}
          <div style={{ border: `1px solid ${C.gray200}`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ backgroundColor: C.navy, padding: "12px 20px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Lista de Equipamentos</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: C.gray50 }}>
                  {["Tipo", "Descrição", "Marca", "Modelo", "Qtd"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", fontSize: 10, fontWeight: 700,
                      color: C.gray600, textAlign: "left",
                      borderBottom: `1px solid ${C.gray200}`,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equip.map((row: any, i: number) => (
                  <tr key={row.tipo} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50 }}>
                    <td style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: C.navy, borderBottom: `1px solid ${C.gray100}` }}>{row.tipo}</td>
                    <td style={{ padding: "10px 14px", fontSize: 10, color: C.gray600, borderBottom: `1px solid ${C.gray100}` }}>{row.desc}</td>
                    <td style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: C.green, borderBottom: `1px solid ${C.gray100}` }}>{row.marca}</td>
                    <td style={{ padding: "10px 14px", fontSize: 10, color: C.gray800, borderBottom: `1px solid ${C.gray100}` }}>{row.modelo}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 900, color: C.navy, textAlign: "center", borderBottom: `1px solid ${C.gray100}` }}>{row.qtd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Info instalação */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{
              flex: 1, backgroundColor: C.gray50,
              border: `1px solid ${C.gray200}`, borderRadius: 8, padding: "14px 18px",
            }}>
              <div style={{ fontSize: 11, color: C.gray400, marginBottom: 4 }}>LOCAL DE INSTALAÇÃO</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>🏠 {sistema.localInstalacao}</div>
            </div>
            <div style={{
              flex: 1, backgroundColor: C.gray50,
              border: `1px solid ${C.gray200}`, borderRadius: 8, padding: "14px 18px",
            }}>
              <div style={{ fontSize: 11, color: C.gray400, marginBottom: 4 }}>TIPO DE FORNECIMENTO</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>⚡ {sistema.tipoFornecimento}</div>
            </div>
            <div style={{
              flex: 1, backgroundColor: "rgba(22,163,74,0.08)",
              border: `1px solid ${C.green}`, borderRadius: 8, padding: "14px 18px",
            }}>
              <div style={{ fontSize: 11, color: C.gray400, marginBottom: 4 }}>COMPENSAÇÃO ESTIMADA</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.green }}>{sistema.compensacaoPerc}% da conta</div>
            </div>
          </div>
        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="05" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 6 — ANÁLISE FINANCEIRA
// ══════════════════════════════════════════════════════════════════════════
const Page6 = ({ data }: { data: any }) => {
  const { empresa, sistema, geracaoMeses } = data;
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="05" title="Análise Financeira" subtitle="Projeção de economia mês a mês durante o primeiro ano" />

        <div style={{ padding: "0 40px" }}>
          {/* Tabela mensal */}
          <div style={{ border: `1px solid ${C.gray200}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ backgroundColor: C.navy, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>Economia Projetada — Primeiro Ano</span>
              <span style={{ fontSize: 10, color: C.gold }}>Tarifa: R$ {sistema.tarifa.toFixed(2)}/kWh</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: C.gray50 }}>
                  {["Mês", "Geração (kWh)", "Economia (R$)", "% Suprida"].map(h => (
                    <th key={h} style={{
                      padding: "10px 16px", fontSize: 10, fontWeight: 700,
                      color: C.gray600, textAlign: "right",
                      borderBottom: `1px solid ${C.gray200}`,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MESES_FULL.map((mes, i) => {
                  const kwh = geracaoMeses[i];
                  const eco = (kwh * sistema.tarifa).toFixed(2);
                  const pct = Math.min(100, Math.round((kwh / sistema.consumoMensal) * 100));
                  return (
                    <tr key={mes} style={{ backgroundColor: i % 2 === 0 ? C.white : C.gray50 }}>
                      <td style={{ padding: "9px 16px", fontSize: 11, fontWeight: 600, color: C.navy, borderBottom: `1px solid ${C.gray100}` }}>{mes}</td>
                      <td style={{ padding: "9px 16px", fontSize: 11, color: C.green, fontWeight: 700, textAlign: "right", borderBottom: `1px solid ${C.gray100}` }}>{fmtN(kwh)}</td>
                      <td style={{ padding: "9px 16px", fontSize: 11, color: C.navy, fontWeight: 700, textAlign: "right", borderBottom: `1px solid ${C.gray100}` }}>R$ {fmt(Number(eco))}</td>
                      <td style={{ padding: "9px 16px", fontSize: 11, textAlign: "right", borderBottom: `1px solid ${C.gray100}` }}>
                        <span style={{
                          backgroundColor: pct >= 90 ? "rgba(22,163,74,0.12)" : "rgba(232,146,10,0.12)",
                          color: pct >= 90 ? C.green : C.gold,
                          fontWeight: 700, fontSize: 11,
                          padding: "2px 8px", borderRadius: 4,
                        }}>{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
                {/* Total */}
                <tr style={{ backgroundColor: C.navy }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: C.gold }}>TOTAL ANUAL</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: C.greenLight, textAlign: "right" }}>{fmtN(sistema.geracaoAnual)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 900, color: C.gold, textAlign: "right" }}>R$ {fmt(sistema.economiaAnual)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 800, color: C.gold, textAlign: "right" }}>{sistema.compensacaoPerc}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3 cards resumo */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            {[
              { icon: "💰", title: "Economia Mensal", value: `R$ ${fmt(sistema.economiaMensal)}`, sub: "média por mês", color: C.green },
              { icon: "📅", title: "Payback", value: `${sistema.paybackAnos} anos`, sub: "retorno do investimento", color: C.gold },
              { icon: "📈", title: "ROI em 25 Anos", value: `${sistema.roi}%`, sub: "retorno acumulado", color: C.navy },
            ].map(c => (
              <div key={c.title} style={{
                flex: 1, textAlign: "center",
                border: `2px solid ${c.color}`, borderRadius: 10, padding: "18px 16px",
                backgroundColor: C.white,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{c.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginTop: 4 }}>{c.title}</div>
                <div style={{ fontSize: 9, color: C.gray400 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Alerta urgência */}
          <div style={{
            backgroundColor: "#FFF7ED",
            border: `2px solid ${C.gold}`,
            borderRadius: 10, padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ fontSize: 28 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>Cada mês sem energia solar custa dinheiro!</div>
              <div style={{ fontSize: 11, color: C.gray600 }}>
                Você está pagando <strong>R$ {fmt(sistema.economiaMensal)}/mês</strong> que poderia estar no seu bolso.
                Nos próximos 12 meses, isso representa <strong style={{ color: C.red }}>R$ {fmt(sistema.economiaAnual)}</strong> perdidos.
              </div>
            </div>
          </div>
        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="06" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 7 — GERAÇÃO VS CONSUMO + SERVIÇOS
// ══════════════════════════════════════════════════════════════════════════
const Page7 = ({ data }: { data: any }) => {
  const { empresa, sistema, geracaoMeses, consumoMeses, timeline } = data;
  const maxVal = Math.max(...geracaoMeses, ...consumoMeses);
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="06" title="Geração vs. Consumo" subtitle="Comparativo mensal de energia gerada × consumida" />

        <div style={{ padding: "0 40px" }}>
          {/* Gráfico duplas barras */}
          <div style={{
            backgroundColor: C.white, border: `1px solid ${C.gray200}`,
            borderRadius: 10, padding: "20px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>Consumo × Geração (kWh/mês)</div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, backgroundColor: C.gold, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: C.gray600 }}>Consumo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, backgroundColor: C.green, borderRadius: 2 }} />
                  <span style={{ fontSize: 10, color: C.gray600 }}>Geração</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
              {MESES.map((mes, i) => {
                const cons = consumoMeses[i];
                const ger = geracaoMeses[i];
                const consH = (cons / maxVal) * 110;
                const gerH = (ger / maxVal) * 110;
                return (
                  <div key={mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
                      <div style={{
                        width: "44%", height: consH,
                        background: `linear-gradient(180deg, ${C.goldLight}, ${C.gold})`,
                        borderRadius: "3px 3px 0 0", minHeight: 4,
                      }} />
                      <div style={{
                        width: "44%", height: gerH,
                        background: `linear-gradient(180deg, ${C.greenLight}, ${C.green})`,
                        borderRadius: "3px 3px 0 0", minHeight: 4,
                      }} />
                    </div>
                    <div style={{ fontSize: 9, color: C.gray600, marginTop: 4 }}>{mes}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela resumo */}
          <div style={{ border: `1px solid ${C.gray200}`, borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ display: "flex", backgroundColor: C.gray50, borderBottom: `1px solid ${C.gray200}` }}>
              {["Geração Média", "Consumo Médio", "% Suprido", "Valor Médio da Conta"].map(h => (
                <div key={h} style={{ flex: 1, padding: "10px 14px", fontSize: 10, fontWeight: 700, color: C.gray600, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>
            <div style={{ display: "flex" }}>
              {[
                { v: `${fmtN(sistema.geracaoMensal)} kWh/mês`, c: C.green },
                { v: `${fmtN(sistema.consumoMensal)} kWh/mês`, c: C.gold },
                { v: `${sistema.compensacaoPerc}%`, c: C.green },
                { v: `R$ ${fmt(sistema.economiaMensal)}`, c: C.navy },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, padding: "14px", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.gray200}` : "none" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: item.c }}>{item.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 07 — Serviços */}
          <div style={{
            backgroundColor: C.navy, borderRadius: 10, padding: "20px 24px",
          }}>
            <div style={{
              display: "inline-block", backgroundColor: C.gold,
              color: C.navy, fontSize: 10, fontWeight: 700, padding: "4px 14px",
              borderRadius: 20, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16,
            }}>07 — Serviços Ofertados</div>

            <div style={{ display: "flex", gap: 12 }}>
              {[
                { icon: "📋", title: "Projeto de Engenharia", desc: `ART/CREA, memorial descritivo, diagrama unifilar e layout (${timeline.engDays})` },
                { icon: "📦", title: "Equipamentos", desc: "Fornecimento e entrega de todos os materiais na obra" },
                { icon: "🏢", title: "Homologação", desc: `Registro completo na ${sistema.concessionaria} (${timeline.homologDays})` },
                { icon: "📡", title: "Monitoramento", desc: "Acompanhamento remoto do sistema por 12 meses" },
                { icon: "🔧", title: "Instalação Completa", desc: `Montagem, cabeamento, comissionamento e testes (${timeline.installDays})` },
              ].map(s => (
                <div key={s.title} style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8, padding: "16px 14px",
                  borderTop: `3px solid ${C.green}`,
                }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="07" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 8 — KITS COMERCIAIS (PREÇO)
// ══════════════════════════════════════════════════════════════════════════
const Page8 = ({ data }: { data: any }) => {
  const { empresa, kits } = data;
  const garantiasLabels = {
    engenharia: "Projeto de Engenharia",
    equipamentos: "Equipamentos Inclusos",
    homologacao: "Homologação Concessionária",
    monitoramento: "Monitoramento 12 meses",
    seguro: "Seguro da Instalação",
    suporte24h: "Suporte Técnico 24h",
  };
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="08" title="Kits Comerciais" subtitle="Escolha a opção ideal para o seu perfil de consumo e investimento" />

        <div style={{ padding: "0 32px" }}>
          {/* Ancoragem header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.gray600 }}>
              🎯 <strong>Estratégia de Valor:</strong> Todo o sistema, instalado e homologado, pronto para gerar economia desde o primeiro dia.
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
            {kits.map((kit: any) => {
              const isRec = kit.badge === "★ RECOMENDADO";
              const descontoVal = kit.precoOriginal - kit.precoFinal;
              return (
                <div key={kit.nome} style={{
                  flex: 1, borderRadius: 12, overflow: "hidden",
                  border: isRec ? `3px solid ${C.gold}` : `1px solid ${C.gray200}`,
                  backgroundColor: C.white,
                  boxShadow: isRec ? `0 8px 32px rgba(232,146,10,0.25)` : `0 2px 12px rgba(0,0,0,0.06)`,
                  display: "flex", flexDirection: "column",
                  position: "relative",
                  transform: isRec ? "scale(1.02)" : "scale(1)",
                }}>
                  {/* Badge */}
                  {kit.badge && (
                    <div style={{
                      backgroundColor: C.gold, color: C.navy,
                      fontSize: 10, fontWeight: 900, textAlign: "center",
                      padding: "6px 0", letterSpacing: 1,
                    }}>{kit.badge}</div>
                  )}

                  {/* Header do kit */}
                  <div style={{
                    background: isRec
                      ? `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`
                      : `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`,
                    padding: "18px 20px",
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.white, marginBottom: 12 }}>{kit.nome}</div>

                    <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>MÓDULO</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{kit.modulo.marca}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{kit.modulo.modelo} · {kit.modulo.qtd} un.</div>

                    <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "10px 0 6px" }}>INVERSOR</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{kit.inversor.marca}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{kit.inversor.modelo} · {kit.inversor.qtd} un.</div>

                    <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "10px 0 6px" }}>ESTRUTURA</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{kit.estrutura.fabricante} — {kit.estrutura.modelo}</div>
                  </div>

                  {/* Checklist garantias */}
                  <div style={{ padding: "14px 16px", flex: 1 }}>
                    {Object.entries(garantiasLabels).map(([key, label]) => (
                      <div key={key} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "5px 0", borderBottom: `1px solid ${C.gray100}`,
                      }}>
                        <span style={{ fontSize: 12, color: kit.garantias[key] ? C.green : C.red }}>
                          {kit.garantias[key] ? "✅" : "❌"}
                        </span>
                        <span style={{ fontSize: 10, color: kit.garantias[key] ? C.gray800 : C.gray400 }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Preço */}
                  <div style={{
                    padding: "16px 18px",
                    borderTop: `2px solid ${isRec ? C.gold : C.gray200}`,
                    backgroundColor: isRec ? "#FFFBEB" : C.white,
                  }}>
                    <div style={{
                      display: "inline-block",
                      backgroundColor: C.green, color: C.white,
                      fontSize: 9, fontWeight: 700, padding: "3px 10px",
                      borderRadius: 20, marginBottom: 8,
                    }}>🎉 {kit.desconto}% OFF — Economia de R$ {fmt(descontoVal)}</div>

                    <div style={{
                      fontSize: 10, color: C.gray400, textDecoration: "line-through",
                      textDecorationColor: C.red, marginBottom: 4,
                    }}>
                      De R$ {fmt(kit.precoOriginal)}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: isRec ? C.gold : C.navy }}>
                      R$ {fmt(kit.precoFinal)}
                    </div>
                    <div style={{ fontSize: 9, color: C.gray400 }}>à vista · ou consulte parcelamento</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nota rodapé */}
          <div style={{
            marginTop: 16, padding: "12px 20px",
            backgroundColor: "rgba(10,22,40,0.06)", borderRadius: 8,
            fontSize: 10, color: C.gray600, textAlign: "center",
          }}>
            ⚠️ Preços válidos até <strong>{data.proposta.validade}</strong> · Sujeito a disponibilidade de estoque ·
            Condições de parcelamento via financiamento solar disponíveis · CNPJ {empresa.cnpj}
          </div>
        </div>
      </div>
      <PageFooter empresa={empresa} pageNum="08" />
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// PÁGINA 9 — GARANTIAS + CRONOGRAMA + ASSINATURAS
// ══════════════════════════════════════════════════════════════════════════
const Page9 = ({ data }: { data: any }) => {
  const { empresa, cliente, timeline, warranties, sistema } = data;
  return (
    <Page style={{ color: C.white }}>
      <div style={{ padding: "0 0 80px" }}>
        <SectionHeader num="09" title="Garantias, Cronograma & Formalização" subtitle="Proteção total do seu investimento e próximos passos" />

        <div style={{ padding: "0 40px" }}>
          {/* 6 Cards de garantias */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            {[
              { icon: "🏗️", title: "Instalação Certificada", desc: `Equipe treinada com NR-10, NR-35 e NR-6. Prazo: ${timeline.installDays}.`, cor: C.green },
              { icon: "📋", title: "Homologação Garantida", desc: `Todo o processo junto à ${sistema.concessionaria} até a conexão (${timeline.homologDays}).`, cor: C.navy },
              { icon: "☀️", title: `Módulos: ${warranties.module}`, desc: `Garantia de performance: 90% até 10 anos e 80% até ${warranties.module} de uso.`, cor: C.green },
              { icon: "⚡", title: `Inversor: ${warranties.inverter}`, desc: "Garantia de fábrica estendida do inversor contra defeitos e falhas.", cor: C.gold },
              { icon: "📡", title: "Monitoramento 12m", desc: "Acompanhamento remoto da geração e alertas de falhas por 12 meses.", cor: C.green },
              { icon: "🛡️", title: "Suporte Técnico", desc: "Atendimento pós-venda para dúvidas, ajustes e manutenções preventivas.", cor: C.navy },
            ].map(g => (
              <div key={g.title} style={{
                width: "calc(33.33% - 8px)",
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, padding: "16px 18px",
                borderLeft: `4px solid ${g.cor}`,
                boxSizing: "border-box" as const,
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{g.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 6 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{g.desc}</div>
              </div>
            ))}
          </div>

          {/* Cronograma */}
          <div style={{
            backgroundColor: C.navy, borderRadius: 10, padding: "20px 24px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.white, marginBottom: 16 }}>
              🗓️ Cronograma de Execução
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {[
                { step: "01", title: "Aprovação", prazo: "Dia 1", icon: "✍️" },
                { step: "02", title: "Engenharia", prazo: timeline.engDays, icon: "📐" },
                { step: "03", title: "Instalação", prazo: timeline.installDays, icon: "🔧" },
                { step: "04", title: "Homologação", prazo: timeline.homologDays, icon: "📋" },
                { step: "05", title: "Conexão", prazo: "Após aprova.", icon: "⚡" },
              ].map((etapa, i) => (
                <div key={etapa.step} style={{ display: "flex", alignItems: "center", flex: i < 4 ? "1 1 auto" : "0 0 auto" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      backgroundColor: C.green, border: `3px solid ${C.greenLight}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, margin: "0 auto 6px",
                    }}>{etapa.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.white }}>{etapa.title}</div>
                    <div style={{ fontSize: 9, color: C.gold }}>{etapa.prazo}</div>
                  </div>
                  {i < 4 && (
                    <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${C.green}, rgba(22,163,74,0.3))`, margin: "0 4px", marginBottom: 20 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assinaturas */}
          <div style={{
            border: `1px solid ${C.gray200}`, borderRadius: 10, padding: "20px 24px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 16 }}>
              📝 Aceite e Formalização da Proposta
            </div>
            <div style={{ display: "flex", gap: 48 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.gray400, marginBottom: 4 }}>CONTRATADA</div>
                <div style={{ borderBottom: `2px solid ${C.gray800}`, height: 40, marginBottom: 8 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>Êxito Grid — Eficiência Elétrica & Solar</div>
                <div style={{ fontSize: 10, color: C.gray600 }}>Engenheiro Responsável · CREA/PE</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.gray400, marginBottom: 4 }}>CONTRATANTE</div>
                <div style={{ borderBottom: `2px solid ${C.gray800}`, height: 40, marginBottom: 8 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>{cliente.nome}</div>
                <div style={{ fontSize: 10, color: C.gray600 }}>CPF/CNPJ: {cliente.cpfCnpj}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.gray400, marginBottom: 4 }}>LOCAL E DATA</div>
                <div style={{ borderBottom: `2px solid ${C.gray800}`, height: 40, marginBottom: 8 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>{cliente.cidade}/{cliente.uf}</div>
                <div style={{ fontSize: 10, color: C.gray600 }}>______ / ______ / __________</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé final */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: `linear-gradient(90deg, ${C.navy}, ${C.navyMid})`,
        padding: "14px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: `3px solid ${C.gold}`,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.white }}>Êxito Grid Eficiência Elétrica & Solar</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>CNPJ {empresa.cnpj} · {empresa.endereco}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: C.gold }}>⚡ Energia do sol. Economia real. ⚡</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{empresa.site}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{empresa.fone}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{empresa.email}</div>
          <div style={{ fontSize: 9, color: C.gold, fontWeight: 700 }}>09 / 09</div>
        </div>
      </div>
    </Page>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — EXPORTED para o ERP
// ══════════════════════════════════════════════════════════════════════════
export function SolarProposalPDFTemplate({ proposal, solarProject, company }: SolarProposalPDFTemplateProps) {
  const data = buildData(proposal, solarProject, company);
  const hasKits = data.kits && data.kits.length > 0;

  return (
    <div id="proposal-pdf-content" style={{ background: C.white, maxWidth: 794, margin: '0 auto' }}>
      <Page1 data={data} />
      <Page2 data={data} />
      <Page3 data={data} />
      <Page4 data={data} />
      <Page5 data={data} />
      <Page6 data={data} />
      <Page7 data={data} />
      {hasKits && <Page8 data={data} />}
      <Page9 data={data} />
    </div>
  );
}
