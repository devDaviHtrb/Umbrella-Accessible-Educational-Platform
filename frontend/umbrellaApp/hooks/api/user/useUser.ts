import { useState, useEffect, useCallback } from 'react';
import { useUmbrellaApi } from '../core/useUmbrellaApi';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  neurodivergence?: string | null;
  avatarUrl?: string | null;
}

export function useUser() {
  const { get, patch } = useUmbrellaApi();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get<UserProfile>('public/users/me');
      if (data) {
        setProfile(data);
        if (data.avatarUrl) {
          await (await import('@react-native-async-storage/async-storage')).default.setItem(
            '@user_avatar_url',
            data.avatarUrl
          );
        }
      }
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

  const uploadAvatar = useCallback(async (imageAssetOrUri: any): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('@user_token');
      
      const uri = typeof imageAssetOrUri === 'string' ? imageAssetOrUri : imageAssetOrUri?.uri;
      const originalFileName = typeof imageAssetOrUri === 'object' && imageAssetOrUri?.fileName ? imageAssetOrUri.fileName : (uri?.split('/').pop() || 'avatar.jpg');
      const filename = originalFileName.includes('.') ? originalFileName : `${originalFileName}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = (typeof imageAssetOrUri === 'object' && imageAssetOrUri?.mimeType) 
        ? imageAssetOrUri.mimeType 
        : (match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg');

      const formData = new FormData();

      // Check if running on web platform with blob or file
      if (typeof window !== 'undefined' && uri && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, filename);
      } else {
        // Native React Native FormData format
        formData.append('file', {
          uri: uri,
          name: filename,
          type: mimeType,
        } as any);
      }

      formData.append('resourceType', 'image');
      formData.append('fileName', filename);
      formData.append('alternativeText', 'Foto de perfil');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const umbrellaApi = (await import('@/services/umbrellaApi')).default;
      let uploadRes: any;
      try {
        uploadRes = await umbrellaApi.post('storage/upload', formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: (data) => data, // Ensure Axios does not serialize FormData to string
        });
      } catch (e1: any) {
        console.log('[useUser] Retrying at public/storage/upload...', e1.response?.data || e1.message);
        uploadRes = await umbrellaApi.post('public/storage/upload', formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: (data) => data,
        });
      }

      const uploadedUrl = uploadRes?.data?.url || uploadRes?.url;
      if (uploadedUrl) {
        setProfile((prev) => (prev ? { ...prev, avatarUrl: uploadedUrl } : null));
        await (await import('@react-native-async-storage/async-storage')).default.setItem(
          '@user_avatar_url',
          uploadedUrl
        );
        return uploadedUrl;
      }
      return null;
    } catch (err: any) {
      console.log('[useUser] Failed to upload avatar', err.response?.data || err.message);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    // Also load cached avatar if present
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      AsyncStorage.getItem('@user_avatar_url').then((savedAvatar) => {
        if (savedAvatar) {
          setProfile((prev) => (prev ? { ...prev, avatarUrl: savedAvatar } : prev));
        }
      });
    });
  }, [fetchProfile]);

  return { profile, loading, saving, uploadingAvatar, error, fetchProfile, updateNeurodivergence, uploadAvatar };
}
