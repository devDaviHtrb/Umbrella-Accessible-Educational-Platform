import umbrellaApi from "@/services/umbrellaApi";

export function useUmbrellaApi() {

    // Helper function to dynamically inject the bearer token
    const getHeaders = (token: string | null) => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Generic POST method
    const post = async <T = any>(
        relativeUrl: string,
        body: Record<string, any> = {},
        token: string | null = null
    ): Promise<T> => {
        try {
            const response = await umbrellaApi.post<T>(relativeUrl, body, {
                headers: getHeaders(token),
            });
            return response.data;
        } catch (error: any) {
            console.log(`[useUmbrellaApi POST ${relativeUrl}]`, error.response?.data || error.message);
            throw error;
        }
    };

    // Generic GET method
    const get = async <T = any>(
        relativeUrl: string,
        token: string | null = null
    ): Promise<T> => {
        try {
            const response = await umbrellaApi.get<T>(relativeUrl, {
                headers: getHeaders(token),
            });
            return response.data;
        } catch (error: any) {
            console.log(`[useUmbrellaApi GET ${relativeUrl}]`, error.response?.data || error.message);
            throw error;
        }
    };

    return { post, get };
}
