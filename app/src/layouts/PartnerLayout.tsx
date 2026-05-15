import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { usePartnerAuth } from '@/contexts/PartnerAuthContext';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  PlusCircle,
  LogOut,
  Sun,
  Menu,
  X,
  ChevronDown,
  Zap,
} from 'lucide-react';

const partnerNavItems = [
  { path: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/partner/leads', label: 'Meus Leads', icon: Users },
  { path: '/partner/new-lead', label: 'Indicar Lead', icon: PlusCircle },
  { path: '/partner/commissions', label: 'Financeiro', icon: DollarSign },
];

export default function PartnerLayout() {
  const { consultant, partnerLogout } = usePartnerAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    partnerLogout();
    navigate('/partner/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 flex flex-col fixed h-full z-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{
          background: 'linear-gradient(180deg, #064e3b 0%, #065f46 40%, #0c4a6e 100%)',
        }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-emerald-700/50">
          <div className="flex items-center justify-between">
            <div
              onClick={() => navigate('/partner/dashboard')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #0284c7)' }}>
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight">Portal Parceiro</h1>
                <p className="text-xs text-emerald-300">Canal Solar</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="md:hidden p-1 rounded-lg text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-2 px-2">
            <span className="text-[10px] font-bold text-emerald-400/70 tracking-widest uppercase">Menu</span>
          </div>
          <ul className="space-y-1">
            {partnerNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'text-white shadow-lg shadow-emerald-900/30'
                        : 'text-emerald-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { background: 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(2,132,199,0.35))' }
                      : {}
                  }
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Energia Solar badge */}
          <div className="mt-6 mx-2 p-3 rounded-xl"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-semibold">Exito Energia Solar</span>
            </div>
            <p className="text-emerald-400/70 text-xs">Transformando o futuro com energia limpa</p>
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-emerald-700/50">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #0284c7)' }}>
                {consultant?.name?.charAt(0).toUpperCase() ?? 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{consultant?.name ?? 'Parceiro'}</p>
                <p className="text-emerald-300 text-xs truncate">{consultant?.email ?? ''}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sair do Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 min-w-0">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 md:px-6 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <span
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'linear-gradient(135deg, #d1fae5, #dbeafe)', color: '#065f46' }}
              >
                <Sun className="w-3.5 h-3.5" />
                Portal do Parceiro
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium hidden sm:block">
                Olá, {consultant?.name?.split(' ')[0] ?? 'Parceiro'} 👋
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
