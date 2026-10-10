import { useState, useEffect, useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  neurodivergence?: string | null;
}

export function useUser() {
  const { get, patch } = useUmbrellaApi();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get<UserProfile>('public/users/me');
      setProfile(data);
      setError(null);
    } catch (err: any) {
      console.log('[useUser] Failed to fetch profile', err.response?.data || err.message);
      setError('Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, [get]);

  const updateNeurodivergence = useCallback(async (text: string): Promise<boolean> => {
    try {
      setSaving(true);
      // Backend expects a raw string body (not JSON object)
      const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('@user_token');
      const headers: Record<string, string> = { 'Content-Type': 'text/plain' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const umbrellaApi = (await import('@/services/umbrellaApi')).default;
      const response = await umbrellaApi.patch<UserProfile>('public/users/me/neurodivergence', text, { headers });
      setProfile(response.data);
      return true;
    } catch (err: any) {
      console.log('[useUser] Failed to update neurodivergence', err.response?.data || err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, saving, error, fetchProfile, updateNeurodivergence };
}
