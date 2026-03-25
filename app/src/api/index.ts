import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { toast } from 'sonner';

const RAW_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
// Normalise: ensure URL ends with exactly one /api (avoids /api/api duplication)
const API_URL = RAW_URL.endsWith('/api/api')
  ? RAW_URL.slice(0, -4)        // strip extra /api
  : RAW_URL.endsWith('/api')
    ? RAW_URL                    // already correct
    : RAW_URL + '/api';          // add /api

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

  async getActivityReport(filters?: { userId?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const response = await this.client.get(`/users/activity-report?${params.toString()}`);
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

  async uploadClientDocument(clientId: string, formData: FormData) {
    const response = await this.client.post(`/clients/${clientId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  async updateWorkUpdate(updateId: string, data: { description?: string; progress?: number }) {
    const response = await this.client.put(`/works/updates/${updateId}`, data);
    return response.data;
  }

  async deleteWorkUpdate(updateId: string) {
    const response = await this.client.delete(`/works/updates/${updateId}`);
    return response.data;
  }

  // Work Phases
  async getWorkPhases(workId: string) {
    const response = await this.client.get(`/works/${workId}/phases`);
    return response.data;
  }

  async createWorkPhase(workId: string, data: { title: string; weight: number }) {
    const response = await this.client.post(`/works/${workId}/phases`, data);
    return response.data;
  }

  async updateWorkPhase(phaseId: string, data: any) {
    const response = await this.client.put(`/works/phases/${phaseId}`, data);
    return response.data;
  }

  async deleteWorkPhase(phaseId: string) {
    const response = await this.client.delete(`/works/phases/${phaseId}`);
    return response.data;
  }

  async recalculateWorkProgress(workId: string) {
    const response = await this.client.post(`/works/${workId}/recalculate-progress`);
    return response.data;
  }

  // Work Type Configs
  async getWorkTypes() {
    const response = await this.client.get('/works/types/all');
    return response.data;
  }

  async createWorkType(data: { label: string; key?: string }) {
    const response = await this.client.post('/works/types', data);
    return response.data;
  }

  async updateWorkType(id: string, data: any) {
    const response = await this.client.put(`/works/types/${id}`, data);
    return response.data;
  }

  async deleteWorkType(id: string) {
    const response = await this.client.delete(`/works/types/${id}`);
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

  async completeTask(id: string, data: { result?: string; resolutionType: string; resolutionNotes?: string }) {
    const response = await this.client.post(`/tasks/${id}/complete`, data);
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
  async getDocuments(filters?: { workId?: string; type?: string; folderId?: string; proposalId?: string; contractId?: string }) {
    const response = await this.client.get('/documents', { params: filters });
    return response.data;
  }

  async getContractDocuments(contractId: string) {
    const response = await this.client.get('/documents', { params: { contractId } });
    return response.data;
  }

  async uploadContractDocument(contractId: string, file: File, name?: string, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contractId', contractId);
    formData.append('type', 'contract');
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    const response = await this.client.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  async uploadDocument(file: File, data?: { name?: string; workId?: string; taskId?: string; type?: string; folderId?: string; description?: string; purpose?: string; tags?: string[]; sourceOrganization?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (data?.name) formData.append('name', data.name);
    if (data?.workId) formData.append('workId', data.workId);
    if (data?.taskId) formData.append('taskId', data.taskId);
    if (data?.type) formData.append('type', data.type);
    if (data?.folderId) formData.append('folderId', data.folderId);
    if (data?.description) formData.append('description', data.description);
    if (data?.purpose) formData.append('purpose', data.purpose);
    if (data?.tags?.length) formData.append('tags', JSON.stringify(data.tags));
    if (data?.sourceOrganization) formData.append('sourceOrganization', data.sourceOrganization);

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

  async revertProposalAcceptance(id: string) {
    const response = await this.client.post(`/proposals/${id}/revert-acceptance`);
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

  async permanentDeleteProposal(id: string) {
    const response = await this.client.delete(`/proposals/${id}/permanent`);
    return response.data;
  }

  async getProposalRevisions(id: string) {
    const response = await this.client.get(`/proposals/${id}/revisions`);
    return response.data;
  }

  async restoreProposalRevision(proposalId: string, revisionId: string) {
    const response = await this.client.post(`/proposals/${proposalId}/restore-revision`, { revisionId });
    return response.data;
  }

  async deleteProposalRevision(proposalId: string, revisionId: string) {
    const response = await this.client.delete(`/proposals/${proposalId}/revisions`, { data: { revisionId } });
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

  // ═══ Companies ═══
  async getPrimaryCompany() {
    const response = await this.client.get('/companies/primary');
    return response.data;
  }

  async updateCompany(id: string, data: any) {
    const response = await this.client.patch(`/companies/${id}`, data);
    return response.data;
  }

  async uploadCompanySignature(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post(`/companies/${id}/signature`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  // Grouping — Composição de Produtos
  async getGroupingItems(itemId: string) {
    const response = await this.client.get(`/catalog/items/${itemId}/grouping`);
    return response.data;
  }

  async saveGroupingItems(itemId: string, items: { childItemId: string; quantity: number; unit?: string; sortOrder?: number; notes?: string }[]) {
    const response = await this.client.put(`/catalog/items/${itemId}/grouping`, { items });
    return response.data;
  }

  async expandGrouping(itemId: string, multiplier?: number) {
    const params = multiplier ? { multiplier: String(multiplier) } : {};
    const response = await this.client.get(`/catalog/items/${itemId}/expand-grouping`, { params });
    return response.data;
  }

  // Recalcula o unitPrice dos kits que contêm o item como filho
  async recalcKitPrices(itemId: string): Promise<{ updatedKits: number; kits: { id: string; name: string; newPrice: number }[] }> {
    const response = await this.client.post(`/catalog/items/${itemId}/recalc-kit-prices`);
    return response.data;
  }

  // Import — Importação via Planilha
  async importCatalog(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/catalog/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async downloadImportTemplate(): Promise<Blob> {
    const response = await this.client.get('/catalog/import/template', {
      responseType: 'blob',
    });
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

  async updateMeasurement(id: string, data: any) {
    const response = await this.client.put(`/measurements/${id}`, data);
    return response.data;
  }

  async deleteMeasurement(id: string) {
    const response = await this.client.delete(`/measurements/${id}`);
    return response.data;
  }

  async getMeasurementBalance(workId: string) {
    const response = await this.client.get(`/measurements/balance/${workId}`);
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

  // ═══ PAYMENT RECEIPTS (RECIBOS) ═══════════════════════════════════════

  async getReceipts(proposalId?: string) {
    const params: any = {};
    if (proposalId) params.proposalId = proposalId;
    const response = await this.client.get('/finance/receipts', { params });
    return response.data;
  }

  async getReceipt(id: string) {
    const response = await this.client.get(`/finance/receipts/${id}`);
    return response.data;
  }

  async createReceipt(data: any) {
    const response = await this.client.post('/finance/receipts', data);
    return response.data;
  }

  async updateReceipt(id: string, data: any) {
    const response = await this.client.put(`/finance/receipts/${id}`, data);
    return response.data;
  }

  async deleteReceipt(id: string) {
    const response = await this.client.delete(`/finance/receipts/${id}`);
    return response.data;
  }

  // ═══ PURCHASE ORDERS (PEDIDOS DE COMPRA) ═══════════════════════════════

  async getPurchaseOrders(proposalId?: string, supplierId?: string) {
    const params: any = {};
    if (proposalId) params.proposalId = proposalId;
    if (supplierId) params.supplierId = supplierId;
    const response = await this.client.get('/finance/purchase-orders', { params });
    return response.data;
  }

  async getPurchaseOrder(id: string) {
    const response = await this.client.get(`/finance/purchase-orders/${id}`);
    return response.data;
  }

  async createPurchaseOrder(data: any) {
    const response = await this.client.post('/finance/purchase-orders', data);
    return response.data;
  }

  async updatePurchaseOrder(id: string, data: any) {
    const response = await this.client.put(`/finance/purchase-orders/${id}`, data);
    return response.data;
  }

  async deletePurchaseOrder(id: string) {
    const response = await this.client.delete(`/finance/purchase-orders/${id}`);
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

  // Document Categories (dynamic)
  async getDocumentCategories(): Promise<{ slug: string; label: string }[]> {
    const response = await this.client.get('/compliance/document-categories');
    return response.data;
  }

  async createDocumentCategory(data: { slug?: string; label: string }): Promise<{ slug: string; label: string }> {
    const response = await this.client.post('/compliance/document-categories', data);
    return response.data;
  }

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

  async deleteRequirement(requirementId: string) {
    const response = await this.client.delete(`/compliance/requirements/${requirementId}`);
    return response.data;
  }

  async updateDocumentTypeName(docTypeId: string, name: string) {
    const response = await this.client.put(`/compliance/document-types/${docTypeId}/name`, { name });
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

  async updateComplianceDocument(complianceDocId: string, data: { issueDate?: string; expiryDate?: string; observations?: string }) {
    const response = await this.client.put(`/compliance/documents/${complianceDocId}`, data);
    return response.data;
  }

  async deleteComplianceDocument(complianceDocId: string) {
    const response = await this.client.delete(`/compliance/documents/${complianceDocId}`);
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

  // ZIP Download
  async downloadComplianceZip(employeeIds: string[], categories?: string[], documentTypeIds?: string[]) {
    const response = await this.client.post('/compliance/download-zip', {
      employeeIds, categories, documentTypeIds,
    }, { responseType: 'blob' });
    return response.data;
  }

  // Restore soft-deleted document
  async restoreComplianceDocument(complianceDocId: string) {
    const response = await this.client.post(`/compliance/documents/${complianceDocId}/restore`);
    return response.data;
  }

  // Expiring documents
  async getExpiringDocuments(days = 15) {
    const response = await this.client.get('/compliance/expiring', { params: { days } });
    return response.data;
  }

  // Work employee documents (client portal)
  async getWorkEmployeeDocuments(workId: string) {
    const response = await this.client.get(`/compliance/works/${workId}/employee-documents`);
    return response.data;
  }

  // All documents (including deleted) for admin
  async getComplianceDocumentsAll(employeeId: string) {
    const response = await this.client.get(`/compliance/employees/${employeeId}/documents-all`);
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

  // Notifications
  async getNotifications() {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  // Daily Logs (Diário de Obra)
  async getDailyLogs(workId?: string) {
    const params = workId ? { workId } : {};
    const response = await this.client.get('/daily-logs', { params });
    return response.data;
  }

  async getDailyLog(id: string) {
    const response = await this.client.get(`/daily-logs/${id}`);
    return response.data;
  }

  async createDailyLog(data: any) {
    const response = await this.client.post('/daily-logs', data);
    return response.data;
  }

  async updateDailyLog(id: string, data: any) {
    const response = await this.client.put(`/daily-logs/${id}`, data);
    return response.data;
  }

  async signDailyLog(id: string, signedBy: string) {
    const response = await this.client.post(`/daily-logs/${id}/sign`, { signedBy });
    return response.data;
  }

  async getDailyLogStats(workId: string) {
    const response = await this.client.get(`/daily-logs/stats/${workId}`);
    return response.data;
  }

  // Inventory (Estoque)
  async getInventoryItems(category?: string) {
    const params = category ? { category } : {};
    const response = await this.client.get('/inventory/items', { params });
    return response.data;
  }

  async getInventoryItem(id: string) {
    const response = await this.client.get(`/inventory/items/${id}`);
    return response.data;
  }

  async createInventoryItem(data: any) {
    const response = await this.client.post('/inventory/items', data);
    return response.data;
  }

  async updateInventoryItem(id: string, data: any) {
    const response = await this.client.put(`/inventory/items/${id}`, data);
    return response.data;
  }

  async deleteInventoryItem(id: string) {
    const response = await this.client.delete(`/inventory/items/${id}`);
    return response.data;
  }

  async getLowStockItems() {
    const response = await this.client.get('/inventory/items/low-stock');
    return response.data;
  }

  async getInventoryMovements(filters?: { itemId?: string; workId?: string; type?: string }) {
    const response = await this.client.get('/inventory/movements', { params: filters });
    return response.data;
  }

  async createInventoryMovement(data: any) {
    const response = await this.client.post('/inventory/movements', data);
    return response.data;
  }

  async getInventorySummary() {
    const response = await this.client.get('/inventory/summary');
    return response.data;
  }

  // Service Orders (Ordens de Serviço)
  async getServiceOrders(filters?: { status?: string; workId?: string; assignedToId?: string }) {
    const response = await this.client.get('/service-orders', { params: filters });
    return response.data;
  }

  async getServiceOrder(id: string) {
    const response = await this.client.get(`/service-orders/${id}`);
    return response.data;
  }

  async createServiceOrder(data: any) {
    const response = await this.client.post('/service-orders', data);
    return response.data;
  }

  async updateServiceOrder(id: string, data: any) {
    const response = await this.client.put(`/service-orders/${id}`, data);
    return response.data;
  }

  async deleteServiceOrder(id: string) {
    const response = await this.client.delete(`/service-orders/${id}`);
    return response.data;
  }

  async signServiceOrder(id: string, data: { signature: string; name: string }) {
    const response = await this.client.post(`/service-orders/${id}/sign`, data);
    return response.data;
  }

  async getServiceOrderStats() {
    const response = await this.client.get('/service-orders/stats');
    return response.data;
  }

  // Contracts (Contratos)
  async getContracts(filters?: { status?: string; workId?: string; clientId?: string }) {
    const response = await this.client.get('/contracts', { params: filters });
    return response.data;
  }

  async getContract(id: string) {
    const response = await this.client.get(`/contracts/${id}`);
    return response.data;
  }

  async createContract(data: any) {
    const response = await this.client.post('/contracts', data);
    return response.data;
  }

  async updateContract(id: string, data: any) {
    const response = await this.client.put(`/contracts/${id}`, data);
    return response.data;
  }

  async deleteContract(id: string) {
    const response = await this.client.delete(`/contracts/${id}`);
    return response.data;
  }

  async createContractAddendum(contractId: string, data: any) {
    const response = await this.client.post(`/contracts/${contractId}/addendums`, data);
    return response.data;
  }

  async deleteContractAddendum(addendumId: string) {
    const response = await this.client.delete(`/contracts/addendums/${addendumId}`);
    return response.data;
  }

  async getContractStats() {
    const response = await this.client.get('/contracts/stats');
    return response.data;
  }

  // Contract Signing (Assinatura Digital de Contratos)
  async generateContractSignatureLink(id: string) {
    const response = await this.client.post(`/contracts/${id}/generate-signature-link`);
    return response.data;
  }

  async getContractSignatureStatus(id: string) {
    const response = await this.client.get(`/contracts/${id}/signature-status`);
    return response.data;
  }

  async getContractByToken(token: string) {
    const response = await this.client.get(`/contracts/sign/${token}`);
    return response.data;
  }

  async signContractByToken(token: string, data: { name: string; document: string }) {
    const response = await this.client.post(`/contracts/sign/${token}/confirm`, data);
    return response.data;
  }

  // Contract AI Suggestions
  async suggestContractClauses(data: { contractType: string; scope?: string; value?: number; proposalId?: string; fields?: string[] }) {
    const response = await this.client.post('/ai/suggest-clauses', data);
    return response.data;
  }

  async attachProposalToContract(contractId: string) {
    const response = await this.client.post(`/contracts/${contractId}/attach-proposal`);
    return response.data;
  }

  // Contract Templates
  async getContractTemplates() {
    const response = await this.client.get('/contracts/templates');
    return response.data;
  }

  async createContractTemplate(data: any) {
    const response = await this.client.post('/contracts/templates', data);
    return response.data;
  }

  async updateContractTemplate(id: string, data: any) {
    const response = await this.client.put(`/contracts/templates/${id}`, data);
    return response.data;
  }

  async deleteContractTemplate(id: string) {
    const response = await this.client.delete(`/contracts/templates/${id}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // Solar Projects (Energia Solar Fotovoltaica)
  // ═══════════════════════════════════════════════════════════════

  async getSolarProjects() {
    const response = await this.client.get('/solar-projects');
    return response.data;
  }

  async getSolarProject(id: string) {
    const response = await this.client.get(`/solar-projects/${id}`);
    return response.data;
  }

  async createSolarProject(data: any) {
    const response = await this.client.post('/solar-projects', data);
    return response.data;
  }

  async updateSolarProject(id: string, data: any) {
    const response = await this.client.put(`/solar-projects/${id}`, data);
    return response.data;
  }

  async deleteSolarProject(id: string) {
    const response = await this.client.delete(`/solar-projects/${id}`);
    return response.data;
  }

  async dimensionSolarProject(id: string) {
    const response = await this.client.post(`/solar-projects/${id}/dimension`);
    return response.data;
  }

  async calculateSolarFinancials(id: string) {
    const response = await this.client.post(`/solar-projects/${id}/calculate-financials`);
    return response.data;
  }

  async generateSolarProposal(id: string) {
    const response = await this.client.post(`/solar-projects/${id}/generate-proposal`);
    return response.data;
  }

  async getSolarProjectByProposal(proposalId: string) {
    const response = await this.client.get(`/solar-projects/by-proposal/${proposalId}`);
    return response.data;
  }

  async getSolarHspTable() {
    const response = await this.client.get('/solar-projects/hsp-table');
    return response.data;
  }

  async searchSolarEquipment(q?: string) {
    const response = await this.client.get('/solar-projects/catalog-equipment', { params: { q } });
    return response.data;
  }

  // ═══ COMPANIES ═════════════════════════════════════════

  async getCompanies() {
    const response = await this.client.get('/companies');
    return response.data;
  }

  async getCompany(id: string) {
    const response = await this.client.get(`/companies/${id}`);
    return response.data;
  }

  async getPrimaryCompany() {
    const response = await this.client.get('/companies/primary');
    return response.data;
  }

  async createCompany(data: any) {
    const response = await this.client.post('/companies', data);
    return response.data;
  }

  async updateCompany(id: string, data: any) {
    const response = await this.client.patch(`/companies/${id}`, data);
    return response.data;
  }

  async deleteCompany(id: string) {
    const response = await this.client.delete(`/companies/${id}`);
    return response.data;
  }

  async uploadCompanyLogo(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post(`/companies/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Structure Templates
  async getStructureTemplates(filters?: { concessionaria?: string; tensionLevel?: string; category?: string; search?: string }) {
    const response = await this.client.get('/structure-templates', { params: filters });
    return response.data;
  }

  async getStructureTemplate(id: string) {
    const response = await this.client.get(`/structure-templates/${id}`);
    return response.data;
  }

  async getStructureTemplateSummary(id: string) {
    const response = await this.client.get(`/structure-templates/${id}/summary`);
    return response.data;
  }

  async getStructureTemplateForProposal(id: string) {
    const response = await this.client.get(`/structure-templates/${id}/for-proposal`);
    return response.data;
  }

  async createStructureTemplate(data: any) {
    const response = await this.client.post('/structure-templates', data);
    return response.data;
  }

  async updateStructureTemplate(id: string, data: any) {
    const response = await this.client.put(`/structure-templates/${id}`, data);
    return response.data;
  }

  async deleteStructureTemplate(id: string) {
    const response = await this.client.delete(`/structure-templates/${id}`);
    return response.data;
  }

  async addStructureTemplateItem(templateId: string, data: any) {
    const response = await this.client.post(`/structure-templates/${templateId}/items`, data);
    return response.data;
  }

  async updateStructureTemplateItem(itemId: string, data: any) {
    const response = await this.client.put(`/structure-templates/items/${itemId}`, data);
    return response.data;
  }

  async deleteStructureTemplateItem(itemId: string) {
    const response = await this.client.delete(`/structure-templates/items/${itemId}`);
    return response.data;
  }

  // Markup
  async getMarkupConfigs(scope?: string) {
    const params = scope ? { scope } : {};
    const response = await this.client.get('/markup', { params });
    return response.data;
  }

  async getMarkupConfig(id: string) {
    const response = await this.client.get(`/markup/${id}`);
    return response.data;
  }

  async resolveMarkup(criteria: { categoryId?: string; activityType?: string; supplierType?: string; clientType?: string }) {
    const response = await this.client.get('/markup/resolve', { params: criteria });
    return response.data;
  }

  async createMarkupConfig(data: any) {
    const response = await this.client.post('/markup', data);
    return response.data;
  }

  async updateMarkupConfig(id: string, data: any) {
    const response = await this.client.put(`/markup/${id}`, data);
    return response.data;
  }

  async deleteMarkupConfig(id: string) {
    const response = await this.client.delete(`/markup/${id}`);
    return response.data;
  }

  // AI
  async aiChat(message: string, history: { role: string; content: string }[] = []) {
    const response = await this.client.post('/ai/chat', { message, history });
    return response.data;
  }

  async aiAnalyzeMaterials(text: string) {
    const response = await this.client.post('/ai/analyze-materials', { text });
    return response.data;
  }

  async getAiConfigs() {
    const response = await this.client.get('/ai/config');
    return response.data;
  }

  async setAiConfig(key: string, value: string, isSecret = false) {
    const response = await this.client.put('/ai/config', { key, value, isSecret });
    return response.data;
  }

  // ── AI Action Tokens ──
  async getAiActionTokens() {
    const response = await this.client.get('/ai/action-tokens');
    return response.data;
  }

  async createAiActionToken(data: { targetUserId?: string; durationMinutes: number; description?: string }) {
    const response = await this.client.post('/ai/action-tokens', data);
    return response.data;
  }

  async revokeAiActionToken(id: string) {
    const response = await this.client.delete(`/ai/action-tokens/${id}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPANY DOCUMENTS
  // ═══════════════════════════════════════════════════════════════

  async getCompanyDocuments(companyId: string) {
    const response = await this.client.get(`/companies/${companyId}/documents`);
    return response.data;
  }

  async createCompanyDocument(companyId: string, data: any) {
    const response = await this.client.post(`/companies/${companyId}/documents`, data);
    return response.data;
  }

  async updateCompanyDocument(docId: string, data: any) {
    const response = await this.client.patch(`/companies/documents/${docId}`, data);
    return response.data;
  }

  async deleteCompanyDocument(docId: string) {
    const response = await this.client.delete(`/companies/documents/${docId}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // SAFETY PROGRAMS
  // ═══════════════════════════════════════════════════════════════

  async getSafetyPrograms() {
    const response = await this.client.get('/compliance/safety-programs');
    return response.data;
  }

  async getSafetyProgram(id: string) {
    const response = await this.client.get(`/compliance/safety-programs/${id}`);
    return response.data;
  }

  async createSafetyProgram(data: any) {
    const response = await this.client.post('/compliance/safety-programs', data);
    return response.data;
  }

  async updateSafetyProgram(id: string, data: any) {
    const response = await this.client.put(`/compliance/safety-programs/${id}`, data);
    return response.data;
  }

  async deleteSafetyProgram(id: string) {
    const response = await this.client.delete(`/compliance/safety-programs/${id}`);
    return response.data;
  }

  async uploadSafetyProgramFile(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post(`/compliance/safety-programs/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  getSafetyProgramFileUrl(id: string) {
    return `${this.client.defaults.baseURL}/compliance/safety-programs/${id}/download`;
  }

  // ═══════════════════════════════════════════════════════════════
  // RISK GROUPS — GHE
  // ═══════════════════════════════════════════════════════════════

  async getRiskGroups(programId?: string) {
    const params = programId ? `?programId=${programId}` : '';
    const response = await this.client.get(`/compliance/risk-groups${params}`);
    return response.data;
  }

  async getRiskGroup(id: string) {
    const response = await this.client.get(`/compliance/risk-groups/${id}`);
    return response.data;
  }

  async createRiskGroup(data: any) {
    const response = await this.client.post('/compliance/risk-groups', data);
    return response.data;
  }

  async updateRiskGroup(id: string, data: any) {
    const response = await this.client.put(`/compliance/risk-groups/${id}`, data);
    return response.data;
  }

  async deleteRiskGroup(id: string) {
    const response = await this.client.delete(`/compliance/risk-groups/${id}`);
    return response.data;
  }

  async addExamToRiskGroup(riskGroupId: string, data: any) {
    const response = await this.client.post(`/compliance/risk-groups/${riskGroupId}/exams`, data);
    return response.data;
  }

  async updateRiskGroupExam(id: string, data: any) {
    const response = await this.client.put(`/compliance/risk-group-exams/${id}`, data);
    return response.data;
  }

  async removeExamFromRiskGroup(id: string) {
    const response = await this.client.delete(`/compliance/risk-group-exams/${id}`);
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // OCCUPATIONAL EXAMS
  // ═══════════════════════════════════════════════════════════════

  async getOccupationalExams() {
    const response = await this.client.get('/compliance/occupational-exams');
    return response.data;
  }

  async createOccupationalExam(data: any) {
    const response = await this.client.post('/compliance/occupational-exams', data);
    return response.data;
  }

  async updateOccupationalExam(id: string, data: any) {
    const response = await this.client.put(`/compliance/occupational-exams/${id}`, data);
    return response.data;
  }

  async deleteOccupationalExam(id: string) {
    const response = await this.client.delete(`/compliance/occupational-exams/${id}`);
    return response.data;
  }

  async seedOccupationalExams() {
    const response = await this.client.post('/compliance/occupational-exams/seed');
    return response.data;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXAM REFERRALS
  // ═══════════════════════════════════════════════════════════════

  async getExamReferrals() {
    const response = await this.client.get('/compliance/exam-referrals');
    return response.data;
  }

  async getExamReferral(id: string) {
    const response = await this.client.get(`/compliance/exam-referrals/${id}`);
    return response.data;
  }

  async createExamReferral(data: any) {
    const response = await this.client.post('/compliance/exam-referrals', data);
    return response.data;
  }

  async updateExamReferral(id: string, data: any) {
    const response = await this.client.put(`/compliance/exam-referrals/${id}`, data);
    return response.data;
  }

  async updateExamReferralItems(id: string, items: any[]) {
    const response = await this.client.put(`/compliance/exam-referrals/${id}/items`, { items });
    return response.data;
  }

  async deleteExamReferral(id: string) {
    const response = await this.client.delete(`/compliance/exam-referrals/${id}`);
    return response.data;
  }

  async getClinicSuppliers() {
    const response = await this.client.get('/compliance/clinic-suppliers');
    return response.data;
  }

  // ═══ O&M (Operação e Manutenção Solar) ═══════════════════════════
  async getOemDashboard() { return (await this.client.get('/oem/dashboard')).data; }

  // Usinas
  async getOemUsinas(clienteId?: string) { return (await this.client.get('/oem/usinas', { params: { clienteId } })).data; }
  async getOemUsina(id: string) { return (await this.client.get(`/oem/usinas/${id}`)).data; }
  async createOemUsina(data: any) { return (await this.client.post('/oem/usinas', data)).data; }
  async updateOemUsina(id: string, data: any) { return (await this.client.put(`/oem/usinas/${id}`, data)).data; }
  async deleteOemUsina(id: string) { return (await this.client.delete(`/oem/usinas/${id}`)).data; }
  async importOemUsinaFromSolar(projectId: string) { return (await this.client.post(`/oem/usinas/import-from-solar/${projectId}`)).data; }

  // Planos
  async getOemPlanos() { return (await this.client.get('/oem/planos')).data; }
  async getOemPlano(id: string) { return (await this.client.get(`/oem/planos/${id}`)).data; }
  async createOemPlano(data: any) { return (await this.client.post('/oem/planos', data)).data; }
  async updateOemPlano(id: string, data: any) { return (await this.client.put(`/oem/planos/${id}`, data)).data; }
  async deleteOemPlano(id: string) { return (await this.client.delete(`/oem/planos/${id}`)).data; }

  // Contratos
  async getOemContratos(status?: string) { return (await this.client.get('/oem/contratos', { params: { status } })).data; }
  async getOemContrato(id: string) { return (await this.client.get(`/oem/contratos/${id}`)).data; }
  async createOemContrato(data: any) { return (await this.client.post('/oem/contratos', data)).data; }
  async updateOemContrato(id: string, data: any) { return (await this.client.put(`/oem/contratos/${id}`, data)).data; }
  async deleteOemContrato(id: string) { return (await this.client.delete(`/oem/contratos/${id}`)).data; }
  async calculateOemPrice(usinaId: string, planoId: string) { return (await this.client.post('/oem/contratos/calculate-price', { usinaId, planoId })).data; }
}

export const api = new ApiService();

