import { useCallback } from 'react';
import umbrellaApi from '@/services/umbrellaApi';
import { notifySessionExpired } from '@/services/sessionEvents';
import { isJwtExpired } from '@/utils/jwt';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUBLIC_AUTH_PREFIX = 'auth/';

async function fetchToken(relativeUrl: string): Promise<string | null> {
    if (relativeUrl.startsWith(PUBLIC_AUTH_PREFIX)) return null;

    try {
        const token = await AsyncStorage.getItem('@user_token');
        if (isJwtExpired(token)) {
            notifySessionExpired();
            return null;
        }
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

type Body = Record<string, any> | string;
type Headers = Record<string, string>;

export function useUmbrellaApi() {
    const request = useCallback(async <T = any>(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        relativeUrl: string,
        body?: Body,
        extraHeaders: Headers = {},
    ): Promise<T> => {
        const token = await fetchToken(relativeUrl);
        try {
            const response = await umbrellaApi.request<T>({
                method,
                url: relativeUrl,
                data: body,
                headers: { ...authHeaders(token), ...extraHeaders },
            });
            return response.data;
        } catch (error: any) {
            console.log(`[useUmbrellaApi ${method.toUpperCase()} ${relativeUrl}]`, error.response?.data || error.message);
            throw error;
        }
    }, []);

    const get = useCallback(<T = any>(relativeUrl: string) => request<T>('get', relativeUrl), [request]);
    const del = useCallback(<T = any>(relativeUrl: string) => request<T>('delete', relativeUrl), [request]);

    const post = useCallback(
        <T = any>(relativeUrl: string, body: Body = {}, extraHeaders: Headers = {}) =>
            request<T>('post', relativeUrl, body, extraHeaders),
        [request],
    );
    const put = useCallback(
        <T = any>(relativeUrl: string, body: Body = {}) => request<T>('put', relativeUrl, body),
        [request],
    );
    const patch = useCallback(
        <T = any>(relativeUrl: string, body: Body = {}, extraHeaders: Headers = {}) =>
            request<T>('patch', relativeUrl, body, extraHeaders),
        [request],
    );

    return { post, get, del, put, patch };
}
