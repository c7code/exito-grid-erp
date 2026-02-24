import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('electraflow_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    let isRedirecting = false;

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Only redirect if user was authenticated AND the 401 came from our own auth
          // (not from an external API proxied through our backend like Nuvem Fiscal)
          const hadToken = !!localStorage.getItem('electraflow_token');
          const requestUrl = error.config?.url || '';
          const isAuthEndpoint = requestUrl.includes('/auth/');
          const isFiscalEndpoint = requestUrl.includes('/fiscal/');
          const isCatalogEndpoint = requestUrl.includes('/catalog/');

          // Don't redirect for fiscal/catalog endpoints — 401 there means
          // external API auth failed (Nuvem Fiscal, BrasilAPI), not our JWT
          if (hadToken && !isRedirecting && !isFiscalEndpoint && !isCatalogEndpoint) {
            isRedirecting = true;
            localStorage.removeItem('electraflow_token');
            localStorage.removeItem('electraflow_user');
            toast.error('Sessão expirada. Faça login novamente.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 500);
          } else if (isAuthEndpoint && hadToken && !isRedirecting) {
            // Auth endpoint 401 = token really expired
            isRedirecting = true;
            localStorage.removeItem('electraflow_token');
            localStorage.removeItem('electraflow_user');
            toast.error('Sessão expirada. Faça login novamente.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 500);
          }
        } else if (error.response?.status === 403) {
          toast.error('Você não tem permissão para realizar esta ação.');
        }
        // Removed auto-toast for 500 — let individual catch blocks handle it
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Users
  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async createUser(data: any) {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.put(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async inviteUser(data: {
    name: string;
    email: string;
    role: string;
    permissions: string[];
    supervisorId?: string;
    department?: string;
    position?: string;
  }) {
    const response = await this.client.post('/users/invite', data);
    return response.data;
  }

  async updateUserPermissions(id: string, permissions: string[]) {
    const response = await this.client.put(`/users/${id}/permissions`, { permissions });
    return response.data;
  }

  async resetUserPassword(id: string) {
    const response = await this.client.post(`/users/${id}/reset-password`);
    return response.data;
  }

  async heartbeat() {
    const response = await this.client.post('/users/heartbeat');
    return response.data;
  }

  async getUserAvailability(date?: string) {
    const params = date ? { date } : {};
    const response = await this.client.get('/users/availability', { params });
    return response.data;
  }

  // Clients
  async getClients() {
    const response = await this.client.get('/clients');
    return response.data;
  }

  async getClient(id: string) {
    const response = await this.client.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(data: any) {
    const response = await this.client.post('/clients', data);
    return response.data;
  }

  async updateClient(id: string, data: any) {
    const response = await this.client.put(`/clients/${id}`, data);
    return response.data;
  }

  async addClientDocument(clientId: string, data: any) {
    const response = await this.client.post(`/clients/${clientId}/documents`, data);
    return response.data;
  }

  async updateClientDocument(id: string, data: any) {
    const response = await this.client.put(`/clients/documents/${id}`, data);
    return response.data;
  }

  async removeClientDocument(id: string) {
    const response = await this.client.delete(`/clients/documents/${id}`);
    return response.data;
  }

  async fetchCnpjData(cnpj: string) {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    return response.data;
  }

  async fetchCepData(cep: string) {
    const cleanCep = cep.replace(/\D/g, '');
    const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (response.data.erro) throw new Error('CEP não encontrado');
    return response.data; // { logradouro, bairro, localidade, uf, ibge, ... }
  }

  async deleteClient(id: string) {
    const response = await this.client.delete(`/clients/${id}`);
    return response.data;
  }

  // Works
  async getWorks() {
    const response = await this.client.get('/works');
    return response.data;
  }

  async getActiveWorks() {
    const response = await this.client.get('/works/active');
    return response.data;
  }

  async getMyWorks() {
    const response = await this.client.get('/works/my-works');
    return response.data;
  }

  async getWork(id: string) {
    const response = await this.client.get(`/works/${id}`);
    return response.data;
  }

  async createWork(data: any) {
    const response = await this.client.post('/works', data);
    return response.data;
  }

  async updateWork(id: string, data: any) {
    const response = await this.client.put(`/works/${id}`, data);
    return response.data;
  }

  async updateWorkProgress(id: string, progress: number) {
    const response = await this.client.post(`/works/${id}/progress`, { progress });
    return response.data;
  }

  async deleteWork(id: string) {
    const response = await this.client.delete(`/works/${id}`);
    return response.data;
  }

  async getWorkUpdates(id: string) {
    const response = await this.client.get(`/works/${id}/updates`);
    return response.data;
  }

  async createWorkUpdate(id: string, formData: FormData) {
    const response = await this.client.post(`/works/${id}/updates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Tasks
  async getTasks() {
    const response = await this.client.get('/tasks');
    return response.data;
  }

  async getMyTasks() {
    const response = await this.client.get('/tasks/my-tasks');
    return response.data;
  }

  async getMyPendingTasks() {
    const response = await this.client.get('/tasks/my-pending');
    return response.data;
  }

  async getTasksByWork(workId: string) {
    const response = await this.client.get(`/tasks/by-work/${workId}`);
    return response.data;
  }

  async getTask(id: string) {
    const response = await this.client.get(`/tasks/${id}`);
    return response.data;
  }

  async createTask(data: any) {
    const response = await this.client.post('/tasks', data);
    return response.data;
  }

  async updateTask(id: string, data: any) {
    const response = await this.client.put(`/tasks/${id}`, data);
    return response.data;
  }

  async updateTaskProgress(id: string, progress: number) {
    const response = await this.client.put(`/tasks/${id}/progress`, { progress });
    return response.data;
  }

  async updateTaskChecklist(id: string, checklist: any[]) {
    const response = await this.client.put(`/tasks/${id}/checklist`, { checklist });
    return response.data;
  }

  async deleteTask(id: string) {
    const response = await this.client.delete(`/tasks/${id}`);
    return response.data;
  }
  // Opportunities
  async getOpportunities(stage?: string) {
    const params = stage ? { stage } : {};
    const response = await this.client.get('/opportunities', { params });
    return response.data;
  }

  async getOpportunity(id: string) {
    const response = await this.client.get(`/opportunities/${id}`);
    return response.data;
  }

  async createOpportunity(data: any) {
    const response = await this.client.post('/opportunities', data);
    return response.data;
  }

  async updateOpportunity(id: string, data: any) {
    const response = await this.client.put(`/opportunities/${id}`, data);
    return response.data;
  }

  async moveOpportunityStage(id: string, stage: string) {
    const response = await this.client.post(`/opportunities/${id}/move`, { stage });
    return response.data;
  }

  async deleteOpportunity(id: string) {
    const response = await this.client.delete(`/opportunities/${id}`);
    return response.data;
  }

  // Documents
  async getDocuments(filters?: { workId?: string; type?: string; folderId?: string; proposalId?: string }) {
    const response = await this.client.get('/documents', { params: filters });
    return response.data;
  }

  async getDocumentsByWork(workId: string) {
    const response = await this.client.get(`/documents/by-work/${workId}`);
    return response.data;
  }

  async getDocument(id: string) {
    const response = await this.client.get(`/documents/${id}`);
    return response.data;
  }

  async createDocument(data: any) {
    const response = await this.client.post('/documents', data);
    return response.data;
  }

  async updateDocument(id: string, data: any) {
    const response = await this.client.put(`/documents/${id}`, data);
    return response.data;
  }

  async uploadDocument(file: File, data?: { name?: string; workId?: string; taskId?: string; type?: string; folderId?: string; description?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (data?.name) formData.append('name', data.name);
    if (data?.workId) formData.append('workId', data.workId);
    if (data?.taskId) formData.append('taskId', data.taskId);
    if (data?.type) formData.append('type', data.type);
    if (data?.folderId) formData.append('folderId', data.folderId);
    if (data?.description) formData.append('description', data.description);

    const response = await this.client.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadDocument(id: string) {
    const response = await this.client.get(`/documents/${id}/file`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async deleteDocument(id: string) {
    const response = await this.client.delete(`/documents/${id}`);
    return response.data;
  }

  // Document Folders
  async getDocumentFolders(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/documents/folders/list', { params });
    return response.data;
  }

  async getRootFolders(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/documents/folders/root', { params });
    return response.data;
  }

  async getDocumentFolder(id: string) {
    const response = await this.client.get(`/documents/folders/${id}`);
    return response.data;
  }

  async createDocumentFolder(data: { name: string; workId?: string; parentId?: string }) {
    const response = await this.client.post('/documents/folders', data);
    return response.data;
  }

  async updateDocumentFolder(id: string, data: any) {
    const response = await this.client.put(`/documents/folders/${id}`, data);
    return response.data;
  }

  async deleteDocumentFolder(id: string) {
    const response = await this.client.delete(`/documents/folders/${id}`);
    return response.data;
  }

  // Workflow Config
  async getWorkflowConfigs() {
    const response = await this.client.get('/workflow-config');
    return response.data;
  }

  async getWorkflowConfig(id: string) {
    const response = await this.client.get(`/workflow-config/${id}`);
    return response.data;
  }

  async getWorkflowByType(workType: string) {
    const response = await this.client.get(`/workflow-config/by-type/${workType}`);
    return response.data;
  }

  async getWorkflowTemplate(workType: string) {
    const response = await this.client.get(`/workflow-config/template/${workType}`);
    return response.data;
  }

  async createWorkflowConfig(data: any) {
    const response = await this.client.post('/workflow-config', data);
    return response.data;
  }

  async updateWorkflowConfig(id: string, data: any) {
    const response = await this.client.put(`/workflow-config/${id}`, data);
    return response.data;
  }

  async deleteWorkflowConfig(id: string) {
    const response = await this.client.delete(`/workflow-config/${id}`);
    return response.data;
  }

  async validateDeadline(data: { workType: string; stage: string; stepName: string; proposedDays: number }) {
    const response = await this.client.post('/workflow-config/validate-deadline', data);
    return response.data;
  }

  // Deadline Approvals
  async getDeadlineApprovals() {
    const response = await this.client.get('/deadline-approvals');
    return response.data;
  }

  async getPendingAdminApprovals() {
    const response = await this.client.get('/deadline-approvals/pending-admin');
    return response.data;
  }

  async getPendingClientApprovals() {
    const response = await this.client.get('/deadline-approvals/pending-client');
    return response.data;
  }

  async getMyDeadlineRequests() {
    const response = await this.client.get('/deadline-approvals/my-requests');
    return response.data;
  }

  async getDeadlineApprovalsByWork(workId: string) {
    const response = await this.client.get(`/deadline-approvals/by-work/${workId}`);
    return response.data;
  }

  async createDeadlineApproval(data: any) {
    const response = await this.client.post('/deadline-approvals', data);
    return response.data;
  }

  async adminApprove(id: string, data: { status: 'approved' | 'rejected'; adminNotes?: string }) {
    const response = await this.client.put(`/deadline-approvals/${id}/admin-approve`, data);
    return response.data;
  }

  async clientApprove(id: string, data: { approved: boolean; clientNotes?: string }) {
    const response = await this.client.put(`/deadline-approvals/${id}/client-approve`, data);
    return response.data;
  }

  async cancelDeadlineApproval(id: string) {
    const response = await this.client.delete(`/deadline-approvals/${id}`);
    return response.data;
  }

  // Dashboard
  async getAdminDashboard() {
    const response = await this.client.get('/dashboard/admin');
    return response.data;
  }

  async getEmployeeDashboard() {
    const response = await this.client.get('/dashboard/employee');
    return response.data;
  }

  async getClientDashboard() {
    const response = await this.client.get('/dashboard/client');
    return response.data;
  }

  // Proposals
  async getProposals(status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get('/proposals', { params });
    return response.data;
  }

  async getProposal(id: string) {
    const response = await this.client.get(`/proposals/${id}`);
    return response.data;
  }

  async createProposal(data: { proposal: any; items: any[] }) {
    const response = await this.client.post('/proposals', data);
    return response.data;
  }

  async updateProposal(id: string, data: any) {
    const response = await this.client.put(`/proposals/${id}`, data);
    return response.data;
  }

  async updateProposalItems(id: string, items: any[]) {
    const response = await this.client.put(`/proposals/${id}/items`, { items });
    return response.data;
  }

  async sendProposal(id: string) {
    const response = await this.client.post(`/proposals/${id}/send`);
    return response.data;
  }

  async acceptProposal(id: string) {
    const response = await this.client.post(`/proposals/${id}/accept`);
    return response.data;
  }

  async rejectProposal(id: string, reason?: string) {
    const response = await this.client.post(`/proposals/${id}/reject`, { reason });
    return response.data;
  }

  async deleteProposal(id: string) {
    const response = await this.client.delete(`/proposals/${id}`);
    return response.data;
  }

  // Assinatura Digital
  async generateSignatureLink(proposalId: string) {
    const response = await this.client.post(`/proposals/${proposalId}/generate-signature-link`);
    return response.data;
  }

  async getSignatureStatus(proposalId: string) {
    const response = await this.client.get(`/proposals/${proposalId}/signature-status`);
    return response.data;
  }

  async getProposalByToken(token: string) {
    const response = await this.client.get(`/proposals/sign/${token}`);
    return response.data;
  }

  async signProposalByToken(token: string, data: { name: string; document: string }) {
    const response = await this.client.post(`/proposals/sign/${token}/confirm`, data);
    return response.data;
  }

  // Catalog
  async getCatalogCategories(type?: string) {
    const params = type ? { type } : {};
    const response = await this.client.get('/catalog/categories', { params });
    return response.data;
  }

  async getCatalogCategoryTree(type?: string) {
    const params = type ? { type } : {};
    const response = await this.client.get('/catalog/categories/tree', { params });
    return response.data;
  }

  async createCatalogCategory(data: any) {
    const response = await this.client.post('/catalog/categories', data);
    return response.data;
  }

  async updateCatalogCategory(id: string, data: any) {
    const response = await this.client.put(`/catalog/categories/${id}`, data);
    return response.data;
  }

  async deleteCatalogCategory(id: string) {
    const response = await this.client.delete(`/catalog/categories/${id}`);
    return response.data;
  }

  async getCatalogItems(filters?: { type?: string; categoryId?: string }) {
    const response = await this.client.get('/catalog/items', { params: filters });
    return response.data;
  }

  async getCatalogCategoryItems(categoryId: string) {
    const response = await this.client.get(`/catalog/categories/${categoryId}/items`);
    return response.data;
  }

  async searchCatalogItems(query: string, type?: string): Promise<any[]> {
    const params: any = { q: query };
    if (type) params.type = type;
    const response = await this.client.get('/catalog/search', { params });
    return response.data;
  }

  async createCatalogItem(data: any) {
    const response = await this.client.post('/catalog/items', data);
    return response.data;
  }

  async updateCatalogItem(id: string, data: any) {
    const response = await this.client.put(`/catalog/items/${id}`, data);
    return response.data;
  }

  async deleteCatalogItem(id: string) {
    const response = await this.client.delete(`/catalog/items/${id}`);
    return response.data;
  }

  // Protocols
  async getProtocols(status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get('/protocols', { params });
    return response.data;
  }

  async getProtocol(id: string) {
    const response = await this.client.get(`/protocols/${id}`);
    return response.data;
  }

  async findOneProtocol(id: string) {
    const response = await this.client.get(`/protocols/${id}`);
    return response.data;
  }

  async createProtocol(data: any) {
    const response = await this.client.post('/protocols', data);
    return response.data;
  }

  async updateProtocol(id: string, data: any) {
    const response = await this.client.put(`/protocols/${id}`, data);
    return response.data;
  }

  async addProtocolEvent(id: string, data: any) {
    const response = await this.client.post(`/protocols/${id}/events`, data);
    return response.data;
  }

  async updateProtocolEvent(eventId: string, data: any) {
    const response = await this.client.put(`/protocols/events/${eventId}`, data);
    return response.data;
  }

  async addProtocolAttachment(eventId: string, data: any) {
    const response = await this.client.post(`/protocols/attachment/${eventId}`, data);
    return response.data;
  }

  async deleteProtocol(id: string) {
    const response = await this.client.delete(`/protocols/${id}`);
    return response.data;
  }

  // Employees
  async getEmployees() {
    const response = await this.client.get('/employees');
    return response.data;
  }

  async getEmployee(id: string) {
    const response = await this.client.get(`/employees/${id}`);
    return response.data;
  }

  async createEmployee(data: any) {
    const response = await this.client.post('/employees', data);
    return response.data;
  }

  async updateEmployee(id: string, data: any) {
    const response = await this.client.put(`/employees/${id}`, data);
    return response.data;
  }

  async deleteEmployee(id: string) {
    const response = await this.client.delete(`/employees/${id}`);
    return response.data;
  }

  async addEmployeeDocument(employeeId: string, data: any) {
    const response = await this.client.post(`/employees/${employeeId}/documents`, data);
    return response.data;
  }

  async updateEmployeeDocument(id: string, data: any) {
    const response = await this.client.put(`/employees/documents/${id}`, data);
    return response.data;
  }

  async removeEmployeeDocument(id: string) {
    const response = await this.client.delete(`/employees/documents/${id}`);
    return response.data;
  }

  // Finance
  async getFinanceSummary() {
    const response = await this.client.get('/finance/summary');
    return response.data;
  }

  async getDREReport(startDate: string, endDate: string) {
    const response = await this.client.get('/finance/dre', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getPayments(status?: string, workId?: string) {
    const params: any = {};
    if (status) params.status = status;
    if (workId) params.workId = workId;
    const response = await this.client.get('/finance/payments', { params });
    return response.data;
  }

  async createPayment(data: any) {
    const response = await this.client.post('/finance/payments', data);
    return response.data;
  }

  async updatePayment(id: string, data: any) {
    const response = await this.client.put(`/finance/payments/${id}`, data);
    return response.data;
  }

  async deletePayment(id: string) {
    const response = await this.client.delete(`/finance/payments/${id}`);
    return response.data;
  }

  async registerPayment(id: string, data: { amount: number; method: string; transactionId?: string }) {
    const response = await this.client.post(`/finance/payments/${id}/register`, data);
    return response.data;
  }

  async uploadPaymentInvoice(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post(`/finance/payments/${id}/invoice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadPaymentInvoice(id: string) {
    const response = await this.client.get(`/finance/payments/${id}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Measurements
  async getMeasurements(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/measurements', { params });
    return response.data;
  }

  async getMeasurement(id: string) {
    const response = await this.client.get(`/measurements/${id}`);
    return response.data;
  }

  async createMeasurement(data: any) {
    const response = await this.client.post('/measurements', data);
    return response.data;
  }

  async calculateMeasurement(id: string) {
    const response = await this.client.post(`/measurements/${id}/calculate`);
    return response.data;
  }

  async approveMeasurement(id: string) {
    const response = await this.client.post(`/measurements/${id}/approve`);
    return response.data;
  }

  // Supply — Suppliers
  async getSuppliers(filters?: { segment?: string; status?: string }) {
    const response = await this.client.get('/supply/suppliers', { params: filters });
    return response.data;
  }

  async getSupplier(id: string) {
    const response = await this.client.get(`/supply/suppliers/${id}`);
    return response.data;
  }

  async createSupplier(data: any) {
    const response = await this.client.post('/supply/suppliers', data);
    return response.data;
  }

  async updateSupplier(id: string, data: any) {
    const response = await this.client.put(`/supply/suppliers/${id}`, data);
    return response.data;
  }

  async deleteSupplier(id: string) {
    const response = await this.client.delete(`/supply/suppliers/${id}`);
    return response.data;
  }

  async addSupplierContact(supplierId: string, data: any) {
    const response = await this.client.post(`/supply/suppliers/${supplierId}/contacts`, data);
    return response.data;
  }

  async deleteSupplierContact(id: string) {
    const response = await this.client.delete(`/supply/contacts/${id}`);
    return response.data;
  }

  // Supply — Quotations
  async getQuotations(status?: string) {
    const params = status ? { status } : {};
    const response = await this.client.get('/supply/quotations', { params });
    return response.data;
  }

  async getQuotation(id: string) {
    const response = await this.client.get(`/supply/quotations/${id}`);
    return response.data;
  }

  async createQuotation(data: any) {
    const response = await this.client.post('/supply/quotations', data);
    return response.data;
  }

  async addQuotationResponse(quotationId: string, data: any) {
    const response = await this.client.post(`/supply/quotations/${quotationId}/responses`, data);
    return response.data;
  }

  async selectQuotationResponse(responseId: string) {
    const response = await this.client.post(`/supply/responses/${responseId}/select`);
    return response.data;
  }

  async compareQuotation(quotationId: string) {
    const response = await this.client.get(`/supply/quotations/${quotationId}/compare`);
    return response.data;
  }

  // Supply — Price History & Markup
  async getPriceHistory(catalogItemId: string, filters?: { supplierId?: string; startDate?: string; endDate?: string }) {
    const response = await this.client.get(`/supply/price-history/${catalogItemId}`, { params: filters });
    return response.data;
  }

  async addPriceManual(data: { catalogItemId: string; supplierId: string; unitPrice: number; date?: string }) {
    const response = await this.client.post('/supply/price-history', data);
    return response.data;
  }

  async getBestPrice(catalogItemId: string) {
    const response = await this.client.get(`/supply/best-price/${catalogItemId}`);
    return response.data;
  }

  async calculateMarkup(data: { catalogItemId: string; markupPercent: number; supplierId?: string }) {
    const response = await this.client.post('/supply/markup-calculator', data);
    return response.data;
  }

  async priceComparison(catalogItemIds: string[]) {
    const response = await this.client.post('/supply/price-comparison', { catalogItemIds });
    return response.data;
  }

  // ═══ WORK COSTS ══════════════════════════════════════════════════════════

  async getWorkCosts(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/finance/work-costs', { params });
    return response.data;
  }

  async createWorkCost(data: any) {
    const response = await this.client.post('/finance/work-costs', data);
    return response.data;
  }

  async updateWorkCost(id: string, data: any) {
    const response = await this.client.put(`/finance/work-costs/${id}`, data);
    return response.data;
  }

  async deleteWorkCost(id: string) {
    const response = await this.client.delete(`/finance/work-costs/${id}`);
    return response.data;
  }

  // ═══ PAYMENT SCHEDULES ═══════════════════════════════════════════════════

  async getPaymentSchedules(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/finance/payment-schedules', { params });
    return response.data;
  }

  async createPaymentSchedule(data: any) {
    const response = await this.client.post('/finance/payment-schedules', data);
    return response.data;
  }

  async updatePaymentSchedule(id: string, data: any) {
    const response = await this.client.put(`/finance/payment-schedules/${id}`, data);
    return response.data;
  }

  async deletePaymentSchedule(id: string) {
    const response = await this.client.delete(`/finance/payment-schedules/${id}`);
    return response.data;
  }

  // ═══ CLIENT PORTAL ══════════════════════════════════════════════════════════

  async clientLogin(email: string, password: string) {
    const response = await this.client.post('/auth/client-login', { email, password });
    return response.data;
  }

  async getClientMyWorks() {
    const response = await this.client.get('/client-portal/my-works');
    return response.data;
  }

  async getClientMyWork(id: string) {
    const response = await this.client.get(`/client-portal/my-works/${id}`);
    return response.data;
  }

  async getClientMyRequests() {
    const response = await this.client.get('/client-portal/my-requests');
    return response.data;
  }

  async createClientRequest(data: { type: string; subject: string; description: string; workId?: string; priority?: string }, files?: File[]) {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('subject', data.subject);
    formData.append('description', data.description);
    if (data.workId) formData.append('workId', data.workId);
    if (data.priority) formData.append('priority', data.priority);
    if (files) {
      files.forEach(file => formData.append('files', file));
    }
    const response = await this.client.post('/client-portal/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getClientProfile() {
    const response = await this.client.get('/auth/client-profile');
    return response.data;
  }

  async generateClientAccess(clientId: string) {
    const response = await this.client.post(`/clients/${clientId}/generate-access`);
    return response.data;
  }

  async syncClientsToUsers() {
    const response = await this.client.post('/clients/sync-users');
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN — Solicitações de Clientes
  // ═══════════════════════════════════════════════════════════════

  async getAllClientRequests() {
    const response = await this.client.get('/clients/requests/all');
    return response.data;
  }

  async getClientRequestDetail(id: string) {
    const response = await this.client.get(`/clients/requests/${id}`);
    return response.data;
  }

  async respondToClientRequest(id: string, data: { adminResponse: string; status: string }) {
    const response = await this.client.put(`/clients/requests/${id}/respond`, data);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPLIANCE — Documentação Ocupacional (NR/SST)
  // ═══════════════════════════════════════════════════════════════

  // Document Types
  async getDocumentTypes() {
    const response = await this.client.get('/compliance/document-types');
    return response.data;
  }

  async getDocumentType(id: string) {
    const response = await this.client.get(`/compliance/document-types/${id}`);
    return response.data;
  }

  async createDocumentType(data: any) {
    const response = await this.client.post('/compliance/document-types', data);
    return response.data;
  }

  async updateDocumentType(id: string, data: any) {
    const response = await this.client.put(`/compliance/document-types/${id}`, data);
    return response.data;
  }

  async deleteDocumentType(id: string) {
    const response = await this.client.delete(`/compliance/document-types/${id}`);
    return response.data;
  }

  // Document Type Rules
  async getDocumentTypeRules(docTypeId: string) {
    const response = await this.client.get(`/compliance/document-types/${docTypeId}/rules`);
    return response.data;
  }

  async createDocumentTypeRule(docTypeId: string, data: any) {
    const response = await this.client.post(`/compliance/document-types/${docTypeId}/rules`, data);
    return response.data;
  }

  async deleteDocumentTypeRule(ruleId: string) {
    const response = await this.client.delete(`/compliance/rules/${ruleId}`);
    return response.data;
  }

  // Employee Requirements (Checklist)
  async getEmployeeRequirements(employeeId: string) {
    const response = await this.client.get(`/compliance/employees/${employeeId}/requirements`);
    return response.data;
  }

  async generateEmployeeChecklist(employeeId: string) {
    const response = await this.client.post(`/compliance/employees/${employeeId}/generate-checklist`);
    return response.data;
  }

  async addManualRequirement(employeeId: string, data: {
    documentTypeId?: string;
    customName?: string;
    customCategory?: string;
    customNrs?: string[];
    customValidityMonths?: number | null;
    customRequiresApproval?: boolean;
  }) {
    const response = await this.client.post(`/compliance/employees/${employeeId}/add-requirement`, data);
    return response.data;
  }

  async setRequirementApplicability(requirementId: string, data: { applicability: string; justification?: string }) {
    const response = await this.client.put(`/compliance/requirements/${requirementId}/applicability`, data);
    return response.data;
  }

  // Compliance Documents
  async getComplianceDocuments(employeeId: string) {
    const response = await this.client.get(`/compliance/employees/${employeeId}/documents`);
    return response.data;
  }

  async createComplianceDocument(data: any) {
    const response = await this.client.post('/compliance/documents', data);
    return response.data;
  }

  // File Upload (real files from machine)
  async uploadComplianceFile(complianceDocId: string, file: File, dates?: { issueDate?: string; expiryDate?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (dates?.issueDate) formData.append('issueDate', dates.issueDate);
    if (dates?.expiryDate) formData.append('expiryDate', dates.expiryDate);
    const response = await this.client.post(`/compliance/documents/${complianceDocId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async uploadComplianceFiles(complianceDocId: string, files: File[], dates?: { issueDate?: string; expiryDate?: string }) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (dates?.issueDate) formData.append('issueDate', dates.issueDate);
    if (dates?.expiryDate) formData.append('expiryDate', dates.expiryDate);
    const response = await this.client.post(`/compliance/documents/${complianceDocId}/upload-multiple`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async quickUploadCompliance(files: File[], data: {
    requirementId?: string;
    documentTypeId: string;
    ownerType: string;
    ownerId: string;
    issueDate?: string;
    expiryDate?: string;
  }) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (data.requirementId) formData.append('requirementId', data.requirementId);
    formData.append('documentTypeId', data.documentTypeId);
    formData.append('ownerType', data.ownerType);
    formData.append('ownerId', data.ownerId);
    if (data.issueDate) formData.append('issueDate', data.issueDate);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    const response = await this.client.post('/compliance/upload-quick', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  getComplianceFileUrl(fileUrl: string) {
    // fileUrl is like "/api/compliance/files/uuid.pdf"
    const base = API_URL.replace(/\/api$/, '');
    return `${base}${fileUrl}`;
  }

  async downloadComplianceFile(filename: string) {
    const base = API_URL.replace(/\/api$/, '');
    const token = localStorage.getItem('electraflow_token');
    const response = await fetch(`${base}/api/compliance/files/${filename}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erro ao baixar arquivo');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getDocumentVersions(complianceDocId: string) {
    const response = await this.client.get(`/compliance/documents/${complianceDocId}/versions`);
    return response.data;
  }

  // Approval
  async approveComplianceDocument(complianceDocId: string, comments?: string) {
    const response = await this.client.post(`/compliance/documents/${complianceDocId}/approve`, { comments });
    return response.data;
  }

  async rejectComplianceDocument(complianceDocId: string, reason: string) {
    const response = await this.client.post(`/compliance/documents/${complianceDocId}/reject`, { reason });
    return response.data;
  }

  // Summary
  async getComplianceSummary(employeeId: string) {
    const response = await this.client.get(`/compliance/employees/${employeeId}/summary`);
    return response.data;
  }

  // Audit Logs
  async getComplianceAuditLogs(params?: { entityType?: string; entityId?: string; limit?: number }) {
    const response = await this.client.get('/compliance/audit-logs', { params });
    return response.data;
  }

  // Seed
  async seedDocumentTypes() {
    const response = await this.client.post('/compliance/seed');
    return response.data;
  }

  // Retention Policies
  async getRetentionPolicies() {
    const response = await this.client.get('/compliance/retention-policies');
    return response.data;
  }

  async createRetentionPolicy(data: any) {
    const response = await this.client.post('/compliance/retention-policies', data);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // FISCAL — Faturamento NF-e / NFS-e
  // ═══════════════════════════════════════════════════════════════

  async getFiscalConfig() {
    const response = await this.client.get('/fiscal/config');
    return response.data;
  }

  async updateFiscalConfig(data: any) {
    const response = await this.client.put('/fiscal/config', data);
    return response.data;
  }

  async uploadFiscalCertificate(file: File, password: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    const response = await this.client.post('/fiscal/config/certificate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async removeFiscalCertificate() {
    const response = await this.client.delete('/fiscal/config/certificate');
    return response.data;
  }

  async getFiscalInvoices(filters?: { type?: string; status?: string; proposalId?: string }) {
    const response = await this.client.get('/fiscal/invoices', { params: filters });
    return response.data;
  }

  async getFiscalInvoice(id: string) {
    const response = await this.client.get(`/fiscal/invoices/${id}`);
    return response.data;
  }

  async createFiscalInvoice(data: {
    proposalId?: string;
    type: 'nfe' | 'nfse';
    naturezaOperacao?: string;
    finalidadeNfe?: number;
    cfopCode?: string;
    customValue?: number;
    installmentNumber?: number;
    installmentTotal?: number;
    // NFS-e specific
    dCompet?: string;
    municipioPrestacao?: string;
    descricaoServico?: string;
    infoComplementares?: string;
    numPedido?: string;
    docReferencia?: string;
    clientData?: {
      name: string;
      document: string;
      address?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      ibgeCode?: string;
      email?: string;
      phone?: string;
    };
    items?: {
      description: string;
      unit?: string;
      quantity: number;
      unitPrice: number;
      total: number;
      serviceType?: string;
      ncm?: string;
      cfopInterno?: string;
      origem?: number;
    }[];
  }) {
    const response = await this.client.post('/fiscal/invoices', data);
    return response.data;
  }

  async cancelFiscalInvoice(id: string, reason: string) {
    const response = await this.client.post(`/fiscal/invoices/${id}/cancel`, { reason });
    return response.data;
  }

  async retryFiscalInvoice(id: string) {
    const response = await this.client.post(`/fiscal/invoices/${id}/retry`);
    return response.data;
  }

  async getFiscalProposalPreview(proposalId: string) {
    const response = await this.client.get(`/fiscal/proposal/${proposalId}/preview`);
    return response.data;
  }

  async syncFiscalCompany() {
    const response = await this.client.post('/fiscal/config/sync-company');
    return response.data;
  }

  async syncFiscalServices() {
    const response = await this.client.post('/fiscal/config/sync-services');
    return response.data;
  }

  async testFiscalConnection() {
    const response = await this.client.get('/fiscal/config/test-connection');
    return response.data;
  }

  async checkFiscalInvoiceStatus(id: string) {
    const response = await this.client.get(`/fiscal/invoices/${id}/status`);
    return response.data;
  }

  async downloadFiscalInvoiceXml(id: string) {
    const response = await this.client.get(`/fiscal/invoices/${id}/xml`, { responseType: 'blob' });
    return response.data;
  }

  async downloadFiscalInvoicePdf(id: string) {
    const response = await this.client.get(`/fiscal/invoices/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  }

  // ═══ EMISSÃO PARCIAL / EDIÇÃO DE VALOR ═══════════════════

  async updateFiscalInvoiceValue(id: string, newValue: number, reason: string) {
    const response = await this.client.put(`/fiscal/invoices/${id}/value`, { newValue, reason });
    return response.data;
  }

  async getFiscalInvoiceHistory(id: string) {
    const response = await this.client.get(`/fiscal/invoices/${id}/history`);
    return response.data;
  }

  async getFiscalProposalSummary(proposalId: string) {
    const response = await this.client.get(`/fiscal/proposal/${proposalId}/summary`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // CATÁLOGO — Produto individual
  // ═══════════════════════════════════════════════════

  async getCatalogItem(id: string) {
    const response = await this.client.get(`/catalog/items/${id}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // NCM — Busca
  // ═══════════════════════════════════════════════════

  async searchNcm(query: string) {
    const response = await this.client.get(`/catalog/ncm/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async searchNcmPublic(query: string) {
    const response = await this.client.get(`/catalog/ncm/public?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getCfopList(filters?: { type?: string; scope?: string; search?: string }) {
    const response = await this.client.get('/catalog/cfop', { params: filters });
    return response.data;
  }

  async getNaturezasOperacao() {
    const response = await this.client.get('/fiscal/naturezas');
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // ESTOQUE
  // ═══════════════════════════════════════════════════

  async getStockSummary() {
    const response = await this.client.get('/catalog/stock/summary');
    return response.data;
  }

  async createStockMovement(data: any) {
    const response = await this.client.post('/catalog/stock/movements', data);
    return response.data;
  }

  async getStockMovements(itemId: string) {
    const response = await this.client.get(`/catalog/items/${itemId}/stock-movements`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // FORNECEDORES DO PRODUTO
  // ═══════════════════════════════════════════════════

  async getProductSuppliers(itemId: string) {
    const response = await this.client.get(`/catalog/items/${itemId}/suppliers`);
    return response.data;
  }

  async linkProductSupplier(itemId: string, data: any) {
    const response = await this.client.post(`/catalog/items/${itemId}/suppliers`, data);
    return response.data;
  }

  async unlinkProductSupplier(itemId: string, supplierId: string) {
    const response = await this.client.delete(`/catalog/items/${itemId}/suppliers/${supplierId}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // REGRAS FISCAIS
  // ═══════════════════════════════════════════════════

  async getFiscalRules() {
    const response = await this.client.get('/catalog/fiscal-rules');
    return response.data;
  }

  async createFiscalRule(data: any) {
    const response = await this.client.post('/catalog/fiscal-rules', data);
    return response.data;
  }

  async updateFiscalRule(id: string, data: any) {
    const response = await this.client.put(`/catalog/fiscal-rules/${id}`, data);
    return response.data;
  }

  async deleteFiscalRule(id: string) {
    const response = await this.client.delete(`/catalog/fiscal-rules/${id}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════
  // CNPJ e CEP — Consulta pública
  // ═══════════════════════════════════════════════════

  async lookupCnpj(cnpj: string) {
    const clean = cnpj.replace(/\D/g, '');
    const response = await this.client.get(`/catalog/cnpj/${clean}`);
    return response.data;
  }

  async lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, '');
    const response = await this.client.get(`/catalog/cep/${clean}`);
    return response.data;
  }
}

export const api = new ApiService();

