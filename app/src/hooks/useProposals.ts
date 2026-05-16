/**
 * Centralized React Query hooks for the Proposals domain.
 * These hooks provide automatic caching, background refetch,
 * and stale-while-revalidate behavior for proposal data.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const proposalKeys = {
  all: ['proposals'] as const,
  list: (status?: string, page = 1, pageSize = 100) =>
    [...proposalKeys.all, 'list', { status, page, pageSize }] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
  revisions: (id: string) => [...proposalKeys.all, 'revisions', id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch paginated proposal list with automatic caching */
export function useProposals(status?: string, page = 1, pageSize = 100) {
  return useQuery({
    queryKey: proposalKeys.list(status, page, pageSize),
    queryFn: async () => {
      const data = await api.getProposals(status, page, pageSize);
      // Normalize: support both legacy array and new paginated response
      if (Array.isArray(data)) return { data, total: data.length, page, pageSize };
      return data as { data: any[]; total: number; page: number; pageSize: number };
    },
    placeholderData: (prev) => prev, // Keep previous data while fetching new page
  });
}

/** Fetch single proposal with caching */
export function useProposal(id: string | null) {
  return useQuery({
    queryKey: proposalKeys.detail(id!),
    queryFn: () => api.getProposal(id!),
    enabled: !!id,
  });
}

/** Fetch proposal revisions */
export function useProposalRevisions(id: string | null) {
  return useQuery({
    queryKey: proposalKeys.revisions(id!),
    queryFn: () => api.getProposalRevisions(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // Revisions rarely change
  });
}

/** Mutation: update proposal — automatically invalidates list cache */
export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProposal(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
      qc.invalidateQueries({ queryKey: proposalKeys.detail(id) });
    },
  });
}

/** Mutation: delete proposal — automatically invalidates list cache */
export function useDeleteProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProposal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
    },
  });
}

/** Mutation: duplicate proposal */
export function useDuplicateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: any }) => api.duplicateProposal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.all });
    },
  });
}
