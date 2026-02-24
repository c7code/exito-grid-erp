import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
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
import AdminProposals from './pages/admin/Proposals';
import AdminProtocols from './pages/admin/Protocols';
import AdminDocuments from './pages/admin/Documents';
import AdminEmployees from './pages/admin/Employees';
import AdminUsers from './pages/admin/Users';
import AdminClients from './pages/admin/Clients';
import AdminFinance from './pages/admin/Finance';
import AdminFinanceSimulator from './pages/admin/FinanceSimulator';
import AdminSettings from './pages/admin/Settings';
import AdminCatalogManagement from './pages/admin/CatalogManagement';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminQuotations from './pages/admin/Quotations';
import AdminPriceHistory from './pages/admin/PriceHistory';
import AdminEmployeeCompliance from './pages/admin/EmployeeCompliance';
import AdminClientRequests from './pages/admin/ClientRequests';
import AdminFiscal from './pages/admin/Fiscal';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeWorks from './pages/employee/Works';
import EmployeeWorkDetail from './pages/employee/WorkDetail';
import EmployeeTasks from './pages/employee/Tasks';
import EmployeeDocuments from './pages/employee/Documents';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import ClientWorks from './pages/client/Works';
import ClientWorkDetail from './pages/client/WorkDetail';
import ClientDocuments from './pages/client/Documents';
import ClientRequests from './pages/client/Requests';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import ProposalSignature from './pages/public/ProposalSignature';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (sem autenticação) */}
          <Route path="/assinar/:token" element={<ProposalSignature />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'commercial', 'engineer', 'finance']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/pipeline" element={<AdminPipeline />} />
              <Route path="/admin/works" element={<AdminWorks />} />
              <Route path="/admin/works/:id" element={<AdminWorkDetail />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/proposals" element={<AdminProposals />} />
              <Route path="/admin/protocols" element={<AdminProtocols />} />
              <Route path="/admin/documents" element={<AdminDocuments />} />
              <Route path="/admin/clients" element={<AdminClients />} />
              <Route path="/admin/finance" element={<AdminFinance />} />
              <Route path="/admin/finance-simulator" element={<AdminFinanceSimulator />} />
              <Route path="/admin/catalog" element={<AdminCatalogManagement />} />
              <Route path="/admin/suppliers" element={<AdminSuppliers />} />
              <Route path="/admin/quotations" element={<AdminQuotations />} />
              <Route path="/admin/price-history" element={<AdminPriceHistory />} />
              <Route path="/admin/client-requests" element={<AdminClientRequests />} />
              <Route path="/admin/fiscal" element={<AdminFiscal />} />

              {/* Restricted Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/employees" element={<AdminEmployees />} />
                <Route path="/admin/employees/:id/compliance" element={<AdminEmployeeCompliance />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee', 'admin']} />}>
            <Route element={<EmployeeLayout />}>
              <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
              <Route path="/employee/works" element={<EmployeeWorks />} />
              <Route path="/employee/works/:id" element={<EmployeeWorkDetail />} />
              <Route path="/employee/tasks" element={<EmployeeTasks />} />
              <Route path="/employee/documents" element={<EmployeeDocuments />} />
            </Route>
          </Route>

          {/* Client Routes */}
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route element={<ClientLayout />}>
              <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/works" element={<ClientWorks />} />
              <Route path="/client/works/:id" element={<ClientWorkDetail />} />
              <Route path="/client/documents" element={<ClientDocuments />} />
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
