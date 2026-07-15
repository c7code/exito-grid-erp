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
  cnpjFaturamentoOverride?: string;
  cnpjSolicitanteOverride?: string;
  cnpjOverrideLog?: string;
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
  pageBreakBefore?: boolean;
}

const fmt = (v: any) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fDate = (d: any) => {
  if (!d) return '—';
  const s = String(d).substring(0, 10);
  const [y, m, dy] = s.split('-');
  return `${dy}/${m}/${y}`;
};
const fH = (h: any) => Number(h || 0).toFixed(1) + 'h';

export function BoletimPDFTemplate({ boletim, rental, logs, company, signatures, pageBreakBefore }: Props) {
  const co = company || {};
  const empresa = {
    nome: co.razaoSocial || co.name || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA',
    cnpj: co.cnpj || '55.303.935/0001-39',
    endereco: co.address
      ? `${co.address}${co.number ? ', ' + co.number : ''}, ${co.city || 'Recife'}/${co.state || 'PE'}`
      : 'R General Polidoro, 352 — Varzea, Recife/PE',
    telefone: co.phone || '(81) 8887-0766',
    email: co.email || 'contato@exitogrid.com.br',
  };

  const clientName = rental.client?.name || '—';
  const cnpjFat = boletim.cnpjFaturamentoOverride || rental.cnpjFaturamento || rental.client?.document || rental.client?.cnpj || '';
  const cnpjSol = boletim.cnpjSolicitanteOverride || rental.cnpjSolicitante || '';

  const totalNormal = logs.reduce((s, l) => s + Number(l.normalHours || 0), 0);
  const totalOver   = logs.reduce((s, l) => s + Number(l.overtimeHours || 0), 0);
  const totalNight  = logs.reduce((s, l) => s + Number(l.nightHours || 0), 0);
  const totalVal    = logs.reduce((s, l) => s + Number(l.totalValue || 0), 0);
  const holidayDays = logs.filter(l => l.isHoliday).length;
  const weekendDays = logs.filter(l => l.isWeekend && !l.isHoliday).length;

  const today = new Date().toLocaleDateString('pt-BR');

  // ── Compact style tokens ──────────────────────────────────────────
  const P = '16px 24px';   // body padding
  const FS = '7.5px';      // base font size
  const FSS = '6.5px';     // small label
  const FST = '6.8px';     // table cell

  return (
    <div id="boletim-pdf-content" style={{
      fontFamily: "'Segoe UI', Arial, sans-serif",
      fontSize: FS, color: '#1a1a1a', lineHeight: '1.4',
      maxWidth: 794, margin: '0 auto', background: '#fff',
      pageBreakBefore: pageBreakBefore ? 'always' : undefined,
    }}>
      <style>{`
        #boletim-pdf-content .sig-block { break-inside: avoid; }
        #boletim-pdf-content table { border-collapse: collapse; width: 100%; }
        #boletim-pdf-content tr { break-inside: avoid; }
      `}</style>

      {/* ── HEADER (compact) ─────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e293b 100%)', padding: '14px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={EXITO_GRID_LOGO} alt="Logo" style={{ height: 30 }} />
          <div style={{ fontSize: '6.5px', color: '#94a3b8', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{empresa.nome}</div>
            <div>CNPJ: {empresa.cnpj} • {empresa.telefone}</div>
            <div>{empresa.endereco}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>BOLETIM DE MEDIÇÃO</div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#22c55e', marginTop: 2 }}>
            Nº {String(boletim.boletimNumber || 1).padStart(3, '0')} — {rental.code || '—'}
          </div>
          <div style={{ fontSize: '6.5px', color: '#94a3b8', marginTop: 4 }}>
            Período: {fDate(boletim.periodStart)} a {fDate(boletim.periodEnd)} • Emitido: {today}
          </div>
          <div style={{ marginTop: 4, padding: '2px 8px', display: 'inline-block', background: boletim.status === 'approved' ? '#166534' : boletim.status === 'billed' ? '#1e3a5f' : '#334155', borderRadius: 3, fontSize: '6px', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            {boletim.status === 'approved' ? '✓ Aprovado' : boletim.status === 'billed' ? '✓ Faturado' : 'Gerado'}
          </div>
        </div>
      </div>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #22c55e, #0ea5e9, #6366f1)' }} />

      <div style={{ padding: P }}>

        {/* ── INFO GRID (locação + cliente + cnpjs em uma linha) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px 12px', padding: '8px 0', borderBottom: '1px solid #e2e8f0', marginBottom: 8 }}>
          {[
            { label: 'Equipamento', value: `${rental.equipment?.name || '—'} (${rental.equipment?.code || ''})` },
            { label: 'Operador', value: rental.operatorName || '—' },
            { label: 'Cliente', value: clientName },
            { label: 'CNPJ Faturamento', value: cnpjFat || '—', warn: boletim.cnpjFaturamentoOverride ? '⚠ Redirecionado' : '' },
            { label: 'CNPJ Solicitante', value: cnpjSol || '—' },
          ].map(({ label, value, warn }) => (
            <div key={label}>
              <div style={{ fontSize: FSS, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: FS, fontWeight: 600, color: '#0f172a' }}>{value}</div>
              {warn && <div style={{ fontSize: '6px', color: '#b45309', fontStyle: 'italic' }}>{warn}</div>}
            </div>
          ))}
        </div>

        {/* Aviso CNPJ override */}
        {boletim.cnpjOverrideLog && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 4, padding: '4px 10px', marginBottom: 8, fontSize: '6.5px', color: '#92400e' }}>
            <strong>⚠ Controle Interno — CNPJ Redirecionado:</strong> {boletim.cnpjOverrideLog}
          </div>
        )}

        {/* ── TABELA DE DIÁRIAS ───────────────────────────────── */}
        <div style={{ fontSize: FSS, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2px solid #22c55e', paddingBottom: 3, marginBottom: 6 }}>
          Diárias ({logs.length})
        </div>
        <table>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['#', 'Data de Medição', 'Horário', 'H.Norm', 'H.Extra', 'H.Not', 'Tipo', 'Valor', 'Local'].map(h => (
                <th key={h} style={{ padding: '5px 6px', color: '#e2e8f0', fontSize: FSS, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: h === 'Valor' || h === 'H.Norm' || h === 'H.Extra' || h === 'H.Not' ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const isAdapted = log.originalDate && String(log.originalDate).substring(0, 10) !== String(log.date).substring(0, 10);
              const tipo = log.isHoliday ? 'Feriado' : log.isWeekend ? 'F.Sem' : 'Útil';
              return (
                <tr key={log.id} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: '6.5px', color: '#64748b', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: FST }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{fDate(log.date)}</div>
                    {isAdapted && (
                      <div style={{ fontSize: '6px', color: '#b45309', fontStyle: 'italic' }}>orig: {fDate(log.originalDate)}</div>
                    )}
                  </td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: FST, color: '#475569' }}>
                    {log.startTime && log.endTime ? `${log.startTime}–${log.endTime}` : '—'}
                  </td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: FST, textAlign: 'right' }}>{fH(log.normalHours)}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: FST, textAlign: 'right', color: Number(log.overtimeHours) > 0 ? '#d97706' : '#94a3b8' }}>{fH(log.overtimeHours)}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: FST, textAlign: 'right', color: Number(log.nightHours) > 0 ? '#6366f1' : '#94a3b8' }}>{fH(log.nightHours)}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: '6.5px', color: log.isHoliday ? '#dc2626' : log.isWeekend ? '#7c3aed' : '#475569' }}>{tipo}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: FST, textAlign: 'right', fontWeight: 700, color: '#166534' }}>{fmt(log.totalValue)}</td>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid #e2e8f0', fontSize: '6px', color: '#475569', maxWidth: 80 }}>{log.workLocation || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── RESUMO ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'stretch' }}>
          {[
            { label: 'H. Normais', value: fH(totalNormal), color: '#0f172a' },
            { label: 'H. Extras', value: fH(totalOver), color: '#d97706' },
            { label: 'H. Noturnas', value: fH(totalNight), color: '#6366f1' },
            { label: 'Feriados/FS', value: `${holidayDays + weekendDays}d`, color: '#dc2626' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc' }}>
              <div style={{ fontSize: FSS, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color, marginTop: 1 }}>{value}</div>
            </div>
          ))}
          <div style={{ flex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 6 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '7.5px', textTransform: 'uppercase', letterSpacing: 1 }}>TOTAL — {logs.length} dia(s)</span>
            <span style={{ color: '#22c55e', fontWeight: 900, fontSize: '16px' }}>{fmt(totalVal)}</span>
          </div>
        </div>

        {/* Observações */}
        {boletim.notes && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '7px', color: '#334155' }}>
            <strong>Observações:</strong> {boletim.notes}
          </div>
        )}

        {/* ── ASSINATURAS ─────────────────────────────────────────── */}
        <div className="sig-block" style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 20 }}>
          {['contratada', 'contratante'].map(pos => {
            const sig = signatures?.[pos];
            return (
              <div key={pos} style={{ flex: 1, textAlign: 'center', padding: '10px 12px 8px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                {sig?.imageUrl ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 44, marginBottom: 6, background: '#fff', borderRadius: 6, padding: '3px 6px' }}>
                    <img src={sig.imageUrl} alt="" style={{ maxHeight: 40, maxWidth: '80%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ height: 44, borderBottom: '1px solid #94a3b8', marginBottom: 6 }} />
                )}
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#0f172a' }}>
                  {sig?.signerName || (pos === 'contratada' ? empresa.nome : clientName)}
                </div>
                {sig?.signerRole && <div style={{ fontSize: '6.5px', color: '#64748b', marginTop: 1 }}>{sig.signerRole}</div>}
                <span style={{ fontSize: '6px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 2, marginTop: 5, padding: '2px 6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 3, display: 'inline-block' }}>
                  {pos === 'contratada' ? 'CONTRATADA' : 'CONTRATANTE'}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ background: '#0f172a', padding: '8px 24px', textAlign: 'center', marginTop: 10 }}>
        <p style={{ fontSize: '6px', color: '#64748b', letterSpacing: 1 }}>
          {empresa.nome} • CNPJ {empresa.cnpj} • {empresa.telefone} • {empresa.email}
        </p>
      </div>
    </div>
  );
}

// ─── Collective PDF ───────────────────────────────────────────────────────────
interface CollectiveBoletimPDFProps {
  items: Array<{ boletim: BoletimData; rental: RentalData; logs: DailyLogEntry[] }>;
  company?: any;
  signatures?: Record<string, any>;
  groupByCnpj?: boolean;
  overrideCnpj?: string;
  overrideLog?: string;
}

export function CollectiveBoletimPDFTemplate({ items, company, signatures, overrideCnpj, overrideLog }: CollectiveBoletimPDFProps) {
  const totalGeral = items.reduce((s, i) => s + i.logs.reduce((ss, l) => ss + Number(l.totalValue || 0), 0), 0);
  const fmt2 = (v: any) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const today = new Date().toLocaleDateString('pt-BR');
  const co = company || {};
  const empresaNome = co.razaoSocial || co.name || 'EXITO GRID COMERCIO E SERVICOS ELETRICOS LTDA';
  const empresaCnpj = co.cnpj || '55.303.935/0001-39';

  return (
    <div id="collective-boletim-pdf-content" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#fff', maxWidth: 794, margin: '0 auto' }}>
      {/* CAPA SUMÁRIO */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '40px 48px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <img src={EXITO_GRID_LOGO} alt="" style={{ height: 44, marginBottom: 20 }} />
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 1 }}>MEDIÇÃO COLETIVA</div>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, marginTop: 4 }}>
            {items.length} Boletim(ns) • {today}
          </div>
          {overrideCnpj && (
            <div style={{ marginTop: 10, padding: '6px 12px', background: '#fef3c7', borderRadius: 6, fontSize: 9, color: '#92400e', fontWeight: 700 }}>
              ⚠ Faturamento redirecionado para CNPJ: {overrideCnpj}
              {overrideLog && <div style={{ fontWeight: 400, fontSize: 8, marginTop: 2 }}>{overrideLog}</div>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {items.map((item, i) => (
              <div key={i} style={{ fontSize: 8.5, color: '#94a3b8', lineHeight: 1.9 }}>
                {String(i + 1).padStart(2, '0')}. {item.rental.code} — {item.rental.client?.name || '—'} — {fmt2(item.logs.reduce((s, l) => s + Number(l.totalValue || 0), 0))}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 }}>Total Geral</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#22c55e' }}>{fmt2(totalGeral)}</div>
          </div>
        </div>
      </div>
      <div style={{ height: 4, background: 'linear-gradient(90deg, #22c55e, #0ea5e9, #6366f1)' }} />
      <div style={{ background: '#0f172a', padding: '6px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: '6.5px', color: '#64748b' }}>{empresaNome} • CNPJ {empresaCnpj}</p>
      </div>

      {/* BOLETINS INDIVIDUAIS */}
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
