import React from 'react';
import { EXITO_GRID_LOGO } from '@/assets/exito-grid-logo-base64';

interface DailyLogEntry {
  id: string;
  date: string;
  originalDate?: string;
  startTime?: string;
  endTime?: string;
  normalHours?: number;
  overtimeHours?: number;
  nightHours?: number;
  isHoliday?: boolean;
  isWeekend?: boolean;
  totalValue?: number;
  workLocation?: string;
  operatorName?: string;
  equipmentId?: string;
}

interface BoletimData {
  boletimNumber?: number;
  periodStart?: string;
  periodEnd?: string;
  totalValue?: number;
  totalNormalHours?: number;
  totalOvertimeHours?: number;
  totalNightHours?: number;
  notes?: string;
  status?: string;
  cnpjFaturamentoOverride?: string; // CNPJ sobrescrito pelo cliente
  cnpjSolicitanteOverride?: string;
  cnpjOverrideLog?: string; // Motivo/log da sobrescrita
}

interface RentalData {
  code?: string;
  equipment?: { name?: string; code?: string };
  client?: { name?: string; document?: string; cnpj?: string };
  operatorName?: string;
  deliveryCity?: string;
  cnpjSolicitante?: string;
  cnpjFaturamento?: string;
  unitRate?: number;
  billingModality?: string;
  contractedHoursPerDay?: number;
}

interface Props {
  boletim: BoletimData;
  rental: RentalData;
  logs: DailyLogEntry[];
  company?: any;
  signatures?: Record<string, { imageUrl?: string; signerName?: string; signerRole?: string; signerDocument?: string }>;
  isCollective?: boolean; // se true, não renderiza header/footer (parte de PDF maior)
  pageBreakBefore?: boolean;
}

const fmt = (v: any) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fDate = (d: any) => {
  if (!d) return '—';
  const s = String(d).substring(0, 10);
  const [y, m, dy] = s.split('-');
  return `${dy}/${m}/${y}`;
};
const fHours = (h: any) => Number(h || 0).toFixed(1) + 'h';
const BIL: Record<string, string> = { daily: 'Diária', monthly: 'Mensal', hourly: 'Por Hora', fixed_period: 'Período Fechado' };

