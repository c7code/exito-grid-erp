import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, Send, Loader2, CheckCircle2, AlertTriangle, Building2, User, FileText } from 'lucide-react';

// ─── API direta (sem auth) ───
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchPublicLaudo(token: string) {
  const res = await fetch(`${API_BASE}/laudos/public/${token}`);
  if (!res.ok) throw new Error('Link inválido ou expirado');
  return res.json();
}

async function submitPublicForm(token: string, data: any) {
  const res = await fetch(`${API_BASE}/laudos/public/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Erro ao enviar formulário');
  return res.json();
}

// ─── Constantes ───
const TIPO_IMOVEL = ['Residencial', 'Comercial', 'Industrial', 'Misto', 'Condomínio', 'Prédio Público', 'Rural', 'Outro'];
const FINALIDADE = [
  'Laudo de conformidade (NR-10 / NBR 5410)',
  'Laudo para seguro',
  'Laudo para habite-se / AVCB',
  'Laudo para aumento de carga',
  'Laudo para financiamento',
  'Reforma / modernização',
  'Manutenção preventiva',
  'Investigação de problema',
  'Outro',
];
const URGENCIA = ['Normal (até 30 dias)', 'Urgente (até 15 dias)', 'Muito urgente (até 7 dias)', 'Emergência'];

// ─── Componentes auxiliares ───
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InputField({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} required={required}>
      <input {...props} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white" />
    </Field>
  );
}

function SelectField({ label, required, options, ...props }: { label: string; required?: boolean; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} required={required}>
      <select {...props} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white appearance-none">
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function TextareaField({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label}>
      <textarea {...props} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors bg-white resize-none" />
    </Field>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA PÚBLICA
// ═══════════════════════════════════════════════════════════════
export default function PublicLaudoForm() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'form' | 'submitting' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [linkInfo, setLinkInfo] = useState<any>(null);

  // Client data
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  // Property & service data
  const [tipoImovel, setTipoImovel] = useState('');
  const [endereco, setEndereco] = useState('');
  const [area, setArea] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [urgencia, setUrgencia] = useState('');
  const [descricao, setDescricao] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Link inválido'); return; }
    fetchPublicLaudo(token)
      .then(data => {
        setLinkInfo(data);
        // Pré-preencher com dados do vendedor
        const d = typeof data.dados === 'string' ? JSON.parse(data.dados || '{}') : (data.dados || {});
        if (d._prefillClientName) setName(d._prefillClientName);
        if (d._prefillClientPhone) setPhone(d._prefillClientPhone);
        if (d._prefillClientEmail) setEmail(d._prefillClientEmail);
        if (d.tipo_imovel) setTipoImovel(d.tipo_imovel);
        if (d.endereco) setEndereco(d.endereco);
        if (d.finalidade) setFinalidade(d.finalidade);
        setStatus('form');
      })
      .catch(() => { setStatus('error'); setErrorMsg('Este link é inválido ou já foi utilizado.'); });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!endereco.trim()) return;

    setStatus('submitting');
    try {
      await submitPublicForm(token!, {
        client: { name: name.trim(), document: document.trim(), email: email.trim(), phone: phone.trim(), city: city.trim() },
        dados: { tipo_imovel: tipoImovel, endereco, area, finalidade, urgencia, descricao_necessidade: descricao },
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Ocorreu um erro ao enviar. Tente novamente.');
    }
  }

  // ─── Loading ───
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // ─── Erro ───
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Link Inválido</h1>
          <p className="text-sm text-slate-500">{errorMsg}</p>
          <p className="text-xs text-slate-400 mt-4">Se você recebeu este link de um vendedor, peça que ele gere um novo.</p>
        </div>
      </div>
    );
  }

  // ─── Sucesso ───
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Formulário Enviado!</h1>
          <p className="text-sm text-slate-500">
            Suas informações foram recebidas com sucesso. Nosso time técnico entrará em contato em breve para dar seguimento ao seu atendimento.
          </p>
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-700 font-medium">Próximos passos:</p>
            <p className="text-xs text-emerald-600 mt-1">
              Um engenheiro irá analisar suas informações e preparar uma proposta personalizada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulário ───
  const desc = linkInfo?.dados?._linkDescription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Exito Grid</h1>
            <p className="text-xs text-slate-400">Engenharia Elétrica</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Intro */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Solicite seu Laudo Elétrico</h2>
          <p className="text-sm text-slate-500 mt-1">
            Preencha suas informações abaixo para que possamos preparar um atendimento personalizado.
          </p>
          {desc && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800">📋 {desc}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Seus Dados ── */}
          <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-700">Seus Dados</h3>
            </div>

            <InputField label="Nome completo / Razão Social" required placeholder="Ex: Empresa XYZ Ltda" value={name} onChange={e => setName(e.target.value)} />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="CNPJ / CPF" placeholder="00.000.000/0000-00" value={document} onChange={e => setDocument(e.target.value)} />
              <InputField label="Telefone / WhatsApp" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="E-mail" type="email" placeholder="contato@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
              <InputField label="Cidade / UF" placeholder="São Paulo - SP" value={city} onChange={e => setCity(e.target.value)} />
            </div>
          </div>

          {/* ── Sobre o Imóvel ── */}
          <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-700">Sobre o Imóvel</h3>
            </div>

            <SelectField label="Tipo de Imóvel" options={TIPO_IMOVEL} value={tipoImovel} onChange={e => setTipoImovel(e.target.value)} />

            <InputField label="Endereço completo" required placeholder="Rua, número, bairro, cidade - UF" value={endereco} onChange={e => setEndereco(e.target.value)} />

            <InputField label="Área aproximada (m²)" type="number" placeholder="Ex: 500" value={area} onChange={e => setArea(e.target.value)} />
          </div>

          {/* ── O que Precisa ── */}
          <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-700">O que Precisa</h3>
            </div>

            <SelectField label="Tipo de serviço" options={FINALIDADE} value={finalidade} onChange={e => setFinalidade(e.target.value)} />

            <SelectField label="Urgência" options={URGENCIA} value={urgencia} onChange={e => setUrgencia(e.target.value)} />

            <TextareaField label="Descreva brevemente sua necessidade" placeholder="Ex: Preciso de laudo para renovação do seguro do prédio comercial..." rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={status === 'submitting' || !name.trim() || !endereco.trim()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-amber-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {status === 'submitting' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="w-5 h-5" /> Enviar Informações</>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Suas informações são confidenciais e serão utilizadas apenas para fins de atendimento técnico.
          </p>
        </form>
      </div>

      {/* Footer */}
      <div className="border-t mt-8 py-6 text-center">
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Exito Grid — Engenharia Elétrica</p>
      </div>
    </div>
  );
}
