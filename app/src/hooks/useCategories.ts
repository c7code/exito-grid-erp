import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';

interface Category {
  id: string;
  group: string;
  value: string;
  label: string;
  config: string;
  order: number;
  active: boolean;
}

const cache: Record<string, { data: Category[]; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 min

export function useCategories(group: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    // Check cache
    const cached = cache[group];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setCategories(cached.data);
      return;
    }

    setLoading(true);
    try {
      const data = await api.getCategories(group);
      const arr = Array.isArray(data) ? data : [];
      cache[group] = { data: arr, ts: Date.now() };
      setCategories(arr);
    } catch {
      // Fallback: empty
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => { load(); }, [load]);

  const invalidate = useCallback(() => {
    delete cache[group];
    load();
  }, [group, load]);

  return { categories, loading, invalidate };
}
