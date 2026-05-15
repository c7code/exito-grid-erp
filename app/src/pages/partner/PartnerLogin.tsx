import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import { toast } from 'sonner';
import { Sun, Eye, EyeOff, Zap } from 'lucide-react';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const { partnerLogin, isLoading } = usePartnerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha email e senha');
      return;
    }
    try {
      await partnerLogin(email, password);
      toast.success('Bem-vindo ao Portal do Parceiro!');
      navigate('/partner/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Credenciais inválidas';
      toast.error(msg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0c4a6e 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0284c7, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0c4a6e 100%)' }}>
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #10b981, #0284c7)' }}>
              <Sun className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Portal do Parceiro</h1>
            <p className="text-emerald-200 text-sm mt-1">Canal de Indicações Solar</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  E-mail de acesso
                </label>
                <input
                  id="partner-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="partner-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha fornecida pela equipe"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                id="partner-login-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #059669, #0284c7)' }}
              >
                {isLoading ? 'Entrando...' : 'Acessar Portal'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Não possui acesso? Contate a equipe Exito para receber suas credenciais.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-emerald-300" />
          <span className="text-emerald-200 text-sm">Exito Energia Solar</span>
        </div>
      </div>
    </div>
  );
}
