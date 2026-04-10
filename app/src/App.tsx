import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Layouts
import AdminLayout from './layouts/AdminLayout';
// EmployeeLayout no longer used (employees use AdminLayout with blue theme)
import ClientLayout from './layouts/ClientLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminPipeline from './pages/admin/Pipeline';
import AdminWorks from './pages/admin/Works';
import AdminWorkDetail from './pages/admin/WorkDetail';
import AdminTasks from './pages/admin/Tasks';
import EmployeeTasks from './pages/employee/Tasks';
import AdminProposals from './pages/admin/Proposals';
import AdminProtocols from './pages/admin/Protocols';
import AdminDocuments from './pages/admin/Documents';
import AdminEmployees from './pages/admin/Employees';
import AdminUsers from './pages/admin/Users';
import AdminClients from './pages/admin/Clients';
import AdminFinance from './pages/admin/Finance';
import AdminFinanceSimulator from './pages/admin/FinanceSimulator';
import AdminSimulatorWizard from './pages/admin/simulator/SimulatorWizard';
import AdminSettings from './pages/admin/Settings';
import AdminCatalogManagement from './pages/admin/CatalogManagement';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminQuotations from './pages/admin/Quotations';
import AdminPriceHistory from './pages/admin/PriceHistory';
import AdminEmployeeCompliance from './pages/admin/EmployeeCompliance';
import AdminClientRequests from './pages/admin/ClientRequests';
import AdminFiscal from './pages/admin/Fiscal';
import AdminDailyLogs from './pages/admin/DailyLogs';
import AdminInventory from './pages/admin/Inventory';
import AdminServiceOrders from './pages/admin/ServiceOrders';
import AdminContracts from './pages/admin/Contracts';
import AdminSolarProjects from './pages/admin/SolarProjects';
import AdminCompanies from './pages/admin/Companies';
import AdminStructureTemplates from './pages/admin/StructureTemplates';
import AdminActivityReport from './pages/admin/ActivityReport';
import AdminCompanyDocuments from './pages/admin/CompanyDocuments';
import AdminSafetyPrograms from './pages/admin/SafetyPrograms';
import AdminExamReferrals from './pages/admin/ExamReferrals';
import AdminOeM from './pages/admin/OeM';
import AdminSinapiAdmin from './pages/admin/SinapiAdmin';
import AdminBudgets from './pages/admin/Budgets';
import AdminSolarReports from './pages/admin/SolarReports';

// Employee Pages (no longer used — employees redirect to admin layout)

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import ClientWorks from './pages/client/Works';
import ClientWorkDetail from './pages/client/WorkDetail';
import ClientDocuments from './pages/client/Documents';
import ClientRequests from './pages/client/Requests';
import ClientProposals from './pages/client/Proposals';
import ClientContracts from './pages/client/Contracts';
import ClientFinancial from './pages/client/Financial';
import ClientTeam from './pages/client/Team';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import ProposalSignature from './pages/public/ProposalSignature';
import ContractSignature from './pages/public/ContractSignature';

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
          <Route element={<ProtectedRoute allowedRoles={['admin', 'commercial', 'engineer', 'finance', 'employee']} />}>
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
              <Route path="/admin/finance-simulator" element={<AdminFinanceSimulator />} />
              <Route path="/admin/simulator" element={<AdminSimulatorWizard />} />
              <Route path="/admin/catalog" element={<AdminCatalogManagement />} />
              <Route path="/admin/suppliers" element={<AdminSuppliers />} />
              <Route path="/admin/quotations" element={<AdminQuotations />} />
              <Route path="/admin/price-history" element={<AdminPriceHistory />} />
              <Route path="/admin/client-requests" element={<AdminClientRequests />} />
              <Route path="/admin/fiscal" element={<AdminFiscal />} />
              <Route path="/admin/daily-logs" element={<AdminDailyLogs />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/service-orders" element={<AdminServiceOrders />} />
              <Route path="/admin/contracts" element={<AdminContracts />} />
              <Route path="/admin/solar" element={<AdminSolarProjects />} />
              <Route path="/admin/oem" element={<AdminOeM />} />
              <Route path="/admin/structures" element={<AdminStructureTemplates />} />
              <Route path="/admin/orcamentos" element={<AdminBudgets />} />
              <Route path="/admin/solar-reports" element={<AdminSolarReports />} />

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
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
