import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import NotificationDropdown from '@/components/NotificationDropdown';
import AiChatPanel from '@/components/AiChatPanel';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Kanban,
  Building2,
  ClipboardList,
  FileText,
  FileCheck,
  FolderOpen,
  Users,
  UserCircle,
  DollarSign,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
  Calculator,
  Truck,
  History,
  Menu,
  X,
  MessageSquare,
  Receipt,
  Package,
  Wrench,
  Warehouse,
  FileSignature,
  Sun,
  Layers,
  Shield,
  Stethoscope,
  Database,
  BarChart3,
  Wallet,
} from 'lucide-react';

type NavItem = { path: string; label: string; icon: any; module: string; roles: string[] };
type NavSection = { section: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    section: 'GERAL',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', roles: ['admin', 'employee'] },
    ],
  },
  {
    section: 'COMERCIAL',
    items: [
      { path: '/admin/pipeline', label: 'Pipeline de Vendas', icon: Kanban, module: 'pipeline', roles: ['admin', 'commercial', 'employee'] },
      { path: '/admin/clients', label: 'Clientes', icon: UserCircle, module: 'clients', roles: ['admin', 'commercial', 'employee'] },
      { path: '/admin/client-sub-users', label: 'Sub-Usuários Portal', icon: Users, module: 'clients', roles: ['admin'] },
      { path: '/admin/proposals', label: 'Propostas', icon: FileText, module: 'proposals', roles: ['admin', 'commercial', 'employee'] },
      { path: '/admin/client-requests', label: 'Solicitações', icon: MessageSquare, module: 'client-requests', roles: ['admin', 'commercial', 'employee'] },
      { path: '/admin/simulator', label: 'Simulador', icon: Calculator, module: 'finance-simulator', roles: ['admin', 'commercial', 'finance', 'employee'] },
    ],
  },
  {
    section: 'ENERGIA SOLAR',
    items: [
      { path: '/admin/solar', label: 'Energia Solar', icon: Sun, module: 'solar', roles: ['admin', 'commercial', 'engineer', 'employee'] },
      { path: '/admin/oem', label: 'O&M Solar', icon: Wrench, module: 'solar', roles: ['admin', 'commercial', 'engineer', 'employee'] },
      { path: '/admin/solar-plans', label: 'Plano Acesso Solar', icon: Wallet, module: 'solar', roles: ['admin', 'commercial', 'employee'] },
      { path: '/admin/solar-reports', label: 'Relatórios Solar', icon: BarChart3, module: 'solar', roles: ['admin', 'commercial', 'engineer', 'employee'] },
    ],
  },
  {
    section: 'ENGENHARIA',
    items: [
      { path: '/admin/works', label: 'Obras', icon: Building2, module: 'works', roles: ['admin', 'engineer', 'commercial', 'employee'] },
      { path: '/admin/tasks', label: 'Tarefas', icon: ClipboardList, module: 'tasks', roles: ['admin', 'engineer', 'commercial', 'employee'] },
      { path: '/admin/protocols', label: 'Protocolos', icon: FileCheck, module: 'protocols', roles: ['admin', 'engineer', 'employee'] },
      { path: '/admin/daily-logs', label: 'Diário de Obra', icon: ClipboardList, module: 'daily-logs', roles: ['admin', 'engineer', 'employee'] },
      { path: '/admin/service-orders', label: 'Ordens de Serviço', icon: Wrench, module: 'service-orders', roles: ['admin', 'engineer', 'employee'] },
      { path: '/admin/contracts', label: 'Contratos', icon: FileSignature, module: 'contracts', roles: ['admin', 'engineer', 'commercial', 'employee'] },
      { path: '/admin/structures', label: 'Estruturas', icon: Layers, module: 'structures', roles: ['admin', 'engineer', 'employee'] },
      { path: '/admin/sinapi', label: 'SINAPI', icon: Database, module: 'sinapi', roles: ['admin', 'engineer', 'employee'] },
      { path: '/admin/orcamentos', label: 'Orçamentos', icon: Calculator, module: 'budgets', roles: ['admin', 'engineer', 'commercial', 'employee'] },
    ],
  },
  {
    section: 'SUPRIMENTOS',
    items: [
      { path: '/admin/catalog', label: 'Produtos & Estoque', icon: Package, module: 'catalog', roles: ['admin', 'commercial', 'engineer', 'employee'] },
      { path: '/admin/inventory', label: 'Almoxarifado', icon: Warehouse, module: 'inventory', roles: ['admin', 'engineer', 'commercial', 'employee'] },
      { path: '/admin/suppliers', label: 'Fornecedores', icon: Truck, module: 'suppliers', roles: ['admin', 'commercial', 'engineer', 'employee'] },
      { path: '/admin/quotations', label: 'Cotações', icon: FileText, module: 'quotations', roles: ['admin', 'commercial', 'engineer', 'employee'] },
      { path: '/admin/price-history', label: 'Memorial Preços', icon: History, module: 'price-history', roles: ['admin', 'commercial', 'finance', 'employee'] },
    ],
  },
  {
    section: 'DOCUMENTAÇÃO',
    items: [
      { path: '/admin/documents', label: 'Documentos', icon: FolderOpen, module: 'documents', roles: ['admin', 'engineer', 'commercial', 'finance', 'employee'] },
    ],
  },
  {
    section: 'FINANCEIRO',
    items: [
      { path: '/admin/finance', label: 'Financeiro', icon: DollarSign, module: 'finance', roles: ['admin', 'finance', 'employee'] },
      { path: '/admin/fiscal', label: 'Fiscal', icon: Receipt, module: 'fiscal', roles: ['admin', 'finance', 'employee'] },
    ],
  },
  {
    section: 'SEGURANÇA DO TRABALHO',
    items: [
      { path: '/admin/company-documents', label: 'Docs da Empresa', icon: FileText, module: 'company-documents', roles: ['admin', 'employee'] },
      { path: '/admin/safety-programs', label: 'Programas / GHE', icon: Shield, module: 'safety-programs', roles: ['admin', 'employee'] },
      { path: '/admin/exam-referrals', label: 'Guias de Exames', icon: Stethoscope, module: 'exam-referrals', roles: ['admin', 'employee'] },
    ],
  },
  {
    section: 'SISTEMA',
    items: [
      { path: '/admin/employees', label: 'Funcionários', icon: Users, module: 'employees', roles: ['admin', 'employee'] },
      { path: '/admin/users', label: 'Usuários', icon: Users, module: 'users', roles: ['admin'] },
      { path: '/admin/companies', label: 'Empresas', icon: Building2, module: 'companies', roles: ['admin'] },
      { path: '/admin/activity-report', label: 'Atividades', icon: ClipboardList, module: 'activity-report', roles: ['admin'] },
      { path: '/admin/settings', label: 'Configurações', icon: Settings, module: 'settings', roles: ['admin'] },
    ],
  },
];

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isEmployee = user?.role === 'employee';

  const filteredSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role === 'employee') {
          // Employee must have role AND module permission
          return item.roles.includes('employee') && hasPermission(item.module);
        }
        if (item.module && hasPermission(item.module)) return true;
        return false;
      }),
    }))
    .filter(section => section.items.length > 0);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay/Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-slate-900 text-white flex flex-col fixed h-full z-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${isEmployee ? 'from-blue-400 to-blue-600' : 'from-amber-400 to-amber-600'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Zap className={`w-6 h-6 ${isEmployee ? 'text-white' : 'text-slate-900'}`} />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg">Exito System</h1>
                <p className="text-xs text-slate-400">{isEmployee ? 'Back-Office' : 'ERP para Engenharia'}</p>
              </div>
            </div>
            {/* Close button mobile */}
            <button
              onClick={closeSidebar}
              className="md:hidden p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {filteredSections.map((section, sIdx) => (
            <div key={section.section}>
              {/* Section Header */}
              <div className="px-5 pb-1.5" style={{ paddingTop: sIdx === 0 ? '0.75rem' : '1rem' }}>
                <span className="text-[10px] font-bold text-slate-500 tracking-widest">{section.section}</span>
              </div>
              <ul className="space-y-0.5 px-3">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={closeSidebar}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                          ? isEmployee
                            ? 'bg-blue-500 text-white font-medium'
                            : 'bg-amber-500 text-slate-900 font-medium'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                      <span className="truncate">
                        {isEmployee && item.module === 'tasks' ? 'Minhas Tarefas' : item.label}
                      </span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={`${isEmployee ? 'bg-blue-500 text-white' : 'bg-amber-500 text-slate-900'} text-sm`}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{isEmployee ? 'Funcionário' : user?.role === 'admin' ? 'Administrador' : user?.position || user?.department || 'Colaborador'}</p>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
              <Badge variant="outline" className={`${isEmployee ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'} hidden sm:inline-flex`}>
                {isEmployee ? 'Área do Funcionário' : 'Área Administrativa'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 md:p-6">
          <Outlet />
        </div>
      </main>
      <AiChatPanel />
    </div>
  );
}
