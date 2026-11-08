import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import umbrellaApi from '@/services/umbrellaApi';
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
        if (data.avatarUrl) {
          await AsyncStorage.setItem('@user_avatar_url', data.avatarUrl);
        }
        const savedAvatar = await AsyncStorage.getItem('@user_avatar_url');
        setProfile({ ...data, avatarUrl: data.avatarUrl ?? savedAvatar });
      }
      setError(null);
    } catch (err: any) {
      console.log('[useUser] Failed to fetch profile', err.response?.data || err.message);
      setError('Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, [get]);

  const updateNeurodivergence = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        setSaving(true);
        const updated = await patch<UserProfile>('public/users/me/neurodivergence', text, {
          'Content-Type': 'text/plain',
        });
        setProfile(updated);
        return true;
      } catch (err: any) {
        console.log('[useUser] Failed to update neurodivergence', err.response?.data || err.message);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [patch],
  );

  const uploadAvatar = useCallback(async (imageAssetOrUri: any): Promise<string | null> => {
    try {
      setUploadingAvatar(true);
      const token = await AsyncStorage.getItem('@user_token');

      const asset = typeof imageAssetOrUri === 'string' ? { uri: imageAssetOrUri } : imageAssetOrUri;
      const uri: string = asset?.uri;
      const originalFileName: string = asset?.fileName || uri?.split('/').pop() || 'avatar.jpg';
      const filename = originalFileName.includes('.') ? originalFileName : `${originalFileName}.jpg`;
      const extension = /\.(\w+)$/.exec(filename)?.[1];
      const mimeType: string = asset?.mimeType || (extension ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : 'image/jpeg');

      const formData = new FormData();
      if (uri && (uri.startsWith('blob:') || uri.startsWith('data:'))) {
        const blob = await (await fetch(uri)).blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', { uri, name: filename, type: mimeType } as any);
      }
      formData.append('resourceType', 'image');
      formData.append('fileName', filename);
      formData.append('alternativeText', 'Foto de perfil');

      const config = {
        headers: {
          ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data: any) => data,
      };

      let uploadRes;
      try {
        uploadRes = await umbrellaApi.post('storage/upload', formData, config);
      } catch (firstError: any) {
        console.log('[useUser] Retrying at public/storage/upload...', firstError.response?.data || firstError.message);
        uploadRes = await umbrellaApi.post('public/storage/upload', formData, config);
      }

      const uploadedUrl: string | undefined = uploadRes.data?.url;
      if (!uploadedUrl) return null;

      setProfile((prev) => (prev ? { ...prev, avatarUrl: uploadedUrl } : null));
      await AsyncStorage.setItem('@user_avatar_url', uploadedUrl);
      return uploadedUrl;
    } catch (err: any) {
      console.log('[useUser] Failed to upload avatar', err.response?.data || err.message);
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, saving, uploadingAvatar, error, fetchProfile, updateNeurodivergence, uploadAvatar };
}
