import React from 'react';
import { EXITO_GRID_LOGO } from '@/assets/exito-grid-logo-base64';

interface Props {
  proposal: any;
  company?: any;
  signatures?: Record<string, { imageUrl?: string; signerName?: string; signerRole?: string; signerDocument?: string }>;
}

const fmt = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fDate = (d: any) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

export function RentalProposalPDFTemplate({ proposal, company, signatures }: Props) {
  const co = company || {};
  const empresa = {
    nome: co.razaoSocial || co.name || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
    cnpj: co.cnpj || '55.303.935/0001-39',
    endereco: co.address ? `${co.address}${co.number ? ', '+co.number : ''} — ${co.neighborhood || ''}, ${co.city || 'Recife'}/${co.state || 'PE'}` : 'R General Polidoro, 352 — Varzea, Recife/PE',
    telefone: co.phone || '(81) 8887-0766',
    email: co.email || 'contato@exitogrid.com.br',
  };

  const clientName = proposal.client?.name || '—';
  const clientDoc = proposal.client?.document || '—';
  const clientAddr = proposal.client?.address || '—';
  const clientPhone = proposal.client?.phone || '';
  const clientEmail = proposal.client?.email || '';

  let snap: any = {};
  try { snap = proposal.pricingEngineData ? JSON.parse(proposal.pricingEngineData) : {}; } catch { snap = {}; }

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const validUntil = proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('pt-BR') : '30 dias';
  const total = Number(proposal.total || 0);

  const CAT: Record<string, string> = {
    munck:'Munck',crane:'Guindaste',truck:'Caminhão',flatbed_truck:'Cam. Prancha',excavator:'Retroescavadeira',
    backhoe:'Pá Carregadeira',generator:'Gerador',compressor:'Compressor',aerial_platform:'Plataforma',
    forklift:'Empilhadeira',concrete_mixer:'Betoneira',welding_machine:'Máq. Solda',drill:'Perfuratriz/Furadeira',
    roller:'Rolo Compactador',mini_excavator:'Mini Escavadeira',skid_loader:'Mini Carregadeira',
    tractor:'Trator',trailer:'Carreta',container:'Container',scaffold:'Andaime',
    water_truck:'Cam. Pipa',dump_truck:'Cam. Caçamba',boom_truck:'Cam. Lança',
  };
  const BIL: Record<string, string> = { daily:'Diária', monthly:'Mensal', hourly:'Por Hora', fixed_period:'Período Fechado' };

  const catLabel = CAT[snap.equipmentCategory] || snap.equipmentCategory || 'Equipamento';
  const bilLabel = BIL[snap.billingModality] || 'Diária';
  const specs = snap.equipmentSpecs || {};
  const specEntries = Object.entries(specs).filter(([,v]) => v != null && v !== '');
  const clauses: string[] = snap.clauses || [];
  const hasAdditionals = snap.overtimeRate > 0 || snap.nightRate > 0 || snap.holidayRate > 0 || snap.weekendRate > 0;

  const rateLabel = (mode: string, rate: number) => mode === 'percent' ? `${rate}%` : fmt(rate);

  let secIdx = 0;
  const ns = () => ++secIdx;

  // Styles
  const s = {
    page: { fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a', lineHeight: '1.55', maxWidth: 800, margin: '0 auto', background: '#fff' } as React.CSSProperties,
    hero: { background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)', padding: '36px 40px 30px', position: 'relative' as const } as React.CSSProperties,
    accent: { height: '4px', background: 'linear-gradient(90deg, #22c55e 0%, #0ea5e9 50%, #6366f1 100%)' } as React.CSSProperties,
    body: { padding: '28px 40px' } as React.CSSProperties,
    secTitle: { fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' as const, letterSpacing: '2px', borderBottom: '3px solid #22c55e', paddingBottom: '7px', marginTop: '22px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', breakInside: 'avoid' as const, breakAfter: 'avoid' as const } as React.CSSProperties,
    secIcon: { width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 } as React.CSSProperties,
    secNum: { fontSize: '10px', fontWeight: 800, color: '#22c55e', minWidth: 16 } as React.CSSProperties,
    para: { fontSize: '9.5px', textAlign: 'justify' as const, margin: '5px 0', color: '#334155', lineHeight: '1.7' } as React.CSSProperties,
    card: { flex: 1, padding: '14px 18px', borderRadius: 10, border: '1px solid' } as React.CSSProperties,
    lbl: { fontSize: '7px', textTransform: 'uppercase' as const, letterSpacing: '1.5px', fontWeight: 700, marginBottom: 5 } as React.CSSProperties,
    nm: { fontSize: '10px', fontWeight: 700, color: '#0f172a', marginBottom: 2 } as React.CSSProperties,
    dt: { fontSize: '8.5px', color: '#475569', margin: '1px 0' } as React.CSSProperties,
  };

  return (
    <div id="rental-proposal-pdf-content" style={s.page}>
      <style>{`
        #rental-proposal-pdf-content .avoid-page-break { break-inside: avoid; page-break-inside: avoid; }
        #rental-proposal-pdf-content .sig-block { break-inside: avoid; }
        #rental-proposal-pdf-content .next-page { break-before: page; }
        #rental-proposal-pdf-content { padding-bottom: 38px; }
      `}</style>

      {/* HERO */}
      <div style={s.hero}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <img src={EXITO_GRID_LOGO} alt="Logo" style={{ height: 44, objectFit:'contain', marginBottom: 14, filter:'brightness(0) invert(1)' }} />
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 3.5, textTransform: 'uppercase', fontWeight: 600 }}>Proposta de Locação de Equipamento</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginTop: 4 }}>{proposal.title || `Locação de ${catLabel}`}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: '#94a3b8', lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700, color: '#22c55e', fontSize: 10 }}>{empresa.telefone}</div>
            <div>{empresa.email}</div>
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#64748b', marginTop: 12, display:'flex', gap: 16 }}>
          <span>Ref: {proposal.proposalNumber || '—'}</span>
          <span>{today}</span>
          <span style={{ background:'rgba(34,197,94,0.15)', color:'#22c55e', padding:'2px 10px', borderRadius:4, fontSize:8, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Válida até {validUntil}</span>
        </div>
      </div>
      <div style={s.accent} />

      <div style={s.body}>
        {/* 1. IDENTIFICAÇÃO */}
        <div style={s.secTitle}>
          <div style={{ ...s.secIcon, background:'#3b82f6' }}>👤</div>
          <span style={s.secNum}>{ns()}.</span> Identificação das Partes
        </div>
        <div style={{ display:'flex', gap:14, margin:'8px 0' }}>
          <div style={{ ...s.card, background:'#f8fafc', borderColor:'#e2e8f0' }}>
            <p style={{ ...s.lbl, color:'#64748b' }}>Contratada</p>
            <p style={s.nm}>{empresa.nome}</p>
            <p style={s.dt}>CNPJ: {empresa.cnpj}</p>
            <p style={s.dt}>{empresa.endereco}</p>
          </div>
          <div style={{ ...s.card, background:'#f0fdf4', borderColor:'#bbf7d0' }}>
            <p style={{ ...s.lbl, color:'#166534' }}>Contratante</p>
            <p style={s.nm}>{clientName}</p>
            <p style={s.dt}>CPF/CNPJ: {clientDoc}</p>
            <p style={s.dt}>{clientAddr}</p>
            {(clientPhone || clientEmail) && <p style={s.dt}>{[clientPhone, clientEmail].filter(Boolean).join(' | ')}</p>}
          </div>
        </div>

        {/* 2. EQUIPAMENTO */}
        <div style={s.secTitle}>
          <div style={{ ...s.secIcon, background:'#f59e0b' }}>🔧</div>
          <span style={s.secNum}>{ns()}.</span> Equipamento
        </div>
        <div className="avoid-page-break" style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'2px solid #fde68a', borderRadius:12, padding:'18px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:'#92400e', margin:0 }}>{snap.equipmentName || proposal.title}</p>
              <p style={{ fontSize:10, color:'#b45309', margin:'4px 0' }}>
                {[snap.equipmentBrand, snap.equipmentModel, snap.equipmentYear].filter(Boolean).join(' • ')}
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:6 }}>
                <span style={{ background:'#92400e', color:'#fef3c7', padding:'2px 10px', borderRadius:4, fontSize:8, fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>{catLabel}</span>
                {snap.equipmentPlate && <span style={{ background:'#fff', border:'1px solid #fde68a', padding:'2px 8px', borderRadius:4, fontSize:8, fontWeight:600, color:'#92400e' }}>🚗 {snap.equipmentPlate}</span>}
                {snap.equipmentSerialNumber && <span style={{ background:'#fff', border:'1px solid #fde68a', padding:'2px 8px', borderRadius:4, fontSize:8, fontWeight:600, color:'#92400e' }}>S/N: {snap.equipmentSerialNumber}</span>}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:8, color:'#b45309', textTransform:'uppercase', letterSpacing:1.5, fontWeight:700 }}>Código</p>
              <p style={{ fontSize:14, fontWeight:800, color:'#92400e' }}>{snap.equipmentCode || '—'}</p>
            </div>
          </div>
          {specEntries.length > 0 && (
            <div style={{ marginTop:12, borderTop:'1px solid #fde68a', paddingTop:10 }}>
              <p style={{ fontSize:8, fontWeight:700, color:'#92400e', textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Especificações Técnicas</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 16px' }}>
                {specEntries.map(([k, v], i) => (
                  <div key={i} style={{ fontSize:9, color:'#78350f' }}><strong>{k}:</strong> {String(v)}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. CONDIÇÕES DA LOCAÇÃO */}
        <div style={s.secTitle}>
          <div style={{ ...s.secIcon, background:'#0ea5e9' }}>📋</div>
          <span style={s.secNum}>{ns()}.</span> Condições da Locação
        </div>
        <div className="avoid-page-break" style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'16px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { l:'Modalidade', v: bilLabel },
              { l:'Valor Unitário', v: fmt(snap.unitRate) },
              { l:'Quantidade', v: String(snap.quantity || 1) },
              { l:'Tipo', v: snap.rentalType === 'with_operator' ? 'Com Operador' : 'Sem Operador' },
              { l:'Horas/Dia', v: `${snap.contractedHoursPerDay || 8}h` },
              snap.contractedPeriodDays ? { l:'Período', v: `${snap.contractedPeriodDays} dias` } : null,
              snap.startDate ? { l:'Início', v: fDate(snap.startDate) } : null,
              snap.endDate ? { l:'Término', v: fDate(snap.endDate) } : null,
              snap.includesOperator && snap.operatorName ? { l:'Operador', v: snap.operatorName } : null,
            ].filter(Boolean).map((item: any, i) => (
              <div key={i}>
                <p style={{ fontSize:7.5, textTransform:'uppercase', letterSpacing:1.5, fontWeight:700, color:'#0369a1', marginBottom:3 }}>{item.l}</p>
                <p style={{ fontSize:10, fontWeight:700, color:'#0c4a6e' }}>{item.v}</p>
              </div>
            ))}
          </div>
          {snap.deliveryAddress && (
            <div style={{ marginTop:10, borderTop:'1px solid #bae6fd', paddingTop:8 }}>
              <p style={{ fontSize:8, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:1 }}>📍 Local de Entrega</p>
              <p style={{ fontSize:9.5, color:'#0c4a6e', marginTop:2 }}>{snap.deliveryAddress}{snap.deliveryCity ? `, ${snap.deliveryCity}` : ''}{snap.deliveryState ? `/${snap.deliveryState}` : ''}</p>
            </div>
          )}
        </div>

        {/* 4. ADICIONAIS */}
        {hasAdditionals && (<>
          <div style={s.secTitle}>
            <div style={{ ...s.secIcon, background:'#8b5cf6' }}>⏱️</div>
            <span style={s.secNum}>{ns()}.</span> Adicionais
          </div>
          <div className="avoid-page-break" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
            {[
              { l:'Hora Extra', m: snap.overtimeMode, r: snap.overtimeRate, c:'#7c3aed', bg:'#f5f3ff', bc:'#ddd6fe' },
              { l:'Noturno (22h-05h)', m: snap.nightMode, r: snap.nightRate, c:'#1e40af', bg:'#eff6ff', bc:'#bfdbfe' },
              { l:'Feriado', m: snap.holidayMode, r: snap.holidayRate, c:'#b45309', bg:'#fffbeb', bc:'#fde68a' },
              { l:'Fim de Semana', m: snap.weekendMode, r: snap.weekendRate, c:'#166534', bg:'#f0fdf4', bc:'#bbf7d0' },
            ].filter(x => x.r > 0).map((x, i) => (
              <div key={i} style={{ background: x.bg, border:`1px solid ${x.bc}`, borderRadius:10, padding:'14px 12px', textAlign:'center' }}>
                <p style={{ fontSize:7.5, textTransform:'uppercase', letterSpacing:1.5, fontWeight:700, color: x.c, marginBottom:4 }}>{x.l}</p>
                <p style={{ fontSize:18, fontWeight:800, color: x.c }}>{rateLabel(x.m, x.r)}</p>
                <p style={{ fontSize:8, color:'#64748b', marginTop:2 }}>{x.m === 'percent' ? 'sobre valor base' : 'valor fixo'}</p>
              </div>
            ))}
          </div>
        </>)}

        {/* 5. CLÁUSULAS */}
        {clauses.length > 0 && (<>
          <div style={s.secTitle}>
            <div style={{ ...s.secIcon, background:'#dc2626' }}>🛡️</div>
            <span style={s.secNum}>{ns()}.</span> Cláusulas de Proteção Patrimonial
          </div>
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'16px 20px' }}>
            {clauses.map((c: string, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'5px 0', borderBottom: i < clauses.length - 1 ? '1px solid #fee2e2' : 'none' }}>
                <span style={{ fontSize:10, color:'#dc2626', fontWeight:700, flexShrink:0, marginTop:1 }}>§{i+1}</span>
                <span style={{ fontSize:9.5, color:'#991b1b', lineHeight:'1.6' }}>{c}</span>
              </div>
            ))}
          </div>
        </>)}

        {/* 6. OBRIGAÇÕES */}
        {(proposal.contractorObligations || proposal.clientObligations) && (<>
          <div style={s.secTitle}>
            <div style={{ ...s.secIcon, background:'#0891b2' }}>⚖️</div>
            <span style={s.secNum}>{ns()}.</span> Obrigações das Partes
          </div>
          <div style={{ display:'flex', gap:14 }}>
            {proposal.contractorObligations && (
              <div className="avoid-page-break" style={{ flex:1, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'16px 18px' }}>
                <p style={{ fontSize:9, fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>🏢 Contratada</p>
                {proposal.contractorObligations.split('\n').filter((l: string) => l.trim()).map((l: string, i: number) => (
                  <p key={i} style={{ fontSize:9, color:'#334155', lineHeight:'1.7', margin:'2px 0' }}>▸ {l}</p>
                ))}
              </div>
            )}
            {proposal.clientObligations && (
              <div className="avoid-page-break" style={{ flex:1, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'16px 18px' }}>
                <p style={{ fontSize:9, fontWeight:800, color:'#92400e', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>👤 Contratante</p>
                {proposal.clientObligations.split('\n').filter((l: string) => l.trim()).map((l: string, i: number) => (
                  <p key={i} style={{ fontSize:9, color:'#78350f', lineHeight:'1.7', margin:'2px 0' }}>▸ {l}</p>
                ))}
              </div>
            )}
          </div>
        </>)}

        {/* 7. INVESTIMENTO */}
        <div style={s.secTitle}>
          <div style={{ ...s.secIcon, background:'#22c55e' }}>💰</div>
          <span style={s.secNum}>{ns()}.</span> Investimento
        </div>
        <div className="avoid-page-break" style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius:14, padding:'24px 26px', color:'#fff' }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:9.5, color:'#94a3b8', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span>Locação de {catLabel} — {bilLabel}</span>
            <span style={{ fontWeight:700, color:'#e2e8f0' }}>{fmt(snap.unitRate)} x {snap.quantity || 1}</span>
          </div>
          {snap.includesOperator && Number(snap.operatorCostPerDay) > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:9.5, color:'#94a3b8', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span>Operador (custo/dia)</span>
              <span style={{ fontWeight:700, color:'#e2e8f0' }}>{fmt(snap.operatorCostPerDay)}</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderTop:'2px solid #22c55e', marginTop:12 }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#22c55e', textTransform:'uppercase', letterSpacing:1.5 }}>Valor Total</span>
            <span style={{ fontSize:24, fontWeight:900, color:'#22c55e' }}>{fmt(total)}</span>
          </div>
        </div>

        {/* 8. PAGAMENTO */}
        {proposal.paymentConditions && (<>
          <div style={s.secTitle}>
            <div style={{ ...s.secIcon, background:'#6366f1' }}>📋</div>
            <span style={s.secNum}>{ns()}.</span> Condições de Pagamento
          </div>
          <div style={{ background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:10, padding:'12px 20px' }}>
            <p style={{ ...s.para, color:'#3730a3' }}>{proposal.paymentConditions}</p>
          </div>
          <p style={{ fontSize:9, color:'#334155', margin:'8px 0', lineHeight:2 }}>▸ Esta proposta tem validade de <strong>{validUntil}</strong></p>
        </>)}

        {/* 9. ASSINATURAS */}
        <div className="sig-block" style={{ display:'flex', justifyContent:'space-between', gap:40, marginTop:44, paddingTop:20, breakInside:'avoid' as const }}>
          {['contratada','contratante'].map(pos => {
            const sig = signatures?.[pos];
            return (
              <div key={pos} style={{ flex:1, textAlign:'center', padding:'18px 14px 14px', border:'1px solid #e2e8f0', borderRadius:10, background:'#f8fafc' }}>
                {sig?.imageUrl && (
                  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:60, marginBottom:8, background:'#fff', borderRadius:8, padding:'6px 10px' }}>
                    <img src={sig.imageUrl} alt="" style={{ maxHeight:55, maxWidth:'80%', objectFit:'contain' }} />
                  </div>
                )}
                <div style={{ borderTop:'2px solid #0f172a', paddingTop:10, fontSize:10, fontWeight:700, color:'#0f172a' }}>
                  {sig?.signerName || (pos === 'contratada' ? empresa.nome : clientName)}
                </div>
                {sig?.signerDocument && <p style={{ fontSize:8, color:'#64748b', marginTop:2 }}>{sig.signerDocument}</p>}
                <span style={{ fontSize:7.5, fontWeight:700, color:'#22c55e', textTransform:'uppercase', letterSpacing:2, marginTop:6, padding:'3px 10px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:4, display:'inline-block' }}>
                  {pos === 'contratada' ? 'CONTRATADA' : 'CONTRATANTE'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#0f172a', padding:'16px 40px', textAlign:'center', marginTop:28, breakInside:'avoid' as const }}>
        <p style={{ fontSize:8, color:'#64748b', letterSpacing:1 }}>{empresa.nome} • CNPJ {empresa.cnpj} • {empresa.telefone} • {empresa.email}</p>
      </div>
    </div>
  );
}
