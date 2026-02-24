import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Dashboard
export const dashboard = {
  getAll: () => api.get('/dashboard'),
  getKPIs: () => api.get('/dashboard/kpis'),
  getPipeline: () => api.get('/dashboard/pipeline'),
  getAlerts: () => api.get('/dashboard/alerts'),
};

// Clients
export const clients = {
  getAll: (query?: string) => api.get('/clients', { params: { q: query } }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Leads
export const leads = {
  getAll: (status?: string) => api.get('/leads', { params: { status } }),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
  convert: (id: string, opportunityId: string) =>
    api.post(`/leads/${id}/convert`, { opportunityId }),
  delete: (id: string) => api.delete(`/leads/${id}`),
};

// Opportunities
export const opportunities = {
  getAll: (stage?: string) => api.get('/opportunities', { params: { stage } }),
  getById: (id: string) => api.get(`/opportunities/${id}`),
  create: (data: any) => api.post('/opportunities', data),
  update: (id: string, data: any) => api.put(`/opportunities/${id}`, data),
  moveStage: (id: string, stage: string) =>
    api.post(`/opportunities/${id}/move`, { stage }),
  delete: (id: string) => api.delete(`/opportunities/${id}`),
};

// Works
export const works = {
  getAll: (status?: string) => api.get('/works', { params: { status } }),
  getById: (id: string) => api.get(`/works/${id}`),
  create: (data: any) => api.post('/works', data),
  update: (id: string, data: any) => api.put(`/works/${id}`, data),
  updateProgress: (id: string, progress: number) =>
    api.post(`/works/${id}/progress`, { progress }),
  delete: (id: string) => api.delete(`/works/${id}`),
};

// Processes
export const processes = {
  getAll: () => api.get('/processes'),
  getById: (id: string) => api.get(`/processes/${id}`),
  getByWork: (workId: string) => api.get(`/processes/work/${workId}`),
  create: (data: any) => api.post('/processes', data),
  updateStage: (stageId: string, data: any) =>
    api.put(`/processes/stages/${stageId}`, data),
  toggleChecklist: (itemId: string, completed: boolean) =>
    api.post(`/processes/checklist/${itemId}/toggle`, { completed }),
};

// Tasks
export const tasks = {
  getAll: (assignedTo?: string) =>
    api.get('/tasks', { params: { assignedTo } }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  complete: (id: string, result?: string) =>
    api.post(`/tasks/${id}/complete`, { result }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Proposals
export const proposals = {
  getAll: (status?: string) =>
    api.get('/proposals', { params: { status } }),
  getById: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  send: (id: string) => api.post(`/proposals/${id}/send`),
  accept: (id: string) => api.post(`/proposals/${id}/accept`),
  delete: (id: string) => api.delete(`/proposals/${id}`),
};

// Protocols
export const protocols = {
  getAll: (status?: string) =>
    api.get('/protocols', { params: { status } }),
  getById: (id: string) => api.get(`/protocols/${id}`),
  create: (data: any) => api.post('/protocols', data),
  update: (id: string, data: any) => api.put(`/protocols/${id}`, data),
  getSLAStats: () => api.get('/protocols/stats/sla'),
};

// Documents
export const documents = {
  getAll: (workId?: string, type?: string) =>
    api.get('/documents', { params: { workId, type } }),
  getById: (id: string) => api.get(`/documents/${id}`),
  create: (data: any) => api.post('/documents', data),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// Packages
export const packages = {
  getAll: () => api.get('/packages'),
  getById: (id: string) => api.get(`/packages/${id}`),
  suggest: (serviceType: string) =>
    api.get('/packages/suggest', { params: { serviceType } }),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};

// Rules
export const rules = {
  getAll: () => api.get('/rules'),
  getById: (id: string) => api.get(`/rules/${id}`),
  evaluate: (context: any) => api.post('/rules/evaluate', context),
  create: (data: any) => api.post('/rules', data),
  update: (id: string, data: any) => api.put(`/rules/${id}`, data),
  delete: (id: string) => api.delete(`/rules/${id}`),
};

// Finance
export const finance = {
  getPayments: (status?: string, workId?: string) =>
    api.get('/finance/payments', { params: { status, workId } }),
  getPaymentById: (id: string) => api.get(`/finance/payments/${id}`),
  createPayment: (data: any) => api.post('/finance/payments', data),
  updatePayment: (id: string, data: any) =>
    api.put(`/finance/payments/${id}`, data),
  registerPayment: (
    id: string,
    amount: number,
    method: string,
    transactionId?: string
  ) =>
    api.post(`/finance/payments/${id}/register`, {
      amount,
      method,
      transactionId,
    }),
  getSummary: () => api.get('/finance/summary'),
};