export function BoletimPDFTemplate({ boletim, rental, logs, company, signatures, pageBreakBefore }: Props) {
  const co = company || {};
  const empresa = {
    nome: co.razaoSocial || co.name || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
    cnpj: co.cnpj || '55.303.935/0001-39',
    endereco: co.address
      ? `${co.address}${co.number ? ', ' + co.number : ''} — ${co.neighborhood || ''}, ${co.city || 'Recife'}/${co.state || 'PE'}`
      : 'R General Polidoro, 352 — Varzea, Recife/PE',
    telefone: co.phone || '(81) 8887-0766',
    email: co.email || 'contato@exitogrid.com.br',
  };

  const clientName = rental.client?.name || '—';
  const cnpjFat = boletim.cnpjFaturamentoOverride || rental.cnpjFaturamento || rental.client?.document || rental.client?.cnpj || '';
  const cnpjSol = boletim.cnpjSolicitanteOverride || rental.cnpjSolicitante || '';

  // Totals
  const totalNormal = logs.reduce((s, l) => s + Number(l.normalHours || 0), 0);
  const totalOver = logs.reduce((s, l) => s + Number(l.overtimeHours || 0), 0);
  const totalNight = logs.reduce((s, l) => s + Number(l.nightHours || 0), 0);
  const totalVal = logs.reduce((s, l) => s + Number(l.totalValue || 0), 0);
  const holidayDays = logs.filter(l => l.isHoliday).length;
  const weekendDays = logs.filter(l => l.isWeekend && !l.isHoliday).length;

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const s = {
    page: {
      fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '10pt', color: '#1a1a1a',
      lineHeight: '1.5', maxWidth: 794, margin: '0 auto', background: '#fff',
      pageBreakBefore: pageBreakBefore ? 'always' : undefined,
    } as React.CSSProperties,
    hero: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e293b 100%)',
      padding: '28px 36px 22px',
    } as React.CSSProperties,
    accent: { height: '4px', background: 'linear-gradient(90deg, #22c55e 0%, #0ea5e9 50%, #6366f1 100%)' } as React.CSSProperties,
    body: { padding: '22px 36px' } as React.CSSProperties,
    secTitle: {
      fontSize: '9px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' as const,
      letterSpacing: '2px', borderBottom: '2px solid #22c55e', paddingBottom: '5px',
      marginTop: '18px', marginBottom: '10px', breakInside: 'avoid' as const,
    } as React.CSSProperties,
    label: { fontSize: '7px', textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 700, color: '#64748b', marginBottom: 2 } as React.CSSProperties,
    value: { fontSize: '9.5px', fontWeight: 600, color: '#0f172a' } as React.CSSProperties,
    cell: { padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontSize: '8.5px' } as React.CSSProperties,
    thCell: { padding: '7px 8px', background: '#0f172a', color: '#e2e8f0', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.8px' } as React.CSSProperties,
  };

  return (
    <div id="boletim-pdf-content" style={s.page}>
      <style>{`
        #boletim-pdf-content .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        #boletim-pdf-content .sig-block { break-inside: avoid; }
        #boletim-pdf-content table { border-collapse: collapse; width: 100%; }
        #boletim-pdf-content .override-notice { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 8px 12px; margin-top: 8px; font-size: 8px; color: #92400e; }
      `}</style>

      {/* HEADER */}
      <div style={s.hero}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <img src={EXITO_GRID_LOGO} alt="Logo" style={{ height: 42, marginBottom: 10 }} />
            <div style={{ fontSize: '8px', color: '#94a3b8', lineHeight: 1.7 }}>
              <div>{empresa.nome}</div>
              <div>CNPJ: {empresa.cnpj}</div>
              <div>{empresa.endereco}</div>
              <div>{empresa.telefone} • {empresa.email}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: 1 }}>
              BOLETIM DE MEDIÇÃO
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e', marginTop: 4 }}>
              Nº {String(boletim.boletimNumber || 1).padStart(3, '0')} — {rental.code || '—'}
            </div>
            <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: 6 }}>
              Período: {fDate(boletim.periodStart)} a {fDate(boletim.periodEnd)}
            </div>
            <div style={{ fontSize: '8px', color: '#94a3b8' }}>Emitido em: {today}</div>
            <div style={{ marginTop: 8, padding: '4px 12px', background: boletim.status === 'approved' ? '#166534' : boletim.status === 'billed' ? '#1e3a5f' : '#334155', borderRadius: 4, fontSize: '8px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              {boletim.status === 'approved' ? '✓ Aprovado' : boletim.status === 'billed' ? '✓ Faturado' : 'Gerado'}
            </div>
          </div>
        </div>
      </div>
      <div style={s.accent} />

      <div style={s.body}>

        {/* DADOS DA LOCAÇÃO */}
        <div style={s.secTitle}>📋 Dados da Locação</div>
        <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px', marginBottom: 6 }}>
          {[
            { label: 'Locação', value: rental.code || '—' },
            { label: 'Equipamento', value: rental.equipment?.name || '—' },
            { label: 'Código Equip.', value: rental.equipment?.code || '—' },
            { label: 'Operador', value: rental.operatorName || '—' },
            { label: 'Modalidade', value: BIL[rental.billingModality || ''] || '—' },
            { label: 'H/Dia Contratadas', value: rental.contractedHoursPerDay ? `${rental.contractedHoursPerDay}h` : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={s.label}>{label}</div>
              <div style={s.value}>{value}</div>
            </div>
          ))}
        </div>

        {/* DADOS DO CLIENTE / CNPJs */}
        <div style={s.secTitle}>🏢 Cliente e CNPJs</div>
        <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px 16px' }}>
          <div>
            <div style={s.label}>Cliente / Contratante</div>
            <div style={s.value}>{clientName}</div>
          </div>
          <div>
            <div style={s.label}>CNPJ Faturamento</div>
            <div style={s.value}>{cnpjFat || '—'}</div>
            {boletim.cnpjFaturamentoOverride && rental.cnpjFaturamento && boletim.cnpjFaturamentoOverride !== rental.cnpjFaturamento && (
              <div style={{ fontSize: '7px', color: '#92400e', fontStyle: 'italic' }}>
                ⚠ Redirecionado (orig: {rental.cnpjFaturamento})
              </div>
            )}
          </div>
          <div>
            <div style={s.label}>CNPJ Solicitante</div>
            <div style={s.value}>{cnpjSol || '—'}</div>
          </div>
        </div>

        {/* Aviso de CNPJ override */}
        {boletim.cnpjOverrideLog && (
          <div className="override-notice">
            <strong>⚠ Controle Interno — CNPJ Redirecionado:</strong> {boletim.cnpjOverrideLog}
          </div>
        )}

        {/* TABELA DE DIÁRIAS */}
        <div style={s.secTitle}>📅 Diárias Registradas ({logs.length} dia{logs.length !== 1 ? 's' : ''})</div>
        <div className="avoid-break">
          <table>
            <thead>
              <tr>
                {['#', 'Data', 'Horário', 'H.Norm', 'H.Extra', 'H.Not', 'Tipo', 'Valor', 'Local/Operador'].map(h => (
                  <th key={h} style={s.thCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => {
                const isAdapted = log.originalDate && String(log.originalDate).substring(0, 10) !== String(log.date).substring(0, 10);
                const tipo = log.isHoliday ? '🗓 Feriado' : log.isWeekend ? '📅 F.Sem' : '📆 Útil';
                return (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <td style={{ ...s.cell, textAlign: 'center', color: '#64748b', fontSize: '7.5px' }}>{i + 1}</td>
                    <td style={s.cell}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{fDate(log.date)}</div>
                      {isAdapted && (
                        <div style={{ fontSize: '7px', color: '#b45309', fontStyle: 'italic' }}>
                          orig: {fDate(log.originalDate)}
                        </div>
                      )}
                    </td>
                    <td style={{ ...s.cell, fontSize: '8px', color: '#475569' }}>
                      {log.startTime && log.endTime ? `${log.startTime}–${log.endTime}` : '—'}
                    </td>
                    <td style={{ ...s.cell, textAlign: 'center' }}>{fHours(log.normalHours)}</td>
                    <td style={{ ...s.cell, textAlign: 'center', color: Number(log.overtimeHours) > 0 ? '#d97706' : '#94a3b8' }}>
                      {fHours(log.overtimeHours)}
                    </td>
                    <td style={{ ...s.cell, textAlign: 'center', color: Number(log.nightHours) > 0 ? '#6366f1' : '#94a3b8' }}>
                      {fHours(log.nightHours)}
                    </td>
                    <td style={{ ...s.cell, fontSize: '8px' }}>{tipo}</td>
                    <td style={{ ...s.cell, textAlign: 'right', fontWeight: 700, color: '#166534' }}>{fmt(log.totalValue)}</td>
                    <td style={{ ...s.cell, fontSize: '7.5px', color: '#475569' }}>
                      <div>{log.workLocation || '—'}</div>
                      {log.operatorName && <div style={{ color: '#64748b', fontStyle: 'italic' }}>{log.operatorName}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RESUMO */}
        <div style={s.secTitle}>📊 Resumo do Período</div>
        <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Horas Normais', value: fHours(totalNormal), color: '#0f172a' },
            { label: 'Horas Extras', value: fHours(totalOver), color: '#d97706' },
            { label: 'Horas Noturnas', value: fHours(totalNight), color: '#6366f1' },
            { label: 'Feriados / F.Sem', value: `${holidayDays + weekendDays} dia(s)`, color: '#dc2626' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '10px 8px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
              <div style={s.label}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, padding: '14px 20px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            TOTAL DO PERÍODO — {logs.length} Diária(s)
          </span>
          <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '22px' }}>{fmt(totalVal)}</span>
        </div>

        {/* OBSERVAÇÕES */}
        {boletim.notes && (
          <>
            <div style={s.secTitle}>📝 Observações</div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '9px', color: '#334155' }}>
              {boletim.notes}
            </div>
          </>
        )}

        {/* ASSINATURAS */}
        <div className="sig-block" style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginTop: 40, paddingTop: 16, breakInside: 'avoid' as const }}>
          {['contratada', 'contratante'].map(pos => {
            const sig = signatures?.[pos];
            return (
              <div key={pos} style={{ flex: 1, textAlign: 'center', padding: '16px 14px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
                {sig?.imageUrl && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 55, marginBottom: 8, background: '#fff', borderRadius: 8, padding: '4px 8px' }}>
                    <img src={sig.imageUrl} alt="" style={{ maxHeight: 50, maxWidth: '80%', objectFit: 'contain' }} />
                  </div>
                )}
                {!sig?.imageUrl && <div style={{ height: 55, borderBottom: '1px solid #94a3b8', marginBottom: 8 }} />}
                <div style={{ paddingTop: 8, fontSize: '9.5px', fontWeight: 700, color: '#0f172a' }}>
                  {sig?.signerName || (pos === 'contratada' ? empresa.nome : clientName)}
                </div>
                {sig?.signerRole && <div style={{ fontSize: '8px', color: '#64748b', marginTop: 2 }}>{sig.signerRole}</div>}
                {sig?.signerDocument && <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: 1 }}>{sig.signerDocument}</div>}
                <span style={{ fontSize: '7px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 2, marginTop: 8, padding: '2px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, display: 'inline-block' }}>
                  {pos === 'contratada' ? 'CONTRATADA' : 'CONTRATANTE'}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: '#0f172a', padding: '12px 48px', textAlign: 'center', marginTop: 24 }}>
        <p style={{ fontSize: '7.5px', color: '#64748b', letterSpacing: 1 }}>
          {empresa.nome} • CNPJ {empresa.cnpj} • {empresa.telefone} • {empresa.email}
        </p>
      </div>
    </div>
  );
}

