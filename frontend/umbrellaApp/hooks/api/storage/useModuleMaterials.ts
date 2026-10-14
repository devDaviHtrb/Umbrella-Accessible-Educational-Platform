import { useState, useEffect, useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';
import type { ModuleMaterial } from '@/types/materials';

export function useModuleMaterials(moduleId?: string | number | null) {
  const { get } = useUmbrellaApi();
  const [materials, setMaterials] = useState<ModuleMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!moduleId) {
      setMaterials([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let data: ModuleMaterial[] | null = null;
      try {
        data = await get<ModuleMaterial[]>(`public/storage/module/${moduleId}`);
      } catch (firstErr: any) {
        // Fallback in case endpoint is mounted at storage/module
        data = await get<ModuleMaterial[]>(`storage/module/${moduleId}`);
      }
      console.log(`[useModuleMaterials] Fetched for module ${moduleId}:`, data);
      if (Array.isArray(data)) {
        setMaterials(data);
      } else {
        setMaterials([]);
      }
    } catch (err: any) {
      console.warn(`[useModuleMaterials] Error fetching materials for module ${moduleId}:`, err.response?.data || err.message);
      setError('Não foi possível carregar os materiais deste módulo.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [get, moduleId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  return {
    materials,
    loading,
    error,
    refetch: fetchMaterials,
  };
}
