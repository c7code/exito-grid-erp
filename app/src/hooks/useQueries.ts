/**
 * Centralized React Query hooks for all major ERP domains.
 * Import from here instead of calling api.* directly in components.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientKeys = {
  all: ['clients'] as const,
  list: (page = 1, pageSize = 100) => [...clientKeys.all, 'list', { page, pageSize }] as const,
  detail: (id: string) => [...clientKeys.all, id] as const,
};

export function useClients(page = 1, pageSize = 100) {
  return useQuery({
    queryKey: clientKeys.list(page, pageSize),
    queryFn: () => api.getClients(),
    staleTime: 60 * 1000,
  });
}

export function useClient(id: string | null) {
  return useQuery({
    queryKey: clientKeys.detail(id!),
    queryFn: () => api.getClient(id!),
    enabled: !!id,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateClient(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

// ─── Works ────────────────────────────────────────────────────────────────────
export const workKeys = {
  all: ['works'] as const,
  list: () => [...workKeys.all, 'list'] as const,
  detail: (id: string) => [...workKeys.all, id] as const,
};

export function useWorks() {
  return useQuery({
    queryKey: workKeys.list(),
    queryFn: () => api.getWorks(),
    staleTime: 2 * 60 * 1000, // Works change less frequently
  });
}

export function useWork(id: string | null) {
  return useQuery({
    queryKey: workKeys.detail(id!),
    queryFn: () => api.getWork(id!),
    enabled: !!id,
  });
}

// ─── Referral Consultants (Partners) ─────────────────────────────────────────
export const partnerKeys = {
  all: ['referral-consultants'] as const,
  list: () => [...partnerKeys.all, 'list'] as const,
  leads: (consultantId?: string) => [...partnerKeys.all, 'leads', consultantId] as const,
  commissions: (consultantId?: string) => [...partnerKeys.all, 'commissions', consultantId] as const,
};

export function useReferralConsultants() {
  return useQuery({
    queryKey: partnerKeys.list(),
    queryFn: () => api.getReferralConsultants({}),
    staleTime: 60 * 1000,
  });
}

export function useReferralLeads(consultantId?: string) {
  return useQuery({
    queryKey: partnerKeys.leads(consultantId),
    queryFn: () => api.getReferralLeads({ consultantId }),
    staleTime: 30 * 1000,
  });
}

export function useReferralCommissions(consultantId?: string) {
  return useQuery({
    queryKey: partnerKeys.commissions(consultantId),
    queryFn: () => api.getReferralCommissions({ consultantId }),
    staleTime: 30 * 1000,
  });
}

export function useUpdateReferralLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateReferralLead(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: partnerKeys.all }),
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardKeys = {
  stats: () => ['dashboard', 'stats'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => api.getAdminDashboard(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// ─── Finance ──────────────────────────────────────────────────────────────────
export const financeKeys = {
  all: ['finance'] as const,
  transactions: (filters?: any) => [...financeKeys.all, 'transactions', filters] as const,
  summary: () => [...financeKeys.all, 'summary'] as const,
};

export function useFinanceTransactions(filters?: any) {
  return useQuery({
    queryKey: financeKeys.transactions(filters),
    queryFn: () => api.getFinanceSummary(),
    staleTime: 30 * 1000,
  });
}

// ─── Solar ────────────────────────────────────────────────────────────────────
export const solarKeys = {
  all: ['solar'] as const,
  projects: (page = 1, pageSize = 50) => [...solarKeys.all, 'projects', { page, pageSize }] as const,
  detail: (id: string) => [...solarKeys.all, id] as const,
};

export function useSolarProjects(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: solarKeys.projects(page, pageSize),
    queryFn: () => api.getSolarProjects(),
    staleTime: 60 * 1000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const userKeys = {
  all: ['users'] as const,
  list: () => [...userKeys.all, 'list'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => api.getUsers(),
    staleTime: 5 * 60 * 1000,
  });
}