// ─── Template para PDF COLETIVO (múltiplos boletins em sequência) ─────────────
interface CollectiveBoletimPDFProps {
  items: Array<{ boletim: BoletimData; rental: RentalData; logs: DailyLogEntry[] }>;
  company?: any;
  signatures?: Record<string, any>;
  groupByCnpj?: boolean; // se true, agrupa por CNPJ e coloca capa por grupo
  overrideCnpj?: string; // CNPJ único para todos (modo único)
  overrideLog?: string;  // motivo do override
}

export function CollectiveBoletimPDFTemplate({ items, company, signatures, overrideCnpj, overrideLog }: CollectiveBoletimPDFProps) {
  const totalGeral = items.reduce((s, i) => s + i.logs.reduce((ss, l) => ss + Number(l.totalValue || 0), 0), 0);
  const fmt2 = (v: any) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const co = company || {};
  const empresaNome = co.razaoSocial || co.name || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA';
  const empresaCnpj = co.cnpj || '55.303.935/0001-39';

  return (
    <div id="collective-boletim-pdf-content" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#fff', maxWidth: 794, margin: '0 auto' }}>
      {/* CAPA SUMÁRIO */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', minHeight: 300, padding: '48px 48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <img src={EXITO_GRID_LOGO} alt="" style={{ height: 50, marginBottom: 24 }} />
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>MEDIÇÃO COLETIVA</div>
          <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, marginTop: 6 }}>
            {items.length} Boletim(ns) • {today}
          </div>
          {overrideCnpj && (
            <div style={{ marginTop: 12, padding: '8px 14px', background: '#fef3c7', borderRadius: 8, fontSize: 10, color: '#92400e', fontWeight: 700 }}>
              ⚠ Faturamento redirecionado para CNPJ: {overrideCnpj}
              {overrideLog && <div style={{ fontWeight: 400, fontSize: 9, marginTop: 2 }}>{overrideLog}</div>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {items.map((item, i) => (
              <div key={i} style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.9 }}>
                {String(i + 1).padStart(2, '0')}. {item.rental.code} — {item.rental.client?.name || '—'} — {fmt2(item.logs.reduce((s, l) => s + Number(l.totalValue || 0), 0))}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Total Geral</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#22c55e' }}>{fmt2(totalGeral)}</div>
          </div>
        </div>
      </div>
      <div style={{ height: 4, background: 'linear-gradient(90deg, #22c55e, #0ea5e9, #6366f1)' }} />
      <div style={{ background: '#0f172a', padding: '8px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: '7.5px', color: '#64748b' }}>{empresaNome} • CNPJ {empresaCnpj}</p>
      </div>

      {/* BOLETINS INDIVIDUAIS (com page-break) */}
      {items.map((item, i) => (
        <div key={i} style={{ pageBreakBefore: 'always', breakBefore: 'page' as any }}>
          <BoletimPDFTemplate
            boletim={{
              ...item.boletim,
              cnpjFaturamentoOverride: overrideCnpj || item.boletim.cnpjFaturamentoOverride,
              cnpjOverrideLog: overrideCnpj ? overrideLog : item.boletim.cnpjOverrideLog,
            }}
            rental={item.rental}
            logs={item.logs}
            company={company}
            signatures={signatures}
          />
        </div>
      ))}
    </div>
  );
}
