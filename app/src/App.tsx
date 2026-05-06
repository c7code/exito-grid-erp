import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

// Layouts (keep eager — needed immediately)
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages (keep eager — first screen)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center py-32">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
  </div>
);

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminPipeline = lazy(() => import('./pages/admin/Pipeline'));
const AdminWorks = lazy(() => import('./pages/admin/Works'));
const AdminWorkDetail = lazy(() => import('./pages/admin/WorkDetail'));
const AdminTasks = lazy(() => import('./pages/admin/Tasks'));
const EmployeeTasks = lazy(() => import('./pages/employee/Tasks'));
const AdminProposals = lazy(() => import('./pages/admin/Proposals'));
const AdminProtocols = lazy(() => import('./pages/admin/Protocols'));
const AdminDocuments = lazy(() => import('./pages/admin/Documents'));
const AdminEmployees = lazy(() => import('./pages/admin/Employees'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminClients = lazy(() => import('./pages/admin/Clients'));
const AdminFinance = lazy(() => import('./pages/admin/Finance'));
const AdminFinanceSimulator = lazy(() => import('./pages/admin/FinanceSimulator'));
const AdminSimulatorWizard = lazy(() => import('./pages/admin/simulator/SimulatorWizard'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminCatalogManagement = lazy(() => import('./pages/admin/CatalogManagement'));
const AdminSuppliers = lazy(() => import('./pages/admin/Suppliers'));
const AdminQuotations = lazy(() => import('./pages/admin/Quotations'));
const AdminPriceHistory = lazy(() => import('./pages/admin/PriceHistory'));
const AdminEmployeeCompliance = lazy(() => import('./pages/admin/EmployeeCompliance'));
const AdminClientRequests = lazy(() => import('./pages/admin/ClientRequests'));
const AdminFiscal = lazy(() => import('./pages/admin/Fiscal'));
const AdminDailyLogs = lazy(() => import('./pages/admin/DailyLogs'));
const AdminDailyLogRequests = lazy(() => import('./pages/admin/DailyLogRequests'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminServiceOrders = lazy(() => import('./pages/admin/ServiceOrders'));
const AdminContracts = lazy(() => import('./pages/admin/Contracts'));
const AdminSolarProjects = lazy(() => import('./pages/admin/SolarProjects'));
const AdminCompanies = lazy(() => import('./pages/admin/Companies'));
const AdminStructureTemplates = lazy(() => import('./pages/admin/StructureTemplates'));
const AdminActivityReport = lazy(() => import('./pages/admin/ActivityReport'));
const AdminCompanyDocuments = lazy(() => import('./pages/admin/CompanyDocuments'));
const AdminSafetyPrograms = lazy(() => import('./pages/admin/SafetyPrograms'));
const AdminExamReferrals = lazy(() => import('./pages/admin/ExamReferrals'));
const AdminOeM = lazy(() => import('./pages/admin/OeM'));
const AdminSinapiAdmin = lazy(() => import('./pages/admin/SinapiAdmin'));
const AdminBudgets = lazy(() => import('./pages/admin/Budgets'));
const AdminSolarReports = lazy(() => import('./pages/admin/SolarReports'));
const AdminSolarPlans = lazy(() => import('./pages/admin/SolarPlans'));
const AdminClientSubUsers = lazy(() => import('./pages/admin/ClientSubUsers'));
const AdminFinanceConfig = lazy(() => import('./pages/admin/FinanceConfig'));
const AdminEquipment = lazy(() => import('./pages/admin/Equipment'));

// Employee Pages (no longer used — employees redirect to admin layout)

// Client Pages (lazy)
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));
const ClientWorks = lazy(() => import('./pages/client/Works'));
const ClientWorkDetail = lazy(() => import('./pages/client/WorkDetail'));
const ClientDocuments = lazy(() => import('./pages/client/Documents'));
const ClientRequests = lazy(() => import('./pages/client/Requests'));
const ClientProposals = lazy(() => import('./pages/client/Proposals'));
const ClientContracts = lazy(() => import('./pages/client/Contracts'));
const ClientFinancial = lazy(() => import('./pages/client/Financial'));
const ClientTeam = lazy(() => import('./pages/client/Team'));

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages (lazy)
const ProposalSignature = lazy(() => import('./pages/public/ProposalSignature'));
const ContractSignature = lazy(() => import('./pages/public/ContractSignature'));

// Smart Tasks page: employees see only their tasks; admins see all
function SmartTasksPage() {
  const { user } = useAuth();
  if (user?.role === 'employee') return <EmployeeTasks />;
  return <AdminTasks />;
}

// Smart redirect for /employee/* routes
function EmployeeRedirect() {
  const { user, hasPermission } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Check dashboard first
  if (hasPermission('dashboard')) return <Navigate to="/admin/dashboard" replace />;
  
  // Fallback to first permitted module
  const fallbacks = ['works', 'tasks', 'pipeline', 'proposals', 'clients'];
  for (const mod of fallbacks) {
    if (hasPermission(mod)) return <Navigate to={`/admin/${mod}`} replace />;
  }
  
  // Ultimate fallback
  return <Navigate to="/admin/works" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes (sem autenticação) */}
          <Route path="/assinar/:token" element={<ProposalSignature />} />
          <Route path="/assinar-contrato/:token" element={<ContractSignature />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'commercial', 'engineer', 'finance', 'employee', 'viewer']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/pipeline" element={<AdminPipeline />} />
              <Route path="/admin/works" element={<AdminWorks />} />
              <Route path="/admin/works/:id" element={<AdminWorkDetail />} />
              <Route path="/admin/tasks" element={<SmartTasksPage />} />
              <Route path="/admin/proposals" element={<AdminProposals />} />
              <Route path="/admin/protocols" element={<AdminProtocols />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/clients" element={<AdminClients />} />
              <Route path="/admin/finance" element={<AdminFinance />} />
              <Route path="/admin/finance-config" element={<AdminFinanceConfig />} />
              <Route path="/admin/finance-simulator" element={<AdminFinanceSimulator />} />
              <Route path="/admin/simulator" element={<AdminSimulatorWizard />} />
              <Route path="/admin/catalog" element={<AdminCatalogManagement />} />
              <Route path="/admin/suppliers" element={<AdminSuppliers />} />
              <Route path="/admin/quotations" element={<AdminQuotations />} />
              <Route path="/admin/price-history" element={<AdminPriceHistory />} />
              <Route path="/admin/client-requests" element={<AdminClientRequests />} />
              <Route path="/admin/fiscal" element={<AdminFiscal />} />
              <Route path="/admin/daily-logs" element={<AdminDailyLogs />} />
              <Route path="/admin/daily-log-requests" element={<AdminDailyLogRequests />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/service-orders" element={<AdminServiceOrders />} />
              <Route path="/admin/contracts" element={<AdminContracts />} />
              <Route path="/admin/solar" element={<AdminSolarProjects />} />
              <Route path="/admin/oem" element={<AdminOeM />} />
              <Route path="/admin/structures" element={<AdminStructureTemplates />} />
              <Route path="/admin/orcamentos" element={<AdminBudgets />} />
              <Route path="/admin/solar-reports" element={<AdminSolarReports />} />
              <Route path="/admin/solar-plans" element={<AdminSolarPlans />} />
              <Route path="/admin/equipment" element={<AdminEquipment />} />

              <Route path="/admin/employees" element={<AdminEmployees />} />
              <Route path="/admin/employees/:id/compliance" element={<AdminEmployeeCompliance />} />
              <Route path="/admin/company-documents" element={<AdminCompanyDocuments />} />
              <Route path="/admin/safety-programs" element={<AdminSafetyPrograms />} />
              <Route path="/admin/exam-referrals" element={<AdminExamReferrals />} />

              {/* Restricted Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/companies" element={<AdminCompanies />} />
                <Route path="/admin/activity-report" element={<AdminActivityReport />} />
                <Route path="/admin/sinapi" element={<AdminSinapiAdmin />} />
                <Route path="/admin/client-sub-users" element={<AdminClientSubUsers />} />
              </Route>
            </Route>
          </Route>

          {/* Employee Routes — redirect inteligente baseado em permissões */}
          <Route path="/employee" element={<EmployeeRedirect />} />
          <Route path="/employee/*" element={<EmployeeRedirect />} />

          {/* Client Routes */}
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route element={<ClientLayout />}>
              <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/works" element={<ClientWorks />} />
              <Route path="/client/works/:id" element={<ClientWorkDetail />} />
              <Route path="/client/documents" element={<ClientDocuments />} />
              <Route path="/client/proposals" element={<ClientProposals />} />
              <Route path="/client/contracts" element={<ClientContracts />} />
              <Route path="/client/financial" element={<ClientFinancial />} />
              <Route path="/client/team" element={<ClientTeam />} />
              <Route path="/client/requests" element={<ClientRequests />} />
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
