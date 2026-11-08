import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useAuthApi, LoginData, RegisterData, AuthResponse } from '@/hooks/api/auth/useAuth';
import { setSessionExpiredHandler } from '@/services/sessionEvents';
import { isJwtExpired } from '@/utils/jwt';

export interface UserData {
    id: string;
    name: string;
    email: string;
    roles: string[];
}

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: UserData | null;
    userName: string | null;
    userEmail: string | null;
    userId: string | null;
    userRoles: string[];
    userToken: string | null;
    login: (data: LoginData) => Promise<AuthResponse>;
    register: (data: RegisterData) => Promise<AuthResponse>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function readStoredUser(storedUser: string | null, storedName: string | null): UserData | null {
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch {}
    }
    return storedName ? { id: '', name: storedName, email: '', roles: [] } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { login: apiLogin, register: apiRegister } = useAuthApi();

    const [userToken, setUserToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            try {
                const [token, storedUser, storedName] = await Promise.all([
                    AsyncStorage.getItem('@user_token'),
                    AsyncStorage.getItem('@user_data'),
                    AsyncStorage.getItem('@user_name'),
                ]);

                if (token && isJwtExpired(token)) {
                    await AsyncStorage.multiRemove(['@user_token', '@user_name', '@user_data', '@user_avatar_url']);
                } else if (token) {
                    setUserToken(token);
                    setUser(readStoredUser(storedUser, storedName));
                }
            } catch (error) {
                console.log("[AuthContext] Erro ao carregar dados do Storage:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadStorageData();
    }, []);

    const saveSession = async (response: AuthResponse) => {
        if (!response?.accessToken) return;

        const userData: UserData = {
            id: String(response.userId),
            name: response.name,
            email: response.email,
            roles: response.roles || [],
        };
        setUserToken(response.accessToken);
        setUser(userData);
        await Promise.all([
            AsyncStorage.setItem('@user_token', response.accessToken),
            AsyncStorage.setItem('@user_data', JSON.stringify(userData)),
            AsyncStorage.setItem('@user_name', response.name),
        ]);
    };

    const login = async (data: LoginData): Promise<AuthResponse> => {
        const response = await apiLogin(data);
        await saveSession(response);
        return response;
    };

    const register = async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiRegister(data);
        await saveSession(response);
        return response;
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['@user_token', '@user_name', '@user_data', '@user_avatar_url']);
        } catch (error) {
            console.log("[AuthContext] Erro ao deslogar:", error);
        } finally {
            setUserToken(null);
            setUser(null);
        }
    };

    useEffect(() => {
        setSessionExpiredHandler(() => {
            logout();
        });
        return () => setSessionExpiredHandler(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!userToken,
                isLoading,
                user,
                userName: user?.name || null,
                userEmail: user?.email || null,
                userId: user?.id || null,
                userRoles: user?.roles || [],
                userToken,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    return useContext(AuthContext);
}
