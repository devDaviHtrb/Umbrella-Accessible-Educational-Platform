import { useCallback } from 'react';
import umbrellaApi from '@/services/umbrellaApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function fetchToken(): Promise<string | null> {
    try {
        const token = await AsyncStorage.getItem('@user_token');
        return token;
    } catch (e) {
        console.warn('[useUmbrellaApi] Failed to read token from storage', e);
        return null;
    }
}

function authHeaders(token: string | null) {
    if (!token) return {};
    const formatted = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return { Authorization: formatted };
}

export function useUmbrellaApi() {
    const post = useCallback(async <T = any>(relativeUrl: string, body: Record<string, any> = {}): Promise<T> => {
        const token = await fetchToken();
        try {
            const response = await umbrellaApi.post<T>(relativeUrl, body, { headers: authHeaders(token) });
            return response.data;
        } catch (error: any) {
            console.log(`[useUmbrellaApi POST ${relativeUrl}]`, error.response?.data || error.message);
            throw error;
        }
    }, []);

    const get = useCallback(async <T = any>(relativeUrl: string): Promise<T> => {
        const token = await fetchToken();
        try {
            const response = await umbrellaApi.get<T>(relativeUrl, { headers: authHeaders(token) });
            return response.data;
        } catch (error: any) {
            console.log(`[useUmbrellaApi GET ${relativeUrl}]`, error.response?.data || error.message);
            throw error;
        }
    }, []);

    const del = useCallback(async <T = any>(relativeUrl: string): Promise<T> => {
        const token = await fetchToken();
        try {
            const response = await umbrellaApi.delete<T>(relativeUrl, { headers: authHeaders(token) });
            return response.data;
        } catch (error: any) {
            console.log(`[useUmbrellaApi DELETE ${relativeUrl}]`, error.response?.data || error.message);
            throw error;
        }
    }, []);

    return { post, get, del };
}