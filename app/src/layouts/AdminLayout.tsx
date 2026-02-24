import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  Bell,
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
} from 'lucide-react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard', roles: ['admin', 'commercial', 'engineer', 'finance'] },
  { path: '/admin/pipeline', label: 'Pipeline', icon: Kanban, module: 'pipeline', roles: ['admin', 'commercial'] },
  { path: '/admin/works', label: 'Obras', icon: Building2, module: 'works', roles: ['admin', 'engineer', 'commercial'] },
  { path: '/admin/tasks', label: 'Tarefas', icon: ClipboardList, module: 'tasks', roles: ['admin', 'engineer', 'commercial'] },
  { path: '/admin/proposals', label: 'Propostas', icon: FileText, module: 'proposals', roles: ['admin', 'commercial'] },
  { path: '/admin/protocols', label: 'Protocolos', icon: FileCheck, module: 'protocols', roles: ['admin', 'engineer'] },
  { path: '/admin/documents', label: 'Documentos', icon: FolderOpen, module: 'documents', roles: ['admin', 'engineer', 'commercial', 'finance'] },
  { path: '/admin/employees', label: 'Funcionários', icon: Users, module: 'employees', roles: ['admin'] },
  { path: '/admin/users', label: 'Usuários', icon: Users, module: 'users', roles: ['admin'] },
  { path: '/admin/clients', label: 'Clientes', icon: UserCircle, module: 'clients', roles: ['admin', 'commercial'] },
  { path: '/admin/finance', label: 'Financeiro', icon: DollarSign, module: 'finance', roles: ['admin', 'finance'] },
  { path: '/admin/fiscal', label: 'Fiscal', icon: Receipt, module: 'fiscal', roles: ['admin', 'finance'] },
  { path: '/admin/finance-simulator', label: 'Simulador Investimento', icon: Calculator, module: 'finance-simulator', roles: ['admin', 'commercial', 'finance'] },
  { path: '/admin/catalog', label: 'Produtos & Estoque', icon: Package, module: 'catalog', roles: ['admin', 'commercial', 'engineer'] },
  { path: '/admin/suppliers', label: 'Fornecedores', icon: Truck, module: 'suppliers', roles: ['admin', 'commercial', 'engineer'] },
  { path: '/admin/quotations', label: 'Cotações', icon: FileText, module: 'quotations', roles: ['admin', 'commercial', 'engineer'] },
  { path: '/admin/price-history', label: 'Memorial Preços', icon: History, module: 'price-history', roles: ['admin', 'commercial', 'finance'] },
  { path: '/admin/client-requests', label: 'Solicitações', icon: MessageSquare, module: 'client-requests', roles: ['admin', 'commercial'] },
  { path: '/admin/settings', label: 'Configurações', icon: Settings, module: 'settings', roles: ['admin'] },
];

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (item.module && hasPermission(item.module)) return true;
    return false;
  });

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
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-slate-900" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-lg">Exito System</h1>
                <p className="text-xs text-slate-400">ERP para Engenharia</p>
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
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                      ? 'bg-amber-500 text-slate-900 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-amber-500 text-slate-900 text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.role === 'admin' ? 'Administrador' : user?.position || user?.department || 'Colaborador'}</p>
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
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hidden sm:inline-flex">
                Área Administrativa
              </Badge>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
