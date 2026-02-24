import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, AlertCircle, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { login, clientLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isClient) {
        await clientLogin(email, password);
        toast.success('Login realizado com sucesso!');
        navigate('/client/dashboard');
      } else {
        await login(email, password);
        toast.success('Login realizado com sucesso!');

        const storedUser = localStorage.getItem('electraflow_user');
        const user = storedUser ? JSON.parse(storedUser) : null;

        if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (['employee', 'commercial', 'engineer', 'finance'].includes(user?.role)) {
          navigate('/employee/dashboard');
        } else {
          navigate('/client/dashboard');
        }
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Credenciais inválidas. Tente novamente.';
      setError(message);
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${isClient ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'}`}>
            {isClient ? <Building2 className="w-8 h-8 text-white" /> : <Zap className="w-8 h-8 text-slate-900" />}
          </div>
        </div>
        <div>
          <CardTitle className="text-xl md:text-2xl font-bold text-slate-900">
            {isClient ? 'Portal do Cliente' : 'Exito System'}
          </CardTitle>
          <CardDescription className="text-slate-500">
            {isClient ? 'Acompanhe suas obras e solicitações' : 'Sistema ERP para Engenharia Elétrica'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={isClient ? 'cliente@email.com' : 'seu@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            className={`w-full h-11 font-semibold ${isClient
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900'
              }`}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full text-sm"
            onClick={() => { setIsClient(!isClient); setError(''); }}
          >
            {isClient ? '← Voltar ao login da equipe' : '🏢 Sou Cliente — acessar portal'}
          </Button>
        </div>

        {!isClient && (
          <div className="mt-2 text-center">
            <p className="text-sm text-slate-500">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-amber-600 hover:text-amber-700 font-semibold">
                Criar conta
              </Link>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

