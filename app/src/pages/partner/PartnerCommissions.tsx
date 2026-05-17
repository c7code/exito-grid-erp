import { useEffect, useState } from 'react';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { api } from '@/api';
import { toast } from 'sonner';
import {
  DollarSign, Clock, CheckCircle2, Award, CreditCard,
  Building2, ChevronDown, ChevronUp, Send, Loader2,
  Download, FileCheck, AlertCircle, Landmark,
} from 'lucide-react';

const fmt = (v: number | string) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_COMM: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:  { label: 'Pendente',  bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  approved: { label: 'Aprovada', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  paid:     { label: 'Paga',     bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
};

const STATUS_WITHDRAWAL: Record<string, { label: string; icon: any; bg: string; text: string }> = {
  pending:  { label: 'Aguardando',  icon: Clock,        bg: '#fefce8', text: '#a16207' },
  approved: { label: 'Aprovado',   icon: CheckCircle2,  bg: '#eff6ff', text: '#1d4ed8' },
  rejected: { label: 'Rejeitado',  icon: AlertCircle,   bg: '#fef2f2', text: '#b91c1c' },
  paid:     { label: 'Pago',       icon: Award,         bg: '#f0fdf4', text: '#15803d' },
};

type Tab = 'commissions' | 'bank' | 'withdraw' | 'history';

export default function PartnerCommissions() {
  const { partnerToken } = usePartnerAuth();
  const [tab, setTab] = useState<Tab>('commissions');

  // Comissões
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingComm, setLoadingComm] = useState(true);

  // Perfil / dados bancários
  const [bankForm, setBankForm] = useState({ bankName: '', bankAgency: '', bankAccount: '', pixKey: '' });
  const [savingBank, setSavingBank] = useState(false);

  // Solicitação de saque
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawComm, setWithdrawComm] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [sendingWithdrawal, setSendingWithdrawal] = useState(false);

  // Histórico de saques
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals] = useState(false);

  // Expandir comissão
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!partnerToken) return;
    try {
      const [comm, prof, hist] = await Promise.all([
        api.getPartnerCommissionsDetailed(partnerToken).catch(() => []),
        api.getPartnerMe(partnerToken).catch(() => null),
        api.getPartnerWithdrawalRequests(partnerToken).catch(() => []),
      ]);
      setCommissions(Array.isArray(comm) ? comm : []);
      if (prof) {
        setBankForm({
          bankName: prof.bankName || '',
          bankAgency: prof.bankAgency || '',
          bankAccount: prof.bankAccount || '',
          pixKey: prof.pixKey || '',
        });
      }
      setWithdrawals(Array.isArray(hist) ? hist : []);
    } finally {
      setLoadingComm(false);
    }
  };

  useEffect(() => { fetchAll(); }, [partnerToken]);

  const totalPending  = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commissionvalue || c.commissionValue || 0), 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.commissionvalue || c.commissionValue || 0), 0);
  const totalPaid     = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commissionvalue || c.commissionValue || 0), 0);
  const totalAvailable = totalPending + totalApproved;

  const handleSaveBank = async () => {
    if (!partnerToken) return;
    if (!bankForm.pixKey && !bankForm.bankAccount) {
      toast.error('Informe ao menos uma chave Pix ou conta bancária');
      return;
    }
    setSavingBank(true);
    try {
      await api.updatePartnerBankInfo(partnerToken, bankForm);
      toast.success('Dados bancários salvos!');
      fetchAll();
    } catch { toast.error('Erro ao salvar dados bancários'); }
    finally { setSavingBank(false); }
  };

  const handleRequestWithdrawal = async () => {
    if (!partnerToken) return;
    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    if (!amount || amount <= 0) { toast.error('Informe o valor do saque'); return; }
    if (!bankForm.pixKey && !bankForm.bankAccount) {
      toast.error('Cadastre seus dados bancários antes de solicitar');
      setTab('bank');
      return;
    }
    setSendingWithdrawal(true);
    try {
      await api.requestPartnerWithdrawal(partnerToken, {
        amount,
        commissionId: withdrawComm || undefined,
        bankName: bankForm.bankName || undefined,
        bankAgency: bankForm.bankAgency || undefined,
        bankAccount: bankForm.bankAccount || undefined,
        pixKey: bankForm.pixKey || undefined,
        notes: withdrawNotes || undefined,
      });
      toast.success('Solicitação de saque enviada! A equipe irá analisar em breve.');
      setWithdrawAmount('');
      setWithdrawComm('');
      setWithdrawNotes('');
      setTab('history');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao solicitar saque');
    } finally { setSendingWithdrawal(false); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'commissions', label: 'Comissões', icon: DollarSign },
    { key: 'bank',        label: 'Dados Bancários', icon: Landmark },
    { key: 'withdraw',    label: 'Solicitar Saque', icon: Send },
    { key: 'history',     label: 'Histórico', icon: FileCheck },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe suas comissões e solicite saques.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'A receber', value: totalAvailable, color: '#f59e0b', icon: Clock },
          { label: 'Recebido', value: totalPaid, color: '#10b981', icon: Award },
          { label: 'Total gerado', value: totalPending + totalApproved + totalPaid, color: '#6366f1', icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              tab === t.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Comissões ── */}
      {tab === 'commissions' && (
        <div className="space-y-3">
          {loadingComm ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
              <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma comissão ainda</p>
              <p className="text-gray-300 text-sm mt-1">Suas comissões aparecerão aqui quando seus leads forem convertidos.</p>
            </div>
          ) : commissions.map(c => {
            const val = Number(c.commissionvalue || c.commissionValue || 0);
            const st = STATUS_COMM[c.status] || STATUS_COMM.pending;
            const isOpen = expanded === c.id;
            return (
              <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                  onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {c.lead_name || c.leadName || '—'}
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {(c.proposalnumber || c.proposalNumber) && (
                        <span className="text-xs text-gray-400">{c.proposalnumber || c.proposalNumber}</span>
                      )}
                      <span className="text-sm font-bold text-emerald-700">{fmt(val)}</span>
                      {(c.commissionpercent || c.commissionPercent) && (
                        <span className="text-xs text-gray-400">{c.commissionpercent || c.commissionPercent}%</span>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      {(c.salevalue || c.saleValue) && (
                        <div><p className="text-xs text-gray-400 mb-0.5">Valor da Venda</p>
                          <p className="font-semibold text-gray-800">{fmt(c.salevalue || c.saleValue)}</p></div>
                      )}
                      {(c.commissionpercent || c.commissionPercent) && (
                        <div><p className="text-xs text-gray-400 mb-0.5">Percentual</p>
                          <p className="font-semibold text-gray-800">{c.commissionpercent || c.commissionPercent}%</p></div>
                      )}
                      {(c.client_name || c.clientName) && (
                        <div><p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                          <p className="font-semibold text-gray-800">{c.client_name || c.clientName}</p></div>
                      )}
                      <div><p className="text-xs text-gray-400 mb-0.5">Data</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(c.createdat || c.createdAt).toLocaleDateString('pt-BR')}
                        </p></div>
                    </div>
                    {c.notes && <p className="text-xs text-gray-500 bg-white rounded-lg p-2.5 border border-gray-100">{c.notes}</p>}
                    {c.status !== 'paid' && (
                      <button onClick={() => { setWithdrawComm(c.id); setWithdrawAmount(String(val.toFixed(2)).replace('.', ',')); setTab('withdraw'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                        <Send className="w-3.5 h-3.5" /> Solicitar Saque desta Comissão
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: Dados Bancários ── */}
      {tab === 'bank' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
            <h2 className="font-bold text-white flex items-center gap-2"><Landmark className="w-4 h-4" /> Dados para Recebimento</h2>
            <p className="text-emerald-300 text-xs mt-0.5">Esses dados serão usados ao processar seu saque</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Banco', key: 'bankName', placeholder: 'Ex: Itaú, Nubank, Bradesco...' },
                { label: 'Agência', key: 'bankAgency', placeholder: 'Ex: 0001' },
                { label: 'Conta', key: 'bankAccount', placeholder: 'Ex: 12345-6' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type="text" placeholder={placeholder}
                    value={(bankForm as any)[key]}
                    onChange={e => setBankForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chave Pix *</label>
                <input type="text" placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={bankForm.pixKey}
                  onChange={e => setBankForm(f => ({ ...f, pixKey: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-emerald-50/30" />
              </div>
            </div>
            <button onClick={handleSaveBank} disabled={savingBank}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}>
              {savingBank ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><CreditCard className="w-4 h-4" /> Salvar Dados Bancários</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Solicitar Saque ── */}
      {tab === 'withdraw' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"
            style={{ background: 'linear-gradient(135deg, #065f46, #0c4a6e)' }}>
            <h2 className="font-bold text-white flex items-center gap-2"><Send className="w-4 h-4" /> Solicitar Saque</h2>
            <p className="text-emerald-300 text-xs mt-0.5">A equipe irá analisar e processar em até 3 dias úteis</p>
          </div>
          <div className="p-6 space-y-4">
            {/* Aviso banco */}
            {!bankForm.pixKey && !bankForm.bankAccount && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">Dados bancários não cadastrados</p>
                  <p className="text-xs text-amber-600 mt-0.5">Cadastre seus dados bancários antes de solicitar.</p>
                  <button onClick={() => setTab('bank')} className="mt-2 text-xs font-semibold text-amber-700 underline">
                    Ir para Dados Bancários
                  </button>
                </div>
              </div>
            )}

            {/* Disponível */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Disponível para saque</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(totalAvailable)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-300" />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor do Saque (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">R$</span>
                <input type="text" placeholder="0,00"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono" />
              </div>
            </div>

            {/* Vincular comissão */}
            {commissions.filter(c => c.status !== 'paid').length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Comissão de referência (opcional)</label>
                <select value={withdrawComm} onChange={e => setWithdrawComm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                  <option value="">Selecione uma comissão...</option>
                  {commissions.filter(c => c.status !== 'paid').map(c => (
                    <option key={c.id} value={c.id}>
                      {c.lead_name || c.leadName} — {fmt(c.commissionvalue || c.commissionValue)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dados bancários resumidos */}
            {(bankForm.pixKey || bankForm.bankAccount) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-500 font-semibold mb-0.5">Dados cadastrados para recebimento</p>
                  {bankForm.pixKey && <p className="text-sm text-blue-800 font-medium">Pix: {bankForm.pixKey}</p>}
                  {bankForm.bankAccount && <p className="text-xs text-blue-600">{bankForm.bankName} — Ag. {bankForm.bankAgency} | Cc. {bankForm.bankAccount}</p>}
                </div>
                <button onClick={() => setTab('bank')} className="text-blue-500 hover:text-blue-700">
                  <Building2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Observação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação (opcional)</label>
              <textarea rows={2} placeholder="Alguma informação adicional para a equipe..."
                value={withdrawNotes} onChange={e => setWithdrawNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none" />
            </div>

            <button onClick={handleRequestWithdrawal} disabled={sendingWithdrawal}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}>
              {sendingWithdrawal ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4" /> Solicitar Saque</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Histórico de Saques ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          {loadingWithdrawals ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
              <FileCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Nenhuma solicitação ainda</p>
              <button onClick={() => setTab('withdraw')}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}>
                Solicitar Saque
              </button>
            </div>
          ) : withdrawals.map(w => {
            const st = STATUS_WITHDRAWAL[w.status] || STATUS_WITHDRAWAL.pending;
            const Icon = st.icon;
            return (
              <div key={w.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-gray-900">{fmt(w.amount)}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.text }}>
                        <Icon className="w-3 h-3" /> {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {w.lead_name && <span className="text-xs text-gray-500">{w.lead_name}</span>}
                      <span className="text-xs text-gray-400">
                        {new Date(w.requestedat || w.requestedAt).toLocaleDateString('pt-BR')}
                      </span>
                      {w.pixKey && <span className="text-xs text-blue-500 font-mono">Pix: {w.pixKey}</span>}
                    </div>
                    {w.adminNotes && (
                      <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        💬 {w.adminNotes}
                      </p>
                    )}
                  </div>
                  {/* Comprovante */}
                  {w.receiptUrl && (
                    <a href={w.receiptUrl} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Comprovante
                    </a>
                  )}
                </div>
                {w.status === 'paid' && w.processedat && (
                  <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-xs text-emerald-700">
                      Pago em {new Date(w.processedat || w.processedAt).toLocaleDateString('pt-BR')}
                      {w.processedBy && ` por ${w.processedBy}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
