import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap, AlertCircle, Loader2, Building2, UserPlus,
  Shield, TrendingUp, HardHat, Banknote, User, Eye,
  ChevronRight, ArrowLeft,
} from 'lucide-react';

// ─── Portal config ────────────────────────────────────────────────────────────
const PORTAL_CONFIG: Record<string, {
  icon: any; gradient: string; ring: string; badge: string;
  badgeText: string; desc: string; bg: string;
}> = {
  admin: {
    icon: Shield,
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    ring: 'ring-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    badgeText: 'ERP Interno',
    desc: 'Acesso completo ao sistema ERP',
    bg: 'hover:bg-amber-50 border-amber-200',
  },
  commercial: {
    icon: TrendingUp,
    gradient: 'from-amber-400 via-orange-400 to-amber-500',
    ring: 'ring-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    badgeText: 'Comercial',
    desc: 'Propostas, Pipeline e Clientes',
    bg: 'hover:bg-amber-50 border-amber-200',
  },
  engineer: {
    icon: HardHat,
    gradient: 'from-blue-400 via-indigo-400 to-blue-500',
    ring: 'ring-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    badgeText: 'Engenharia',
    desc: 'Obras, OS e Documentação Técnica',
    bg: 'hover:bg-blue-50 border-blue-200',
  },
  finance: {
    icon: Banknote,
    gradient: 'from-emerald-400 via-green-400 to-emerald-500',
    ring: 'ring-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeText: 'Financeiro',
    desc: 'Pagamentos, Recibos e Contratos',
    bg: 'hover:bg-emerald-50 border-emerald-200',
  },
  employee: {
    icon: User,
    gradient: 'from-slate-400 via-slate-500 to-slate-600',
    ring: 'ring-slate-300',
    badge: 'bg-slate-100 text-slate-700',
    badgeText: 'Colaborador',
    desc: 'Área do Funcionário',
    bg: 'hover:bg-slate-50 border-slate-200',
  },
  viewer: {
    icon: Eye,
    gradient: 'from-purple-400 via-violet-400 to-purple-500',
    ring: 'ring-purple-300',
    badge: 'bg-purple-100 text-purple-700',
    badgeText: 'Visualizador',
    desc: 'Acesso somente leitura',
    bg: 'hover:bg-purple-50 border-purple-200',
  },
  client: {
    icon: Building2,
    gradient: 'from-cyan-400 via-teal-400 to-cyan-500',
    ring: 'ring-cyan-300',
    badge: 'bg-cyan-100 text-cyan-700',
    badgeText: 'Portal do Cliente',
    desc: 'Obras, Propostas e Documentos',
    bg: 'hover:bg-cyan-50 border-cyan-200',
  },
  partner: {
    icon: UserPlus,
    gradient: 'from-emerald-400 via-green-500 to-emerald-600',
    ring: 'ring-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeText: 'Portal Parceiro',
    desc: 'Acompanhe Leads e Comissões',
    bg: 'hover:bg-emerald-50 border-emerald-200',
  },
};

function getPortalConfig(type: string) {
  const key = type.replace('_user', '').replace('client_', '');
  return PORTAL_CONFIG[key] || PORTAL_CONFIG['admin'];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [portals, setPortals] = useState<any[]>([]);
  const [selectingPortal, setSelectingPortal] = useState(false);
  const [enteringPortal, setEnteringPortal] = useState<string | null>(null);
  const navigate = useNavigate();

  // ─── Limpar tokens stale ao montar a tela de login ─────────────────────────
  // Previne race condition: heartbeat com token expirado dispara 401 → interceptor
  // agenda redirect que destrói o login que acabou de ser realizado com sucesso.
  useEffect(() => {
    localStorage.removeItem('electraflow_token');
    localStorage.removeItem('electraflow_refresh_token');
    localStorage.removeItem('electraflow_user');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await api.unifiedLogin(email, password);
      const available: any[] = result.portals || [];
      if (available.length === 1) {
        await enterPortal(available[0]);
      } else {
        setPortals(available);
        setSelectingPortal(true);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const enterPortal = async (portal: any) => {
    setEnteringPortal(portal.type);
    try {
      if (portal.type === 'partner') {
        localStorage.setItem('partner_token', portal.token);
        localStorage.setItem('partner_user', JSON.stringify(portal.user));
        navigate('/partner/dashboard');
      } else if (portal.type === 'client') {
        localStorage.setItem('electraflow_token', portal.token);
        if (portal.refresh_token) localStorage.setItem('electraflow_refresh_token', portal.refresh_token);
        localStorage.setItem('electraflow_user', JSON.stringify(portal.user));
        navigate('/client/dashboard');
      } else {
        localStorage.setItem('electraflow_token', portal.token);
        if (portal.refresh_token) localStorage.setItem('electraflow_refresh_token', portal.refresh_token);
        localStorage.setItem('electraflow_user', JSON.stringify(portal.user));
        navigate('/admin/dashboard');
      }
    } finally {
      setEnteringPortal(null);
    }
  };

  // ─── Portal Selector ──────────────────────────────────────────────────────
  if (selectingPortal) {
    return (
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta!</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Sua conta tem acesso a <strong>{portals.length} portais</strong>. Selecione como deseja entrar:
          </p>
        </div>

        {/* Portal Cards */}
        <div className="space-y-3">
          {portals.map((portal) => {
            const cfg = getPortalConfig(portal.type);
            const Icon = cfg.icon;
            const isEntering = enteringPortal === portal.type;
            return (
              <button
                key={portal.type}
                onClick={() => enterPortal(portal)}
                disabled={!!enteringPortal}
                className={[
                  'w-full group flex items-center gap-4 p-4 rounded-2xl border-2 bg-white',
                  'transition-all duration-200 text-left',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  cfg.bg,
                  isEntering ? cfg.ring + ' ring-2' : '',
                ].join(' ')}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                  {isEntering
                    ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                    : <Icon className="w-6 h-6 text-white" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-slate-900">{portal.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.badgeText}</span>
                  </div>
                  <p className="text-sm text-slate-500">{cfg.desc}</p>
                  {portal.user?.name && (
                    <p className="text-xs text-slate-400 mt-0.5">Logado como <strong className="text-slate-600">{portal.user.name}</strong></p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className={[
                  'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                  'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1',
                ].join(' ')} />
              </button>
            );
          })}
        </div>

        {/* Back */}
        <button
          onClick={() => { setSelectingPortal(false); setPortals([]); }}
          className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Usar outro email / senha
        </button>
      </div>
    );
  }

  // ─── Login Form ───────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200 mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Exito System</h1>
        <p className="text-slate-500 mt-1 text-sm">Acesse com seu email e senha</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 border-slate-200 focus:border-amber-400 focus:ring-amber-400/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={[
              'w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200',
              'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
              'hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-200',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            ].join(' ')}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
            ) : (
              <>Entrar <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Hint */}
        <p className="text-center text-xs text-slate-400 mt-4">
          O sistema detecta automaticamente todos os portais vinculados ao seu email.
        </p>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-slate-500 mt-5">
        Não tem uma conta?{' '}
        <Link to="/register" className="text-amber-600 hover:text-amber-700 font-semibold">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
